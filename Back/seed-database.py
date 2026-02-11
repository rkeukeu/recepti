#!/usr/bin/env python3


import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Recipe
import bcrypt
from datetime import date


def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def create_user(
    email: str,
    password: str,
    ime: str,
    prezime: str,
    uloga: str,
    pol: str = None,
    datum_rodjenja: date = None,
    drzava: str = None,
    ulica: str = None,
    broj: str = None,
    slika_profila: str = None,
):
    return User(
        email=email,
        lozinka=hash_pw(password),
        ime=ime,
        prezime=prezime,
        uloga=uloga,
        pol=pol,
        datum_rodjenja=datum_rodjenja,
        drzava=drzava,
        ulica=ulica,
        broj=broj,
        slika_profila=slika_profila,
    )


def create_recipe(
    naslov: str,
    tip_jela: str,
    vreme_pripreme: int,
    tezina: str,
    broj_osoba: int,
    sastojci: str,
    koraci: str,
    autor_id: int,
    slika: str = None,
    oznake: str = None,
):
    # Ako nemaš kolonu oznake u modelu Recipe, obriši oznake=...
    r = Recipe(
        naslov=naslov,
        tip_jela=tip_jela,
        vreme_pripreme=vreme_pripreme,
        tezina=tezina,
        broj_osoba=broj_osoba,
        sastojci=sastojci,
        koraci=koraci,
        slika=slika,
        autor_id=autor_id,
    )
    # Ako Recipe ima polje oznake:
    if hasattr(r, "oznake"):
        r.oznake = oznake
    return r


