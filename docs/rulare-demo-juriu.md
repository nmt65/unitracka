# Rulare și testare pentru juriu

## Pregătire locală

```powershell
npm run install:all
Copy-Item backend/.env.example backend/.env
npm run seed --prefix backend
npm run dev
```

Frontend-ul pornește la `http://localhost:5173`, iar API-ul la `http://localhost:4000/api`.

## Verificarea proiectului

```powershell
npm run check
```

Comanda verifică sintaxa fișierelor backend și construiește frontend-ul pentru producție.

## Demo automat local

Cu serverul pornit:

```powershell
npm run --silent jury:demo
```

Variabile opționale:

```powershell
$env:JURY_BASE_URL="http://127.0.0.1:4000/api"
$env:JURY_EMAIL="andrei@unitracker.ro"
$env:JURY_PASSWORD="parola-contului-demo"
npm run --silent jury:demo
```

Scriptul este read-only. El nu creează, nu modifică și nu șterge date.

## Demo automat pe producție

```powershell
$env:JURY_BASE_URL="https://unitrack.sbs/api"
$env:JURY_EMAIL="emailul-unui-cont-de-test"
$env:JURY_PASSWORD="parola-contului-de-test"
npm run --silent jury:demo
```

Raportul este scris exclusiv ca JSON valid în ieșirea standard. Codul de ieșire este `0` dacă verificările critice trec și `1` dacă există erori.

Exemplu:

```json
{
  "connection": "success",
  "authentication": "success",
  "authorization": "success",
  "role": "student",
  "features": [
    {
      "name": "API health",
      "status": "success",
      "httpStatus": 200,
      "durationMs": 42
    }
  ],
  "errors": [],
  "success": true
}
```

## Verificări incluse

- API health și database readiness;
- instituții publice;
- respingerea unei rute protejate fără sesiune;
- emiterea tokenului CSRF;
- blocarea unei cereri de login fără token CSRF;
- autentificare și sesiune;
- catalog, profil și notificări;
- funcțiile read-only specifice rolului;
- separarea rolului curent de panoul admin sau workspace-ul instituțional.

## Recomandare pentru prezentare

Rulează testul cu 10 minute înainte de intrarea în sală și păstrează raportul. Pornește și pagina live înainte de prezentare, deoarece planul gratuit Render poate avea nevoie de câteva secunde pentru pornirea serviciului.
