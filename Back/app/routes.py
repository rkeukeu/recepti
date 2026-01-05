from flask import Blueprint, request, jsonify, current_app
from .models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from app import socketio, mail, db
import bcrypt

auth_bp = Blueprint('auth', __name__)

# --- REGISTRACIJA ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Korisnik sa tim emailom već postoji"}), 400

    hashed_pw = bcrypt.hashpw(data['lozinka'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    novi_korisnik = User(
        ime=data['ime'],
        prezime=data['prezime'],
        email=data['email'],
        lozinka=hashed_pw,
        datum_rodjenja=data.get('datum_rodjenja'),
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
    lozinka = data.get('lozinka') 

    block_key = f"blokada:{email}"
    if current_app.redis.get(block_key):
        return jsonify({"msg": "Nalog je blokiran na 15 minuta."}), 403

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.checkpw(lozinka.encode('utf-8'), user.lozinka.encode('utf-8')):
        fail_key = f"pokusaji:{email}"
        attempts = current_app.redis.incr(fail_key)
        current_app.redis.expire(fail_key, 600)

        if attempts >= 3:
            current_app.redis.setex(block_key, 900, "blokiran")
            return jsonify({"msg": "Blokirani ste na 15 minuta zbog 3 neuspešna pokušaja."}), 403
            
        return jsonify({"msg": f"Pogrešni podaci. Preostalo pokušaja: {3-attempts}"}), 401

    current_app.redis.delete(f"pokusaji:{email}")
    token = create_access_token(identity=str(user.id), additional_claims={"uloga": user.uloga})
    return jsonify({"token": token, "uloga": user.uloga}), 200

# --- ZAHTEV ZA AUTORA ---
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

# --- ADMIN ODOBRAVANJE (EMAIL) ---
@auth_bp.route('/admin/odobri-autora/<int:target_id>', methods=['POST'])
@jwt_required()
def odobri_autora(target_id):
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if admin.uloga != 'administrator':
        return jsonify({"msg": "Pristup odbijen. Niste administrator."}), 403

    user = User.query.get(target_id)
    if not user:
        return jsonify({"msg": "Korisnik nije nađen"}), 404

    user.uloga = 'autor'
    db.session.commit()

    try:
        msg = Message("Vaša uloga je promenjena",
                      sender="podrska@recepti.com",
                      recipients=[user.email])
        msg.body = f"Zdravo {user.ime}, administrator je odobrio Vaš zahtev. Sada ste autor!"
        mail.send(msg)
    except Exception as e:
        print(f"Greška pri slanju mejla: {e}")

    return jsonify({"msg": f"Korisnik {user.email} je sada autor."}), 200