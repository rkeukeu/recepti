# 🍲 Recepti Fullstack Aplikacija

Ovaj projekat je moderna web aplikacija za deljenje recepata, izgrađena pomoću **Flask** (Backend) i **Angular** (Frontend) tehnologija. Sistem implementira napredne koncepte kao što su real-time komunikacija, keširanje podataka i sigurna autentifikacija.

## 🚀 Tehnologije

### Backend:
* **Framework:** Flask
* **Baza podataka:** PostgreSQL (SQLAlchemy ORM)
* **Keširanje i bezbednost:** Redis (za pretragu i blokadu login pokušaja)
* **Autentifikacija:** JWT (JSON Web Tokens)
* **Real-time:** Flask-SocketIO
* **Email:** Flask-Mail (integracija sa Mailtrap-om)

### Frontend:
* **Framework:** Angular 17+
* **Stilizacija:** Bootstrap 5 & Custom CSS
* **Komunikacija:** HttpClient sa JWT Interceptorom

---

## 📋 Preduslovi za pokretanje

Za uspešno pokretanje projekta, potrebno je imati instalirano:
* [Python 3.10+](https://www.python.org/)
* [Node.js 18+](https://nodejs.org/)
* [Docker Desktop](https://www.docker.com/)

---

## 🔧 Instalacija i Pokretanje

### 1. Backend (Flask)
Uđite u direktorijum `Back/`:
1. Kreirajte virtuelno okruženje: `python -m venv venv`
2. Aktivirajte ga: `venv\Scripts\activate` (Windows) ili `source venv/bin/activate` (Linux/Mac)
3. Instalirajte zavisnosti: `pip install -r requirements.txt`
4. Podesite `.env` fajl (DATABASE_URL, REDIS_HOST, MAIL parametri).
5. Pokrenite server: `python run.py`

### 2. Infrastruktura (Docker)
Pokrenite potrebne servise putem terminala:
```bash
# PostgreSQL baza
docker run --name recepti-db -e POSTGRES_PASSWORD=admin -p 5433:5432 -d postgres

# Redis server
docker run --name recepti-redis -p 6379:6379 -d redis

3. Frontend (Angular)
Uđite u direktorijum front/:

Instalirajte zavisnosti: npm install

Pokrenite aplikaciju: ng serve

Otvorite: http://localhost:4200


🛠 Ključne Funkcionalnosti
Sistem uloga: Korisnici (Čitalac, Autor, Administrator).

Real-time zahtevi: Slanje zahteva za ulogu Autora administratoru putem WebSocketa.

Napredna pretraga: Keširanje rezultata pretrage u Redisu radi bržeg odziva.

Interaktivnost: Ocenjivanje recepata, ostavljanje komentara i dodavanje u omiljene (favoriti).

Bezbednost: Automatska blokada IP adrese/naloga nakon 3 neuspešna login pokušaja.
