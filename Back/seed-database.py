#!/usr/bin/env python3
"""
MINIMAL seed - only 3 users, 2 recipes
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Recipe
import bcrypt
from datetime import date

def seed_database():
    app = create_app()
    
    with app.app_context():
        if User.query.first():
            print("⚠️  Database has data, skipping seed")
            return
        
        # SAMO 3 KORISNIKA
        admin = User(
            email='admin@recepti.com',
            lozinka=bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode(),
            ime='Admin',
            prezime='Admin',
            uloga='administrator'
        )
        
        autor = User(
            email='autor@recepti.com',
            lozinka=bcrypt.hashpw('autor123'.encode(), bcrypt.gensalt()).decode(),
            ime='Ana',
            prezime='Autor',
            uloga='autor'
        )
        
        citalac = User(
            email='citalac@recepti.com',
            lozinka=bcrypt.hashpw('citalac123'.encode(), bcrypt.gensalt()).decode(),
            ime='Petar',
            prezime='Čitalac',
            uloga='citalac'
        )
        
        db.session.add_all([admin, autor, citalac])
        db.session.commit()
        
        # SAMO 2 RECEPTA
        recept1 = Recipe(
            naslov='Spaghetti Carbonara',
            tip_jela='Glavno jelo',
            vreme_pripreme=30,
            tezina='Srednje',
            broj_osoba=4,
            sastojci='Spaghetti, jaja, panceta',
            koraci='1. Skuvati spaghetti\n2. Ispržiti pancetu\n3. Umutiti jaja',
            autor_id=autor.id
        )
        
        recept2 = Recipe(
            naslov='Palačinke',
            tip_jela='Dezert',
            vreme_pripreme=20,
            tezina='Lako',
            broj_osoba=4,
            sastojci='Jaja, mleko, brašno',
            koraci='1. Izmešati\n2. Pržiti\n3. Servirati',
            autor_id=autor.id
        )
        
        db.session.add_all([recept1, recept2])
        db.session.commit()
        
        print("✅ Seed complete!")
        print("👑 Admin: admin@recepti.com / admin123")
        print("👨‍🍳 Autor: autor@recepti.com / autor123")
        print("👤 Čitalac: citalac@recepti.com / citalac123")

if __name__ == '__main__':
    seed_database()