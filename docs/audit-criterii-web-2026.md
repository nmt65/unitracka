# Audit UniTrack - criterii Web InfoEducatie 2026

Sursa: [Criteriile oficiale pentru sectiunea Web](https://data.infoeducatie.ro/manual/web.pdf).

Documentul indica exact ce trebuie demonstrat juriului si unde se gaseste dovada in proiect. Nu reprezinta o auto-notare, ci un traseu verificabil de evaluare.

## 1. Inginerie web si programare - 25 puncte

| Criteriu | Implementare si dovada |
| --- | --- |
| Tehnici de programare | Fluxuri asincrone, filtrare, sortare, scoruri de pregatire, clasificarea documentelor si validarea CNP sunt separate in servicii si utilitare. |
| Arhitectura datelor | PostgreSQL relational prin Sequelize, migrari, constrangeri, indexuri si politici RLS in `backend/sql/postgres_rls.sql`; API JSON si exporturi structurate. |
| Modularitate | Frontend impartit in pagini, componente, servicii si utilitare; backend impartit in rute, controllere, servicii, modele, validatoare si middleware. |
| Metodologie si framework-uri | React/Vite pe client, Express pe server, schema validation cu Zod, ORM Sequelize si servicii externe izolate prin adaptoare. |
| Scalabilitate | API stateless, PostgreSQL cloud, paginare/limitare in catalog, rate limiting, cache si separarea frontendului de API. |
| Versionare | Istoric Git, repository GitHub si deploy reproductibil din commit. |
| Testare | `npm run check`, teste E2E Playwright si smoke test JSON pentru sanatatea sistemului. |
| Performanta | Build minificat, code splitting Vite, limita de rezultate, imagini si componente usoare, fara scena 3D inutila intr-un instrument operational. |

## 2. Functionalitate si utilitate - 20 puncte

- Studentul cauta programe, compara universitati, urmareste deadline-uri, completeaza dosarul si trimite aplicatii.
- Universitatea administreaza oferta educationala si proceseaza candidaturile intr-un workspace separat.
- Administratorul aproba institutii, gestioneaza utilizatori si vede starea operationala.
- Continutul este administrabil din interfata, nu este hardcodat in pagini.
- Selectiile temporare de comparare sunt pastrate local pentru continuitate.
- Validarea documentelor combina verificari deterministe cu clasificare AI si pastreaza verdictul explicabil.

## 3. Experienta utilizatorului si design - 20 puncte

- Sistem vizual original, academic si neutru, cu ierarhie tipografica si contrast consistent.
- Navigare adaptata rolului; studentul, universitatea si administratorul nu vad actiuni care nu le apartin.
- Responsive pentru desktop, tableta si telefon; pe mobil este folosita navigare inferioara.
- Tema deschisa/intunecata si interfata romana/engleza.
- Controale etichetate, focus vizibil, un singur `h1` pe ecran si iconuri cu nume accesibile.
- Cautarea globala muta utilizatorul direct la catalog si focalizeaza campul de cautare.
- Informatiile repetitive au fost eliminate; actiunile principale raman permanent vizibile.

## 4. Originalitate - 15 puncte

UniTrack nu este un site de prezentare si nu foloseste un template copiat. Valoarea proprie este fluxul bilateral student-universitate, contul unic bazat pe CNP hash-uit, dosarul reutilizabil, verificarea documentelor, scorul de pregatire si workspace-ul de admitere. Inspiratia vizuala externa este limitata la principii generale de compozitie; layout-ul si componentele sunt implementate pentru produs.

## 5. Securitate - 10 puncte

- JWT in cookie `httpOnly`, protectie CSRF, CORS explicit si antete Helmet.
- Rate limiting, limita de dimensiune a requestului si validare Zod pe server.
- Interogari parametrizate prin ORM, fara concatenare SQL.
- Sanitizare si escapare pentru continutul afisat.
- CNP validat, apoi stocat exclusiv ca HMAC; constrangere unica pentru un singur cont.
- Parole hash-uite; resetarea si verificarea emailului folosesc tokenuri/coduri cu expirare.
- RLS PostgreSQL separa datele studentilor si institutiilor chiar la nivelul bazei de date.

## 6. Prezentare si documentatie - 10 puncte

Pentru demonstratie se folosesc:

- `docs/prezentare-juriu.md`
- `docs/discurs-juriu-de-invatat.md`
- `docs/arhitectura-tehnica.md`
- `docs/security-and-rls.md`
- `docs/rulare-demo-juriu.md`
- `docs/surse-externe.md`

## Comenzi de verificare

```powershell
npm install
npm run check
npm run test:e2e
npm run smoke
```

Demo-ul trebuie sa arate in ordine: autentificare student, catalog si comparare, document verificat, trimitere aplicatie, procesarea ei in workspace-ul universitatii, apoi controalele administratorului.
