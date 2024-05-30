# Koristi službeni Python 3.9 imidž kao bazni imidž
FROM python:3.9-slim

# Instaliraj build-essential za gcc kompilator i druge build alate
RUN apt-get update && apt-get install -y build-essential

# Postavi radni direktorijum u containere
WORKDIR /app

# Kopiraj requirements.txt u radni direktorijum
COPY requirements.txt .

# Instaliraj Python zavisnosti
RUN pip install --no-cache-dir -r requirements.txt

# Kopiraj sve fajlove iz trenutnog direktorijuma na vašem računaru u radni direktorijum containera
COPY . .

# Expose port 5000 da bi se aplikacija mogla pristupiti van containera
EXPOSE 5000

# Definiši komandu za pokretanje aplikacije
CMD ["python", "app.py"]
