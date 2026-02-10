from . import db
from datetime import datetime

omiljeni_recepti = db.Table('omiljeni_recepti',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipe.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ime = db.Column(db.String(50), nullable=False)
    prezime = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    lozinka = db.Column(db.String(255), nullable=False)
    datum_rodjenja = db.Column(db.Date)
    pol = db.Column(db.String(10))
    drzava = db.Column(db.String(50))
    ulica = db.Column(db.String(100))
    broj = db.Column(db.String(10))
    uloga = db.Column(db.String(20), default='citalac') # čitalac, autor, administrator
    slika_profila = db.Column(db.String(255))
    datum_pridruzivanja = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacije
    objavljeni_recepti = db.relationship('Recipe', backref='autor', lazy=True)
    lista_omiljenih = db.relationship('Recipe', secondary=omiljeni_recepti, backref='fanovi')

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    naslov = db.Column(db.String(100), nullable=False)
    tip_jela = db.Column(db.String(50)) # supa, salata, dezert
    vreme_pripreme = db.Column(db.Integer)
    tezina = db.Column(db.String(20)) # lako, srednje, tesko
    broj_osoba = db.Column(db.Integer)
    sastojci = db.Column(db.Text)
    koraci = db.Column(db.Text)
    slika = db.Column(db.String(255))
    oznake = db.Column(db.String(255)) # npr. vegan, jeftino
    autor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    komentari = db.relationship('Comment', backref='recept', cascade="all, delete-orphan")
    ocene = db.relationship('Rating', backref='recept', cascade="all, delete-orphan")
    datum_objave = db.Column(db.DateTime, default=datetime.utcnow)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    naslov = db.Column(db.String(100))
    tekst = db.Column(db.Text, nullable=False)
    slika_jela = db.Column(db.String(255)) 
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipe.id'))
    ime_autora_komentara = db.Column(db.String(100)) 

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vrednost = db.Column(db.Integer) # 1-5
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipe.id'))
    
class ZahtevZaAutora(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    razlog_odbijanja = db.Column(db.Text)
    datum_zahteva = db.Column(db.DateTime, default=datetime.utcnow)
    datum_odluke = db.Column(db.DateTime)
    
    # Relacija
    korisnik = db.relationship('User', backref=db.backref('zahtevi_za_autora', lazy=True))    