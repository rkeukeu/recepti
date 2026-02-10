"""
ADMINISTRATORSKE RUTE za PDF izveštaje
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import os
from multiprocessing import Process

# Kreiraj Blueprint
admin_bp = Blueprint('admin', __name__)

# --- POMOĆNA FUNKCIJA za prosečnu ocenu autora ---
def prosecna_ocena_autora(autor_id):
    """
    Izračunava prosečnu ocenu svih recepata autora
    """
    from . import db
    from .models import User, Recipe, Rating
    
    # Dohvati sve recepte autora
    recepti_autora = Recipe.query.filter_by(autor_id=autor_id).all()
    
    if not recepti_autora:
        return 0.0
    
    ukupna_prosecna = 0.0
    broj_ocenjenih = 0
    
    for recept in recepti_autora:
        ocene_recepta = Rating.query.filter_by(recipe_id=recept.id).all()
        if ocene_recepta:
            prosecna_recepta = sum([o.vrednost for o in ocene_recepta]) / len(ocene_recepta)
            ukupna_prosecna += prosecna_recepta
            broj_ocenjenih += 1
    
    return round(ukupna_prosecna / broj_ocenjenih, 2) if broj_ocenjenih > 0 else 0.0

# --- 1. RUTA ZA STATISTIKE ---
@admin_bp.route('/statistike', methods=['GET'])
@jwt_required()
def get_statistike():
    """
    Vraća ukupne statistike platforme
    """
    from . import db
    from .models import User, Recipe, Rating
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Provera da li je administrator
    if not user or user.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može pristupiti"}), 403
    
    # Brojanje korisnika po ulogama
    broj_citalaca = User.query.filter_by(uloga='čitalac').count()
    broj_autora = User.query.filter_by(uloga='autor').count()
    broj_admina = User.query.filter_by(uloga='administrator').count()
    
    # Ukupan broj recepata
    ukupno_recepata = Recipe.query.count()
    
    # TOP 5 autora po prosečnoj oceni
    svi_autori = User.query.filter_by(uloga='autor').all()
    
    autori_sa_ocenama = []
    for autor in svi_autori:
        prosecna = prosecna_ocena_autora(autor.id)
        broj_recepata = Recipe.query.filter_by(autor_id=autor.id).count()
        
        autori_sa_ocenama.append({
            "id": autor.id,
            "ime": f"{autor.ime} {autor.prezime}",
            "email": autor.email,
            "prosecna_ocena": prosecna,
            "broj_recepata": broj_recepata
        })
    
    # Sortiraj opadajuće po oceni (autori bez ocena će imati 0.0)
    top_5_autora = sorted(autori_sa_ocenama, 
                         key=lambda x: x['prosecna_ocena'], 
                         reverse=True)[:5]
    
    return jsonify({
        "statistike": {
            "korisnici": {
                "ukupno": broj_citalaca + broj_autora + broj_admina,
                "citalaca": broj_citalaca,
                "autora": broj_autora,
                "administratora": broj_admina
            },
            "recepti": {
                "ukupno": ukupno_recepata
            },
            "top_5_autora": top_5_autora
        }
    }), 200

# --- 2. FUNKCIJA ZA GENERISANJE PDF IZVEŠTAJA ---
def generisi_pdf_izvestaj(podaci):
    """
    Generiše PDF izveštaj sa statistikama
    """
    # Kreiraj folder ako ne postoji
    os.makedirs("pdfs/izvestaji", exist_ok=True)
    
    # Generiši jedinstveno ime fajla
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    putanja = f"pdfs/izvestaji/izvestaj_{timestamp}.pdf"
    
    # Kreiraj PDF
    c = canvas.Canvas(putanja, pagesize=A4)
    width, height = A4
    
    # POČETAK CRTAЊA
    y = height - 50  # Počni od vrha
    
    # NASLOV
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width/2, y, "📊 IZVEŠTAJ PLATFORME ZA RECEPTE")
    y -= 40
    
    # DATUM
    c.setFont("Helvetica", 10)
    c.drawCentredString(width/2, y, f"Datum izveštaja: {datetime.now().strftime('%d.%m.%Y. %H:%M')}")
    y -= 50
    
    # PODNASLOV - Statistike
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, "📈 OSNOVNE STATISTIKE")
    y -= 30
    
    # BROJ KORISNIKA
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "👥 KORISNICI:")
    y -= 20
    
    c.setFont("Helvetica", 11)
    c.drawString(70, y, f"• Ukupno korisnika: {podaci['korisnici']['ukupno']}")
    y -= 18
    c.drawString(70, y, f"• Čitalaca: {podaci['korisnici']['citalaca']}")
    y -= 18
    c.drawString(70, y, f"• Autora: {podaci['korisnici']['autora']}")
    y -= 18
    c.drawString(70, y, f"• Administratora: {podaci['korisnici']['administratora']}")
    y -= 30
    
    # BROJ RECEPATA
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "🍽️ RECEPTI:")
    y -= 20
    
    c.setFont("Helvetica", 11)
    c.drawString(70, y, f"• Ukupno recepata na platformi: {podaci['recepti']['ukupno']}")
    y -= 50
    
    # TOP AUTORI
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, "🏆 TOP 5 AUTORA (po prosečnoj oceni)")
    y -= 30
    
    # Tabela - zaglavlje
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "R.B.")
    c.drawString(80, y, "AUTOR")
    c.drawString(250, y, "PROSEČNA OCENA")
    c.drawString(380, y, "BROJ RECEPATA")
    y -= 20
    
    # Linija ispod zaglavlja
    c.line(50, y, width-50, y)
    y -= 10
    
    # Podaci autora
    c.setFont("Helvetica", 10)
    for i, autor in enumerate(podaci['top_autori'], 1):
        if y < 100:  # Provera za novu stranu
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
            c.drawString(50, y, "NASTAVAK TOP 5 AUTORA:")
            y -= 20
        
        c.drawString(50, y, f"{i}.")
        c.drawString(80, y, autor['ime'][:25])  # Skrati ako je predugačko
        c.drawString(250, y, f"{autor['prosecna_ocena']:.2f}")
        c.drawString(380, y, f"{autor['broj_recepata']}")
        y -= 25
    
    y -= 30
    
    # POTPIS
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(width/2, y, "--- Automatski generisan izveštaj ---")
    
    # SAČUVAJ PDF
    c.save()
    
    print(f"✅ PDF generisan: {putanja}")
    return putanja

# --- 3. RUTA ZA GENERISANJE PDF IZVEŠTAJA ---
@admin_bp.route('/generisi-izvestaj', methods=['POST'])
@jwt_required()
def kreiraj_izvestaj():
    """
    Generiše PDF izveštaj za administratora
    """
    from . import db
    from .models import User, Recipe, Rating
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Provera administratorskih prava
    if not user or user.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može generisati izveštaj"}), 403
    
    # Prikupi podatke
    broj_citalaca = User.query.filter_by(uloga='čitalac').count()
    broj_autora = User.query.filter_by(uloga='autor').count()
    broj_admina = User.query.filter_by(uloga='administrator').count()
    ukupno_recepata = Recipe.query.count()
    
    # Top 5 autora
    svi_autori = User.query.filter_by(uloga='autor').all()
    autori_sa_ocenama = []
    
    for autor in svi_autori:
        prosecna = prosecna_ocena_autora(autor.id)
        broj_recepata = Recipe.query.filter_by(autor_id=autor.id).count()
        
        autori_sa_ocenama.append({
            "id": autor.id,
            "ime": f"{autor.ime} {autor.prezime}",
            "email": autor.email,
            "prosecna_ocena": prosecna,
            "broj_recepata": broj_recepata
        })
    
    top_5_autora = sorted(autori_sa_ocenama, 
                         key=lambda x: x['prosecna_ocena'], 
                         reverse=True)[:5]
    
    # Pripremi podatke za PDF
    podaci_za_pdf = {
        "korisnici": {
            "ukupno": broj_citalaca + broj_autora + broj_admina,
            "citalaca": broj_citalaca,
            "autora": broj_autora,
            "administratora": broj_admina
        },
        "recepti": {
            "ukupno": ukupno_recepata
        },
        "top_autori": top_5_autora
    }
    
    # Pokreni generisanje PDF-a u pozadini
    try:
        process = Process(target=generisi_pdf_izvestaj, args=(podaci_za_pdf,))
        process.start()
        
        return jsonify({
            "msg": "✅ PDF izveštaj se generiše u pozadini",
            "lokacija": "pdfs/izvestaji/",
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "podaci": podaci_za_pdf
        }), 202
    except Exception as e:
        return jsonify({
            "msg": f"❌ Greška pri generisanju PDF-a: {str(e)}"
        }), 500

# --- 4. DODATNA RUTA: Preuzimanje liste izveštaja ---
@admin_bp.route('/izvestaji', methods=['GET'])
@jwt_required()
def lista_izvestaja():
    """
    Vraća listu svih generisanih PDF izveštaja
    """
    from .models import User
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.uloga != 'administrator':
        return jsonify({"msg": "Samo administrator može pristupiti"}), 403
    
    # Proveri da li folder postoji
    if not os.path.exists("pdfs/izvestaji"):
        return jsonify({"izvestaji": []}), 200
    
    # Dohvati sve PDF fajlove
    pdf_fajlovi = []
    for fajl in os.listdir("pdfs/izvestaji"):
        if fajl.endswith(".pdf"):
            putanja = f"pdfs/izvestaji/{fajl}"
            velicina = os.path.getsize(putanja)
            datum = datetime.fromtimestamp(os.path.getctime(putanja))
            
            pdf_fajlovi.append({
                "ime": fajl,
                "putanja": putanja,
                "velicina_kb": round(velicina / 1024, 2),
                "datum_kreiranja": datum.strftime("%d.%m.%Y. %H:%M")
            })
    
    # Sortiraj po datumu (najnoviji prvi)
    pdf_fajlovi.sort(key=lambda x: x["ime"], reverse=True)
    
    return jsonify({
        "broj_izvestaja": len(pdf_fajlovi),
        "izvestaji": pdf_fajlovi
    }), 200