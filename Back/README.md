🍲 Recepti API (Backend)
Ovaj projekat predstavlja robusno backend rešenje za platformu za deljenje recepata. Sistem omogućava korisnicima različite nivoe pristupa, real-time obaveštenja i napredno keširanje podataka.

🚀 Glavne Funkcionalnosti
Autentifikacija: Siguran Login i Registracija (JWT + bcrypt).

Bezbednost: Blokada naloga nakon 3 neuspešna pokušaja (Redis).

Performanse: Keširanje pretrage recepata (Redis).

Real-time: WebSockets obaveštenja za administratora.

Email: Automatsko slanje obaveštenja o promeni uloge.

📋 Koraci za uspešno pokretanje projekta
Pratite ove korake redom kako biste pokrenuli razvojno okruženje:

1. Priprema virtuelnog okruženja
   U terminalu, unutar back foldera, izvršite:

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt 2. Pokretanje baze i keš servera (Docker)
Morate imati instaliran Docker Desktop. Pokrenite sledeće komande:

# Pokretanje PostgreSQL baze

docker run --name recepti-db -e POSTGRES_PASSWORD=admin -p 5433:5432 -d postgres

# Pokretanje Redis servera

docker run --name recepti-redis -p 6379:6379 -d redis 3. Konfiguracija okruženja (.env)
Napravite fajl pod nazivom .env u back folderu i nalepite sledeće (prilagodite email podatke):

Фрагмент кода

DATABASE_URL=postgresql://postgres:admin@127.0.0.1:5433/postgres
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET_KEY=super-tajna-za-tokene
MAIL_SERVER=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=vash_username
MAIL_PASSWORD=vash_password
MAIL_USE_TLS=True

4. Pokretanje aplikacije
   Kada su Docker kontejneri pokrenuti i .env spreman, pokrenite server:

python run.py

Aplikacija će automatski kreirati potrebne tabele u bazi pri prvom pokretanju.