def seed_database():
    app = create_app()

    with app.app_context():
        if User.query.first():
            print("⚠️  Database has data, skipping seed")
            return

        # ---------- USERS ----------
        admin = create_user(
            email="admin@recepti.com",
            password="admin123",
            ime="Admin",
            prezime="Admin",
            uloga="administrator",
            pol="Muški",
            datum_rodjenja=date(1995, 1, 1),
            drzava="Srbija",
            ulica="",
            broj="",
            slika_profila=None,
        )

        autor1 = create_user(
            email="autor1@recepti.com",
            password="autor123",
            ime="Ana",
            prezime="Jovanović",
            uloga="autor",
            pol="Ženski",
            datum_rodjenja=date(1999, 6, 12),
            drzava="Srbija",
            ulica="Bulevar oslobođenja",
            broj="12",
            slika_profila=None,
        )

        autor2 = create_user(
            email="autor2@recepti.com",
            password="autor123",
            ime="Marko",
            prezime="Petrović",
            uloga="autor",
            pol="Muški",
            datum_rodjenja=date(1998, 11, 3),
            drzava="Srbija",
            ulica="Narodnog fronta",
            broj="25",
            slika_profila=None,
        )

        citalac1 = create_user(
            email="citalac1@recepti.com",
            password="citalac123",
            ime="Petar",
            prezime="Ilić",
            uloga="čitalac",
            pol="Muški",
            datum_rodjenja=date(2001, 2, 20),
            drzava="Srbija",
            ulica="Cara Dušana",
            broj="7",
            slika_profila=None,
        )

        citalac2 = create_user(
            email="citalac2@recepti.com",
            password="citalac123",
            ime="Milica",
            prezime="Nikolić",
            uloga="čitalac",
            pol="Ženski",
            datum_rodjenja=date(2000, 9, 14),
            drzava="Srbija",
            ulica="Futoška",
            broj="102",
            slika_profila=None,
        )

        citalac3 = create_user(
            email="citalac3@recepti.com",
            password="citalac123",
            ime="Jelena",
            prezime="Stojanović",
            uloga="čitalac",
            pol="Ženski",
            datum_rodjenja=date(2002, 5, 8),
            drzava="Srbija",
            ulica="Zmaj Jovina",
            broj="3",
            slika_profila=None,
        )

        db.session.add_all([admin, autor1, autor2, citalac1, citalac2, citalac3])
        db.session.commit()

        recipes = []

        recipes += [
            create_recipe(
                naslov="Spaghetti Carbonara",
                tip_jela="Glavno jelo",
                vreme_pripreme=30,
                tezina="Srednje",
                broj_osoba=4,
                sastojci="Spaghetti, jaja, panceta, parmezan, biber",
                koraci="1. Skuvati spaghetti\n2. Ispržiti pancetu\n3. Umutiti jaja + parmezan\n4. Sjediniti sve",
                slika="http://localhost:5000/auth/uploads/carbonara.jpg",
                oznake="italijansko, brzo",
                autor_id=autor1.id,
            ),
            create_recipe(
                naslov="Grčka salata",
                tip_jela="Salata",
                vreme_pripreme=15,
                tezina="Lako",
                broj_osoba=2,
                sastojci="Paradajz, krastavac, feta, masline, luk, maslinovo ulje",
                koraci="1. Iseckati povrće\n2. Dodati fetu i masline\n3. Začiniti uljem i solju",
                slika="http://localhost:5000/auth/uploads/grcka.jpg",
                oznake="posno, sveže",
                autor_id=autor1.id,
            ),
            create_recipe(
                naslov="Krem supa od bundeve",
                tip_jela="Supa",
                vreme_pripreme=35,
                tezina="Srednje",
                broj_osoba=4,
                sastojci="Bundeva, šargarepa, luk, pavlaka, so, biber",
                koraci="1. Prodinstati luk\n2. Dodati bundevu i šargarepu\n3. Kuvati\n4. Izblendati i dodati pavlaku",
                slika="http://localhost:5000/auth/uploads/bundeva.jpg",
                oznake="jesen, kremasto",
                autor_id=autor1.id,
            ),
            create_recipe(
                naslov="Palačinke",
                tip_jela="Dezert",
                vreme_pripreme=20,
                tezina="Lako",
                broj_osoba=4,
                sastojci="Jaja, mleko, brašno, prstohvat soli",
                koraci="1. Umutiti smesu\n2. Peći na tiganju\n3. Puniti po želji",
                slika="http://localhost:5000/auth/uploads/pancakes.jpg",
                oznake="slatko, klasik",
                autor_id=autor1.id,
            ),
        ]

        recipes += [
            create_recipe(
                naslov="Ćevapi u somunu",
                tip_jela="Glavno jelo",
                vreme_pripreme=25,
                tezina="Srednje",
                broj_osoba=3,
                sastojci="Mleveno meso, so, biber, luk, somun",
                koraci="1. Oblikovati ćevape\n2. Ispeći na roštilju/tiganju\n3. Poslužiti u somunu sa lukom",
                slika="http://localhost:5000/auth/uploads/cevapi.jpg",
                oznake="roštilj, domaće",
                autor_id=autor2.id,
            ),
            create_recipe(
                naslov="Testenina sa pestom",
                tip_jela="Glavno jelo",
                vreme_pripreme=18,
                tezina="Lako",
                broj_osoba=2,
                sastojci="Testenina, pesto, parmezan, maslinovo ulje",
                koraci="1. Skuvati testeninu\n2. Pomešati sa pestom\n3. Dodati parmezan",
                slika="http://localhost:5000/auth/uploads/pesto.jpg",
                oznake="brzo, vegetarijansko",
                autor_id=autor2.id,
            ),
            create_recipe(
                naslov="Salata od tunjevine",
                tip_jela="Salata",
                vreme_pripreme=10,
                tezina="Lako",
                broj_osoba=2,
                sastojci="Tunjevina, kukuruz, krastavac, majonez/jogurt",
                koraci="1. Procediti tunjevinu\n2. Pomešati sastojke\n3. Začiniti po ukusu",
                slika="http://localhost:5000/auth/uploads/tuna.jpg",
                oznake="proteinsko, brzo",
                autor_id=autor2.id,
            ),
            create_recipe(
                naslov="Čokoladni mafini",
                tip_jela="Dezert",
                vreme_pripreme=35,
                tezina="Srednje",
                broj_osoba=6,
                sastojci="Brašno, kakao, šećer, jaja, mleko, čokolada",
                koraci="1. Pomešati suve sastojke\n2. Dodati mokre\n3. Sipati u kalupe\n4. Peći 20min na 180C",
                slika="http://localhost:5000/auth/uploads/mafini.jpg",
                oznake="slatko, čokolada",
                autor_id=autor2.id,
            ),
        ]

        db.session.add_all(recipes)
        db.session.commit()

        print("✅ Seed complete!")
        print("👑 Admin: admin@recepti.com / admin123")
        print("👨‍🍳 Autor1: autor1@recepti.com / autor123")
        print("👨‍🍳 Autor2: autor2@recepti.com / autor123")
        print("👤 Čitalac1: citalac1@recepti.com / citalac123")
        print("👤 Čitalac2: citalac2@recepti.com / citalac123")
        print("👤 Čitalac3: citalac3@recepti.com / citalac123")


if __name__ == "__main__":
    seed_database()
