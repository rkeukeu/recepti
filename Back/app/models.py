from . import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ime = db.Column(db.String(50), nullable=False)
    prezime = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    lozinka = db.Column(db.String(255), nullable=False)
    datum_rodjenja = db.Column(db.String(20))
    pol = db.Column(db.String(10))
    drzava = db.Column(db.String(50))
    ulica = db.Column(db.String(100))
    broj = db.Column(db.String(10))
    uloga = db.Column(db.String(20), default='čitalac')
    recepti = db.relationship('Recipe', backref='autor', lazy=True)

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    naslov = db.Column(db.String(100), nullable=False)
    opis = db.Column(db.Text, nullable=False)
    sastojci = db.Column(db.Text, nullable=False) 
    vreme_pripreme = db.Column(db.Integer, nullable=False) 
    tezina = db.Column(db.String(20)) 
    datum_objave = db.Column(db.DateTime, default=datetime.utcnow)
    autor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)