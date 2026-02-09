# back/Dockerfile
FROM python:3.11-slim

# Instaliraj system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Kreiraj working directory
WORKDIR /app

# Kopiraj requirements prvo (za caching)
COPY requirements.txt .

# Instaliraj Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Kopiraj ostatak koda
COPY . .

# Ekspozuj port
EXPOSE 5000

# Komanda za pokretanje
CMD ["python", "run.py"]