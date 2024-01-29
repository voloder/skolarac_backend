# POKRETANJE BACKENDA

Prvo, na server instalirajte Python 3.11.6

Instalirajte biblioteke potrebne za rad komandom `pip install -r requirements.txt`

Kada pip instalira biblioteke, komandom `uvicorn main:app --host=0.0.0.0` započnite server.

Možete podesiti host IP kako god hoćete, 0.0.0.0 se koristi da bi server bio vidljiv sa drugih uređaja

Ako je sve urađeno kako treba, u konzoli će se prikazati
`INFO:     Uvicorn running on http://0.0.0.0:8000`

Web fajlovi ce se automatski servirati na tom URL-u

Što se tiče aplikacije, u fajlu `lib/backend.dart`, na liniji 17 promijeniti `host` varijablu

# Naš environment

Mi koristimo Ubuntu 20.04 VPS koji iznajmljujemo od Globalhost-a i ima domenu xudev.io. Na njemu hostujemo ovaj kod

