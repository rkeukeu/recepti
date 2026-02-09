from .models import Recipe
import json
from flask import Blueprint, request, jsonify, current_app
from .models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from . import socketio, mail
import bcrypt
from datetime import datetime

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
