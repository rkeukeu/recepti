from flask import Blueprint, request, jsonify, current_app
from .models import db, Recipe, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

recipe_bp = Blueprint('recipe', __name__)

@recipe_bp.route('/', methods=['POST'])
@jwt_required()
def dodaj_recept():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.uloga not in ['autor', 'administrator']:
        return jsonify({"msg": "Nemate dozvolu za objavu recepata"}), 403

    data = request.get_json()
    
    # Osnovna validacija
    if not data.get('naslov') or data.get('vreme_pripreme', 0) <= 0:
        return jsonify({"msg": "Naslov je obavezan i vreme mora biti veće od 0"}), 400

    novi_recept = Recipe(
        naslov=data['naslov'],
        opis=data['opis'],
        sastojci=data['sastojci'],
        vreme_pripreme=data['vreme_pripreme'],
        tezina=data.get('tezina', 'Srednje'),
        autor_id=user.id
    )
    
    db.session.add(novi_recept)
    db.session.commit()
    
    # Brisanje keša pretrage
    kljucevi = current_app.redis.keys("pretraga:*")
    if kljucevi: current_app.redis.delete(*kljucevi)

    return jsonify({"msg": "Recept uspešno dodat", "id": novi_recept.id}), 201

@recipe_bp.route('/pretraga', methods=['GET'])
def pretrazi_recepte():
    upit = request.args.get('q', '')
    kljuc_kesa = f"pretraga:{upit}"
    
    kesirani_rezultati = current_app.redis.get(kljuc_kesa)
    if kesirani_rezultati:
        return jsonify(json.loads(kesirani_rezultati)), 200

    recepti = Recipe.query.filter(Recipe.naslov.ilike(f"%{upit}%")).all()
    rezultati = [{
        "id": r.id,
        "naslov": r.naslov,
        "vreme": r.vreme_pripreme,
        "autor": f"{r.autor.ime} {r.autor.prezime}"
    } for r in recepti]

    current_app.redis.setex(kljuc_kesa, 300, json.dumps(rezultati))
    return jsonify(rezultati), 200