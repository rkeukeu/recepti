from flask import Blueprint, request, jsonify, current_app
from .models import db, Recipe, User, Comment, Rating
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

recipe_bp = Blueprint('recipe', __name__)

# --- DODAVANJE RECEPTA ---
@recipe_bp.route('/dodaj', methods=['POST'])
@jwt_required()
def dodaj_recept():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.uloga not in ['autor', 'administrator']:
        return jsonify({"msg": "Nemate dozvolu za objavu recepata"}), 403

    data = request.get_json()
    if not data.get('naslov') or not data.get('vreme_pripreme'):
        return jsonify({"msg": "Naslov i vreme su obavezni"}), 400

    novi_recept = Recipe(
        naslov=data['naslov'],
        tip_jela=data.get('tip_jela'),
        vreme_pripreme=data['vreme_pripreme'],
        tezina=data.get('tezina', 'Srednje'),
        broj_osoba=data.get('broj_osoba'),
        sastojci=data.get('sastojci'),
        koraci=data.get('koraci'),
        slika=data.get('slika'),
        oznake=data.get('oznake'),
        autor_id=user.id
    )
    
    db.session.add(novi_recept)
    db.session.commit()
    
    kljucevi = current_app.redis.keys("pretraga:*")
    if kljucevi: 
        current_app.redis.delete(*kljucevi)

    return jsonify({"msg": "Recept uspešno dodat", "id": novi_recept.id}), 201

# --- PREUZIMANJE JEDNOG RECEPTA (DOPUNJENO) ---
@recipe_bp.route('/<int:id>', methods=['GET'])
def preuzmi_recept(id):
    r = Recipe.query.get_or_404(id)
    
    # Računanje prosečne ocene
    sve_ocene = [o.vrednost for o in r.ocene]
    prosek = sum(sve_ocene) / len(sve_ocene) if sve_ocene else 0

    return jsonify({
        "id": r.id,
        "naslov": r.naslov,
        "tip_jela": r.tip_jela,
        "vreme": r.vreme_pripreme,
        "tezina": r.tezina,
        "broj_osoba": r.broj_osoba,
        "sastojci": r.sastojci,
        "koraci": r.koraci,
        "slika": r.slika,
        "oznake": r.oznake,
        "autor": f"{r.autor.ime} {r.autor.prezime}",
        "prosecna_ocena": round(prosek, 1),
        "broj_ocena": len(sve_ocene),
        "komentari": [{
            "id": k.id,
            "tekst": k.tekst,
            "autor": k.ime_autora_komentara,
            "datum": k.datum_postavljanja.strftime("%d.%m.%Y. %H:%M") if hasattr(k, 'datum_postavljanja') else None
        } for k in r.komentari[::-1]] # Najnoviji komentari prvi
    }), 200

# --- PRETRAGA RECEPATA ---
@recipe_bp.route('/pretraga', methods=['GET'])
def pretrazi_recepte():
    upit = request.args.get('q', '')
    kljuc_kesa = f"pretraga:{upit}"
    
    kesirani_rezultati = current_app.redis.get(kljuc_kesa)
    if kesirani_rezultati:
        return jsonify(json.loads(kesirani_rezultati)), 200

    recepti = Recipe.query.filter(Recipe.naslov.ilike(f"%{upit}%")).all()
    
    rezultati = []
    for r in recepti:
        rezultati.append({
            "id": r.id,
            "naslov": r.naslov,
            "vreme": r.vreme_pripreme,
            "tezina": r.tezina,
            "slika": r.slika,
            "autor": f"{r.autor.ime} {r.autor.prezime}"
        })

    current_app.redis.setex(kljuc_kesa, 300, json.dumps(rezultati))
    return jsonify(rezultati), 200

# --- INTERAKCIJA (OCENA I KOMENTAR) ---
@recipe_bp.route('/<int:id>/interakcija', methods=['POST'])
@jwt_required()
def ostavi_interakciju(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    nova_ocena_val = data.get('vrednost')
    if nova_ocena_val:
        Rating.query.filter_by(user_id=user_id, recipe_id=id).delete()
        nova_ocena = Rating(vrednost=nova_ocena_val, user_id=user_id, recipe_id=id)
        db.session.add(nova_ocena)

    tekst_komentara = data.get('komentar')
    if tekst_komentara:
        novi_komentar = Comment(
            tekst=tekst_komentara,
            user_id=user_id,
            recipe_id=id,
            ime_autora_komentara=f"{user.ime} {user.prezime}"
        )
        db.session.add(novi_komentar)

    db.session.commit()
    return jsonify({"msg": "Uspešno sačuvano!"}), 201

# --- OMILJENI RECEPTI (TOGGLE) ---
@recipe_bp.route('/<int:id>/omiljeni', methods=['POST'])
@jwt_required()
def toggle_omiljeni(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    recept = Recipe.query.get_or_404(id)

    if recept in user.lista_omiljenih:
        user.lista_omiljenih.remove(recept)
        poruka = "uklonjen iz omiljenih"
        dodato = False
    else:
        user.lista_omiljenih.append(recept)
        poruka = "dodat u omiljene"
        dodato = True

    db.session.commit()
    return jsonify({"msg": f"Recept {poruka}", "dodato": dodato}), 200

# --- BRISANJE RECEPTA ---
@recipe_bp.route('/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def obrisi_recept(recipe_id):
    user_id = int(get_jwt_identity())
    recept = Recipe.query.get(recipe_id)
    
    if not recept:
        return jsonify({"msg": "Recept nije pronađen"}), 404
        
    if recept.autor_id != user_id:
        user = User.query.get(user_id)
        if user.uloga != 'administrator':
            return jsonify({"msg": "Možete obrisati samo svoje recepte"}), 403
            
    db.session.delete(recept)
    db.session.commit()
    
    kljucevi = current_app.redis.keys("pretraga:*")
    if kljucevi: current_app.redis.delete(*kljucevi)
    
    return jsonify({"msg": "Recept obrisan"}), 200

# --- PREUZIMANJE OMIJENIH RECEPATA ---
@recipe_bp.route('/omiljeni', methods=['GET'])
@jwt_required()
def get_omiljeni():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    omiljeni = []
    for recept in user.lista_omiljenih:
        omiljeni.append({
            "id": recept.id,
            "naslov": recept.naslov,
            "vreme": recept.vreme_pripreme,
            "tezina": recept.tezina,
            "slika": recept.slika,
            "autor": f"{recept.autor.ime} {recept.autor.prezime}"
        })
    
    return jsonify(omiljeni), 200