# UniTrack
## Documentație pentru prezentarea în fața juriului

**Categorie:** Web  
**Produs:** platformă pentru gestionarea admiterii universitare  
**Versiune:** prezentare națională 2026

## 1. Problema

Admiterea la facultate este fragmentată între site-uri, fișiere, emailuri și calendare. Studentul repetă aceleași date, pierde termene și nu știe dacă dosarul este complet. Universitatea primește documente neuniforme și procesează greu candidaturile. UniTrack oferă un flux comun, cu interfețe și permisiuni diferite pentru student, universitate și administrator.

## 2. Soluția

Studentul poate:

1. să consulte catalogul de universități și oferta educațională;
2. să selecteze și să compare programe;
3. să încarce documentele într-un dosar reutilizabil;
4. să primească un verdict explicabil pentru tipul documentului;
5. să trimită o candidatură și să urmărească statusul;
6. să vadă deadline-uri, documente lipsă și notificări.

Universitatea își gestionează oferta și evaluează aplicațiile primite. Administratorul aprobă instituțiile, gestionează conturile și verifică starea sistemului.

## 3. Arhitectura

```text
Browser
  |
  | HTTPS / JSON
  v
Netlify (React + Vite)
  |
  | /api proxy
  v
Render (Express API)
  |
  +-- PostgreSQL / Supabase
  +-- serviciu email
  +-- Gemini pentru analiza asistată a documentelor
```

Frontendul și backendul sunt proiecte separate. API-ul este stateless, iar autentificarea folosește cookie `httpOnly`. Baza relațională păstrează utilizatori, instituții, programe, aplicații, documente, notificări, audit și credentiale passkey.

## 4. Tehnologii

- **React** pentru interfața pe componente.
- **Vite** pentru dezvoltare, build și code splitting.
- **JavaScript modern** cu module ES.
- **CSS propriu** pentru sistemul responsive și temele monocrome.
- **Lucide React** pentru iconuri accesibile.
- **Express** pentru API.
- **Sequelize** pentru acces parametrizat la date.
- **PostgreSQL / Supabase** pentru baza relațională și RLS.
- **Zod** pentru validarea requesturilor.
- **Playwright** pentru testarea fluxurilor reale în browser.
- **Gemini** ca nivel asistiv, nu ca unică sursă de adevăr.
- **Netlify** pentru frontend și **Render** pentru API.

## 5. Modelul datelor

Entitățile principale sunt:

- `User`: identitate, rol și preferințe;
- `Institution`: universitate și starea aprobării;
- `AdmissionProgram`: oferta educațională;
- `AdmissionApplication`: candidatura unui student;
- `Document`: fișier, tip așteptat, verdict și trasabilitate;
- `ProgramRequirement`: documentele cerute pentru program;
- `Notification`: evenimente pentru utilizator;
- `AuditLog`: operații administrative importante;
- `Passkey`: cheie publică WebAuthn.

Relațiile și constrângerile sunt definite în modele și migrări. Politicile RLS oferă încă un nivel de separare direct în PostgreSQL.

## 6. Autentificare și autorizare

Există trei roluri:

- **student**: accesează exclusiv dosarul și aplicațiile proprii;
- **university**: accesează aplicațiile trimise instituției asociate;
- **admin**: aprobă instituții și gestionează sistemul.

Parolele sunt hash-uite. Sesiunea este semnată și transmisă prin cookie `httpOnly`. Cererile care modifică date folosesc token CSRF. Verificarea emailului și recuperarea parolei utilizează coduri sau tokenuri cu expirare. CNP-ul nu este păstrat în clar: este validat, apoi transformat prin HMAC și protejat prin constrângere unică.

## 7. Verificarea documentelor

Clasificarea nu se bazează pe numele fișierului. Sistemul verifică:

1. tipul și dimensiunea fișierului;
2. textul extras și indiciile specifice documentului;
3. concordanța cu tipul solicitat;
4. răspunsul structurat al modelului Gemini, când serviciul este disponibil;
5. pragul de încredere și motivele verdictului.

AI-ul oferă asistență, dar un document incert nu este acceptat automat. Verdictul poate fi revizuit de universitate.

## 8. Securitate

- Helmet și antete de securitate;
- CORS cu origini explicite;
- protecție CSRF;
- rate limiting pentru autentificare și API;
- limite pentru body și fișiere;
- validare Zod pe server;
- interogări parametrizate prin ORM;
- sanitizare XSS;
- cookie `httpOnly`, `secure` în producție și politici `sameSite`;
- separare pe roluri și RLS;
- jurnal de audit;
- secrete exclusiv în variabile de mediu.

## 9. Performanță și accesibilitate

- fiecare pagină este încărcată la cerere prin code splitting;
- catalogul temporizează căutarea și limitează rezultatele randate;
- asseturile au cache immutable, iar documentul HTML nu este cache-uit agresiv;
- imaginile de profil sunt redimensionate înainte de stocare;
- interfața este responsive pentru desktop și telefon;
- butoanele icon au etichete, focusul este vizibil și navigarea poate fi făcută din tastatură;
- tema deschisă și întunecată respectă contrastul;
- aplicația nu folosește efecte 3D sau animații care ar consuma resurse fără valoare funcțională.

## 10. Testare

`npm run verify` execută validarea sintactică, buildul de producție și testele Playwright pe desktop și mobil.

`npm run jury:demo` testează API-ul și produce JSON valid pentru:

- conexiune;
- baza de date;
- CSRF;
- autentificare;
- autorizare pe rol;
- catalog;
- profil;
- notificări;
- operațiile specifice rolului.

## 11. Demonstrația recomandată

1. Prezintă pagina publică și problema rezolvată.
2. Autentifică un student.
3. Arată catalogul și compararea.
4. Deschide dosarul și explică validarea documentelor.
5. Trimite sau deschide o candidatură.
6. Arată workspace-ul universității și schimbarea statusului.
7. Încheie cu panoul administratorului și arhitectura de securitate.

## 12. Limitări asumate

- Analiza AI depinde de disponibilitatea serviciului extern; verificările deterministe rămân active.
- Datele oficiale ale ofertelor trebuie actualizate de instituții.
- Identitatea juridică nu este certificată doar prin CNP; pentru producție națională ar fi necesară integrarea cu un furnizor oficial de identitate.
- Emailul depinde de reputația domeniului și de serviciul SMTP/API configurat.

## 13. Rulare locală

```powershell
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`  
API: `http://127.0.0.1:4000/api`

Pentru producție, se configurează variabilele descrise în `.env.production.example`. Secretele reale nu se urcă în Git.

