from .models import Recipe
import json
from flask import Blueprint, request, jsonify, current_app
from .models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from . import socketio, mail
import bcrypt
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

auth_bp = Blueprint('auth', __name__)

# --- REGISTRACIJA ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Korisnik sa tim emailom već postoji"}), 400

    hashed_pw = bcrypt.hashpw(data['lozinka'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Konverzija datuma iz stringa (npr. "1995-05-20") u Python date objekat
    datum_rodj = None
    if data.get('datum_rodjenja'):
        try:
            datum_rodj = datetime.strptime(data['datum_rodjenja'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"msg": "Neispravan format datuma (YYYY-MM-DD)"}), 400

    novi_korisnik = User(
        ime=data['ime'],
        prezime=data['prezime'],
        email=data['email'],
        lozinka=hashed_pw,
        datum_rodjenja=datum_rodj,
        pol=data.get('pol'),
        drzava=data.get('drzava'),
        ulica=data.get('ulica'),
        broj=data.get('broj'),
        uloga='čitalac' 
    )

    db.session.add(novi_korisnik)
    db.session.commit()
    return jsonify({"msg": "Uspešna registracija"}), 201

# --- LOGIN SA REDIS BLOKADOM ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    lozinka_pokusaj = data.get('lozinka') 

    block_key = f"blokada:{email}"
    if current_app.redis.get(block_key):
        return jsonify({"msg": "Nalog je privremeno blokiran (15 min)."}), 403

    user = User.query.filter_by(email=email).first()

    # Provera postojanja korisnika i ispravnosti lozinke
    if not user or not bcrypt.checkpw(lozinka_pokusaj.encode('utf-8'), user.lozinka.encode('utf-8')):
        fail_key = f"pokusaji:{email}"
        attempts = current_app.redis.incr(fail_key)
        current_app.redis.expire(fail_key, 600) 

        if attempts >= 3:
            current_app.redis.setex(block_key, 900, "blokiran") # Blokada 15 minuta
            return jsonify({"msg": "Blokirani ste na 15 minuta zbog 3 neuspešna pokušaja."}), 403
            
        return jsonify({"msg": f"Pogrešni podaci. Preostalo pokušaja: {3-attempts}"}), 401

    current_app.redis.delete(f"pokusaji:{email}")
    
    token = create_access_token(identity=str(user.id), additional_claims={"uloga": user.uloga})
    return jsonify({"token": token, "uloga": user.uloga}), 200

# --- ZAHTEV ZA AUTORA (Real-time obaveštenje) ---
@auth_bp.route('/postani-autor', methods=['POST'])
@jwt_required()
def zatrazi_ulogu_autora():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.uloga == 'autor':
        return jsonify({"msg": "Već ste autor"}), 400

    socketio.emit('novi_zahtev', {
        'ime': f"{user.ime} {user.prezime}",
        'email': user.email,
        'user_id': user.id
    })
    return jsonify({"msg": "Zahtev poslat administratoru!"}), 200

# --- ADMIN ODOBRAVANJE (Slanje mejla) ---
@auth_bp.route('/admin/odobri-autora/<int:target_id>', methods=['POST'])
@jwt_required()
def odobri_autora(target_id):
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if admin.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može da odobrava uloge."}), 403

    user = User.query.get(target_id)
    if not user:
        return jsonify({"msg": "Korisnik nije nađen"}), 404

    user.uloga = 'autor'
    db.session.commit()

    try:
        msg = Message("Odobren zahtev za autora",
                      sender=current_app.config['MAIL_USERNAME'],
                      recipients=[user.email])
        msg.body = f"Zdravo {user.ime}, Vaš zahtev je odobren. Sada možete postavljati recepte!"
        mail.send(msg)
    except Exception as e:
        print(f"Mejl nije poslat: {e}")

    return jsonify({"msg": f"Korisnik {user.email} je sada autor."}), 200


# --- PROFIL: PREUZIMANJE PODATAKA ---
@auth_bp.route('/moj-profil', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"msg": "Korisnik nije pronađen"}), 404
        
    return jsonify({
        "ime": user.ime,
        "prezime": user.prezime,
        "email": user.email,
        "uloga": user.uloga,
        "slika_profila": user.slika_profila,
        "drzava": user.drzava,
        "ulica": user.ulica,
        "broj": user.broj,
        "pol": user.pol,
        "datum_rodjenja": str(user.datum_rodjenja) if user.datum_rodjenja else None
    }), 200

# --- PROFIL: AŽURIRANJE PODATAKA ---
@auth_bp.route('/azuriraj-profil', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not user:
        return jsonify({"msg": "Korisnik nije pronađen"}), 404

    user.ime = data.get('ime', user.ime)
    user.prezime = data.get('prezime', user.prezime)
    user.slika_profila = data.get('slika_profila', user.slika_profila)
    user.drzava = data.get('drzava', user.drzava)
    user.ulica = data.get('ulica', user.ulica)
    user.broj = data.get('broj', user.broj)
    user.pol = data.get('pol', user.pol)

    datum_str = data.get('datum_rodjenja')
    if datum_str:
        try:
            user.datum_rodjenja = datetime.strptime(datum_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    try:
        db.session.commit()
        return jsonify({"msg": "Profil uspešno ažuriran"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Greška pri čuvanju podataka", "error": str(e)}), 500
    
@auth_bp.route("/favorites/<int:recipe_id>", methods=["POST"])
@jwt_required()
def add_favorite(recipe_id):
    user_id = get_jwt_identity()

    user = User.query.get_or_404(user_id)
    recipe = Recipe.query.get_or_404(recipe_id)

    if recipe in user.lista_omiljenih:
        return jsonify({"message": "Already in favorites"}), 400

    user.lista_omiljenih.append(recipe)
    db.session.commit()

    current_app.redis.delete(f"favorites:user:{user_id}")

    return jsonify({"message": "Added to favorites"}), 201

@auth_bp.route("/favorites/<int:recipe_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(recipe_id):
    user_id = get_jwt_identity()

    user = User.query.get_or_404(user_id)
    recipe = Recipe.query.get_or_404(recipe_id)

    if recipe not in user.lista_omiljenih:
        return jsonify({"message": "Not in favorites"}), 404

    user.lista_omiljenih.remove(recipe)
    db.session.commit()

    current_app.redis.delete(f"favorites:user:{user_id}")

    return jsonify({"message": "Removed from favorites"}), 200

@auth_bp.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    user_id = get_jwt_identity()
    cache_key = f"favorites:user:{user_id}"

    cached = current_app.redis.get(cache_key)
    if cached:
        return jsonify(json.loads(cached)), 200

    user = User.query.get_or_404(user_id)

    data = [{
        "id": r.id,
        "naslov": r.naslov,
        "slika": r.slika
    } for r in user.lista_omiljenih]

    current_app.redis.setex(cache_key, 600, json.dumps(data))
    return jsonify(data), 200

# --- ADMIN: PREUZIMANJE SVIH KORISNIKA ---
@auth_bp.route('/admin/korisnici', methods=['GET'])
@jwt_required()
def get_all_users():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if admin.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može da vidi listu korisnika."}), 403
    
    users = User.query.all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "ime": user.ime,
            "prezime": user.prezime,
            "email": user.email,
            "uloga": user.uloga,
            "datum_pridruzivanja": user.datum_pridruzivanja.strftime("%d.%m.%Y.") if user.datum_pridruzivanja else None,
            "broj_recepata": len(user.objavljeni_recepti)
        })
    
    return jsonify(result), 200

# --- ADMIN: BRISANJE KORISNIKA ---
@auth_bp.route('/admin/korisnici/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if admin.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može da briše korisnike."}), 403
    
    if admin_id == user_id:
        return jsonify({"msg": "Ne možete obrisati sopstveni nalog."}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Korisnik nije pronađen."}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"msg": f"Korisnik {user.email} je uspešno obrisan."}), 200

# --- ADMIN: STATISTIKA ---
@auth_bp.route('/admin/statistika', methods=['GET'])
@jwt_required()
def get_statistics():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if admin.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može da vidi statistiku."}), 403
    
    ukupno_korisnika = User.query.count()
    ukupno_autora = User.query.filter_by(uloga='autor').count()
    ukupno_citalaca = User.query.filter_by(uloga='čitalac').count()
    ukupno_administratora = User.query.filter_by(uloga='administrator').count()
    ukupno_recepata = Recipe.query.count()
    
    return jsonify({
        "ukupno_korisnika": ukupno_korisnika,
        "ukupno_autora": ukupno_autora,
        "ukupno_citalaca": ukupno_citalaca,
        "ukupno_administratora": ukupno_administratora,
        "ukupno_recepata": ukupno_recepata
    }), 200

# --- ADMIN: TOP 5 AUTORA PO OCENI (ZA PDF) ---
@auth_bp.route('/admin/top-autori', methods=['GET'])
@jwt_required()
def get_top_authors():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if admin.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može da vidi top autore."}), 403
    
    autori = User.query.filter_by(uloga='autor').all()
    autor_sa_ocenom = []
    
    for autor in autori:
        sve_ocene = []
        for recept in autor.objavljeni_recepti:
            sve_ocene.extend([o.vrednost for o in recept.ocene])
        
        prosecna_ocena = sum(sve_ocene) / len(sve_ocene) if sve_ocene else 0
        broj_recepata = len(autor.objavljeni_recepti)
        
        if broj_recepata > 0:  # Samo autori sa bar jednim receptom
            autor_sa_ocenom.append({
                "id": autor.id,
                "ime": autor.ime,
                "prezime": autor.prezime,
                "email": autor.email,
                "prosecna_ocena": round(prosecna_ocena, 2),
                "broj_recepata": broj_recepata
            })
    
    # Sortiranje po prosečnoj oceni (opadajuće)
    autor_sa_ocenom.sort(key=lambda x: x['prosecna_ocena'], reverse=True)
    top_5 = autor_sa_ocenom[:5]
    
    return jsonify(top_5), 200
    
    def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@auth_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """Endpoint za upload slika"""
    if 'file' not in request.files:
        return jsonify({"msg": "Nema fajla u zahtevu"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "Nije izabran fajl"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"msg": "Nedozvoljen tip fajla. Dozvoljeni: png, jpg, jpeg, gif, webp"}), 400
    
    # Generiši jedinstveno ime fajla
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    
    # Sačuvaj fajl
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(file_path)
    
    # Vrati URL
    file_url = f"/uploads/{unique_filename}"
    return jsonify({
        "msg": "Fajl uspešno uploadovan",
        "url": file_url,
        "filename": unique_filename
    }), 200

# Serviranje uploadovanih fajlova
@auth_bp.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    """Serviraj uploadovane fajlove"""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)