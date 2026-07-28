# UniTrack

## Dosar de prezentare pentru juriu

**Categorie:** Web  
**Durată recomandată:** 12 minute prezentare + întrebări  
**Aplicație live:** https://unitrack.sbs  
**Cod sursă:** https://github.com/nmt65/unitracka

## 1. Ideea pe scurt

UniTrack este o platformă web care organizează admiterea la universitate într-un flux unic pentru elevi, instituții și administratori. Elevul își creează un singur cont verificabil, alege programe din oferta aprobată, pregătește documentele, trimite aplicația și urmărește statusul. Universitatea primește dosarele într-un workspace separat, consultă documentele reale și actualizează decizia. Administratorul controlează instituțiile, programele, conturile instituționale și starea serviciilor.

Problema rezolvată este fragmentarea: termenele sunt în calendare diferite, cerințele sunt pe pagini separate, documentele sunt duplicate, iar progresul aplicațiilor nu este vizibil într-un singur loc. UniTrack transformă acest proces într-un traseu coerent, verificabil și ușor de urmărit.

## 2. Structura prezentării

1. Problema și publicul țintă - 1 minut.
2. Soluția și rolurile din platformă - 1 minut.
3. Demonstrația fluxului studentului - 3 minute.
4. Workspace-ul universității și panoul admin - 2 minute.
5. Arhitectura, baza de date și API-ul - 2 minute.
6. Securitatea și verificarea documentelor - 2 minute.
7. Testarea, limitările asumate și concluzia - 1 minut.

## 3. Discurs de 10-15 minute

### 0:00-1:00 - Deschidere

Bună ziua. Proiectul nostru se numește UniTrack și este o platformă pentru gestionarea admiterii la universitate. Am pornit de la o problemă concretă: un elev care aplică la mai multe universități lucrează cu pagini, termene, formulare și liste de documente diferite. În același timp, universitățile primesc dosare în formate greu de comparat, iar elevul nu are o imagine clară asupra progresului.

UniTrack aduce într-un singur loc catalogul de programe, aplicațiile, documentele, termenele, notificările și comunicarea dintre elev și instituție.

### 1:00-2:00 - Cele trei roluri

Platforma are trei roluri distincte. Studentul își gestionează dosarul și aplicațiile. Universitatea are un workspace numai pentru instituția asociată, unde vede candidații și documentele lor. Administratorul aprobă instituțiile, publică programe, creează conturi instituționale și urmărește sănătatea sistemului.

Separarea nu este doar vizuală. Backend-ul verifică rolul pentru fiecare rută sensibilă. Un student nu poate accesa rutele de admin, iar un cont de universitate nu poate vedea aplicațiile altei instituții.

### 2:00-5:00 - Demonstrația studentului

Încep cu autentificarea. Sesiunea este păstrată într-un cookie HTTP-only, iar operațiile care modifică date folosesc protecție CSRF. La înscriere, elevul introduce CNP-ul pentru regula de cont unic. CNP-ul complet nu este păstrat în clar: serverul salvează un HMAC și ultimele patru cifre pentru identificare minimă.

După login, dashboard-ul arată aplicațiile, progresul documentelor și deadline-urile apropiate. În catalog, elevul caută o universitate și alege un program din oferta educațională curentă. Nu poate inventa liber o facultate pentru a o trimite ca aplicație oficială.

În pagina Admitere selectez instituția și programul. La trimitere, backend-ul verifică dacă instituția este activă și dacă nu există deja aceeași aplicație. Sistemul creează automat checklist-ul de documente cerut de program și notifică personalul universității.

În pagina Documente văd exact ce lipsește. Pentru un fișier încărcat, sistemul validează extensia, dimensiunea și conținutul, apoi poate apela Gemini sau OpenAI pentru o preclasificare multimodală. Rezultatul nu înlocuiește secretariatul: un document incert rămâne pentru verificare manuală, iar decizia finală aparține universității.

Profilul conține datele academice, fotografia, schimbarea parolei, passkey, notificările și ștergerea contului. Media BAC și scorurile de limbă nu devin credibile doar prin completarea unui câmp; ele sunt legate de existența documentelor atestatoare verificate.

### 5:00-7:00 - Universitate și administrator

Schimb acum perspectiva către workspace-ul universității. Contul instituțional vede doar aplicațiile trimise către universitatea sa. Poate filtra după status și starea documentelor, poate deschide fișierul original, îl poate aproba sau respinge și poate actualiza aplicația la review, waitlist, acceptat sau respins. Studentul primește notificarea în platformă și, dacă serviciul de email este configurat, și prin email.

În panoul admin se văd starea PostgreSQL, emailul, furnizorul de analiză și limitele zilnice. Adminul gestionează instituțiile și oferta pe anul academic, creează conturile universităților și consultă audit log-ul. Crearea conturilor instituționale nu este disponibilă din formularul public.

### 7:00-9:00 - Arhitectură și date

Frontend-ul este construit cu React și Vite. Interfața este modulară, responsive și folosește CSS scris pentru proiect, mod luminos și întunecat și iconițe Lucide.

Backend-ul este un API REST în Node.js și Express. Validarea contractelor se face cu Zod, iar accesul la date cu Sequelize ORM. În dezvoltare folosim SQLite, pentru ca proiectul să poată fi rulat rapid pe laptop. În producție folosim PostgreSQL găzduit în Supabase.

Modelul relațional include utilizatori, instituții, programe, cerințe de program, aplicații, documente, notificări, utilizarea serviciilor AI, passkeys și audit logs. Relațiile și constrângerile unice previn duplicatele importante, inclusiv emailul, CNP-ul hash-uit și aplicația repetată pentru același program.

Frontend-ul este livrat prin Netlify, domeniul este unitrack.sbs, iar API-ul rulează pe Render. Netlify redirecționează rutele `/api` către backend, astfel încât browserul folosește același domeniu public.

### 9:00-11:00 - Securitate și servicii externe

Securitatea este aplicată pe mai multe niveluri: parolele sunt hash-uite cu bcrypt, JWT-ul stă într-un cookie HTTP-only, cererile de scriere cer token CSRF, CORS acceptă numai originile configurate, Helmet adaugă headere de securitate, payload-ul este limitat, iar autentificarea și analiza documentelor au rate limit separat.

Datele sunt validate cu Zod și sanitizate înainte de folosire. Sequelize generează interogări parametrizate, deci nu concatenăm SQL din input-ul utilizatorului. Acțiunile sensibile sunt înregistrate în audit log.

Pentru PostgreSQL există politici RLS pentru tabelele sensibile. În configurația actuală, autorizarea principală este realizată în API, iar conexiunea server-side rulează ca rol de serviciu. Scriptul RLS este pregătit ca strat suplimentar pentru o configurație cu rol non-owner și context per tranzacție; nu îl prezentăm ca înlocuitor al verificărilor din backend.

Emailurile de verificare și resetare sunt trimise prin Resend, cu SMTP ca alternativă. Verificarea documentelor folosește Gemini 2.5 Flash implicit când cheia este configurată, OpenAI ca furnizor alternativ și un clasificator local strict pentru development. Cheile rămân numai în variabilele de mediu ale serverului.

### 11:00-12:00 - Testare și concluzie

Pentru demo am creat un script automat care verifică health, readiness, instituțiile publice, autentificarea, sesiunea, CSRF, accesul pe roluri, profilul, notificările, catalogul, trackerul și aplicațiile. Scriptul nu modifică datele și produce un raport JSON valid, potrivit pentru verificare de către juriu.

Limitarea importantă este asumată: analiza automată ajută la triere, nu certifică autenticitatea juridică a actelor. Într-o implementare instituțională reală ar fi necesare integrarea cu registre oficiale, politici de retenție și un proces juridic GDPR complet.

UniTrack nu este doar un tabel cu deadline-uri. Este un flux complet, cu roluri reale, date relaționale, securitate server-side și un traseu clar de la alegerea programului până la decizia universității. Vă mulțumesc.

## 4. Arhitectura sistemului

```text
Browser
  |
  | HTTPS / unitrack.sbs
  v
Netlify - frontend React/Vite + proxy /api
  |
  | HTTPS
  v
Render - Node.js / Express REST API
  |---- autentificare, autorizare, validare, audit
  |---- Resend/SMTP pentru email
  |---- Gemini/OpenAI pentru preclasificare documente
  |
  v
Supabase PostgreSQL - date relaționale + politici RLS pregătite
```

## 5. Tehnologii

| Strat | Tehnologie | Rol |
| --- | --- | --- |
| Frontend | React 18, Vite | componente UI, stare, build rapid |
| Interfață | CSS custom, Lucide React | design responsive, teme, iconografie |
| Backend | Node.js, Express | API REST și logica aplicației |
| Validare | Zod | contracte și validare server-side |
| Date | Sequelize ORM | modele, relații, interogări parametrizate |
| Development | SQLite | rulare locală fără servicii externe |
| Producție | PostgreSQL / Supabase | persistență relațională |
| Securitate | bcrypt, JWT, CSRF, Helmet, CORS, rate limit | protecție în straturi |
| Autentificare modernă | SimpleWebAuthn | passkeys |
| Email | Resend HTTP API, SMTP fallback | verificare email, resetare, notificări |
| Analiză documente | Gemini 2.5 Flash / OpenAI / fallback local | preclasificare și triere |
| Hosting | Netlify + Render | frontend/CDN și API |

## 6. Funcționalități principale

- cont student unic per CNP, fără stocarea CNP-ului complet în clar;
- verificare email, login, logout, passkey, resetare și schimbare parolă;
- profil student cu fotografie, rezultate, preferințe și link public;
- catalog de instituții și programe aprobate;
- tracker personal, comparație și calendar de deadline-uri;
- aplicații oficiale fără programe introduse arbitrar;
- checklist de documente configurabil per program;
- încărcare, vizualizare și preclasificare a documentelor;
- workspace universitate pentru filtrare, documente și decizie;
- panou admin pentru instituții, programe, conturi și audit;
- notificări în aplicație și email;
- exporturi CSV, JSON, XML și PDF;
- mod luminos/întunecat și interfață responsive.

## 7. Autentificare și autorizare

1. Clientul cere un token CSRF.
2. Login-ul trimite emailul și parola prin HTTPS, împreună cu tokenul CSRF.
3. Backend-ul compară parola cu hash-ul bcrypt.
4. Pentru conturile non-admin este cerută verificarea emailului.
5. Serverul emite JWT-ul într-un cookie HTTP-only și secure în producție.
6. Middleware-ul încarcă utilizatorul și instituția asociată.
7. Fiecare rută sensibilă verifică rolul și proprietatea resursei.
8. Logout-ul șterge cookie-ul.

## 8. Baza de date

Tabelele principale sunt `Users`, `Institutions`, `AdmissionPrograms`, `ProgramRequirements`, `Universities`, `AdmissionApplications`, `Documents`, `Notifications`, `AiUsages`, `Passkeys` și `AuditLogs`.

Constrângerile importante sunt:

- email unic;
- HMAC CNP unic;
- aplicație unică pentru student, instituție și program;
- document asociat unui tracker sau unei aplicații;
- personalul universității legat de o singură instituție;
- cerințele documentare legate de program și anul academic.

## 9. API-uri importante

| Rută | Scop |
| --- | --- |
| `GET /api/health` | disponibilitatea procesului |
| `GET /api/ready` | disponibilitatea bazei de date |
| `POST /api/auth/login` | autentificare |
| `POST /api/auth/register` | cont student |
| `POST /api/auth/forgot-password` | inițiere resetare |
| `GET /api/institutions/public` | instituții și programe active |
| `POST /api/applications` | trimitere aplicație |
| `GET /api/applications/workspace` | dosare pentru universitate |
| `POST /api/ai/documents/check` | preclasificare document |
| `GET /api/notifications` | notificări utilizator |
| `GET /api/admin/audit-logs` | jurnal acțiuni admin |

## 10. Întrebări posibile și răspunsuri

### De ce este nevoie de UniTrack dacă universitățile au propriile platforme?

UniTrack nu încearcă să înlocuiască toate sistemele instituționale. El oferă un strat comun de organizare și un flux standard între candidat și mai multe instituții, reducând fragmentarea.

### CNP-ul este păstrat în baza de date?

Nu în clar. Backend-ul validează CNP-ul, apoi păstrează un HMAC-SHA256 cu un secret separat și ultimele patru cifre. Unicitatea se verifică pe HMAC.

### Cum preveniți SQL injection?

Input-ul este validat cu Zod, iar accesul la bază se face prin Sequelize, care folosește interogări parametrizate. Nu construim interogări SQL prin concatenarea textului primit.

### Cum preveniți accesul unui student la panoul admin?

Interfața ascunde opțiunile nepotrivite, dar protecția reală este în backend. Middleware-ul `requireRole` returnează 403 pentru un rol nepermis. Scriptul de demo verifică explicit acest caz.

### RLS este activ?

Politicile sunt incluse și pot fi aplicate pe PostgreSQL. În configurația curentă, API-ul face autorizarea principală, iar conexiunea serverului este un rol de serviciu. Pentru RLS strict per utilizator trebuie folosit un rol non-owner și setat contextul `app.*` în fiecare tranzacție.

### Inteligența artificială validează autenticitatea diplomei?

Nu. Modelul preclasifică tipul și semnalele de conținut. Autenticitatea juridică și aprobarea finală aparțin universității. Documentele incerte intră în review manual.

### Ce se întâmplă dacă API-ul Gemini nu răspunde?

Cererea are timeout și modele fallback. Dacă analiza avansată nu este disponibilă, sistemul folosește reguli locale stricte sau păstrează documentul pentru verificare manuală, fără aprobare automată nejustificată.

### De ce React și nu Next.js?

Aplicația are un frontend SPA separat și un backend Express existent. React cu Vite păstrează build-ul simplu și rapid, iar API-ul poate fi scalat și testat separat.

### De ce SQLite local și PostgreSQL în producție?

SQLite permite evaluatorului să ruleze proiectul imediat. PostgreSQL oferă concurență, robustețe și politici suplimentare pentru producție. Modelele Sequelize păstrează aceeași logică.

### Ce date vede o universitate?

Numai aplicațiile trimise către instituția asociată contului. Controllerul filtrează după `InstitutionId`, iar documentele sunt servite doar actorilor implicați.

### Cum sunt protejate cheile API?

Nu sunt în frontend și nu sunt comise în Git. Sunt citite de backend din variabile de mediu pe Render.

### Cum gestionați atacurile de tip brute force sau trafic excesiv?

Există rate limit global și limite mai stricte pentru autentificare și analiza documentelor. În producție, CDN-ul și platforma de hosting oferă și protecție la nivel de infrastructură.

### Cum este testat proiectul?

`npm run check` validează sintaxa backend-ului și build-ul frontend-ului. `npm run jury:demo` execută verificări HTTP read-only și produce JSON. Există și endpoint-uri health/readiness și un smoke test separat.

### Ce ați îmbunătăți într-o versiune instituțională?

Integrare cu registre oficiale, semnătură electronică, politici GDPR auditate, stocare dedicată de obiecte, cozi de procesare și RLS strict cu roluri PostgreSQL non-owner.

## 11. Ordinea recomandată pentru demo

1. Deschide pagina de login și menționează tema, limba și passkey.
2. Intră cu un cont student pregătit.
3. Arată dashboard-ul și un deadline.
4. Deschide catalogul și compară două universități.
5. Deschide Admitere și selectează un program real.
6. Arată checklist-ul și un document deja verificat; nu depinde de un apel AI live.
7. Deschide workspace-ul universității într-un al doilea profil de browser.
8. Arată documentul și schimbarea statusului.
9. Deschide panoul admin și audit log-ul.
10. Rulează `npm run --silent jury:demo` și afișează raportul JSON.

## 12. Plan de rezervă

- păstrează aplicația locală pregătită cu SQLite și date demo;
- păstrează un raport JSON generat anterior;
- păstrează trei capturi: dashboard student, workspace universitate, panou admin;
- nu baza demonstrația pe trimiterea unui email sau pe un apel AI în timp real;
- dacă serviciul Render pornește lent, deschide `/api/health` cu un minut înainte.

## 13. Mesaj final

UniTrack demonstrează un produs web complet: interfață responsive, API separat, model relațional, autentificare modernă, autorizare pe roluri, flux real de documente, integrare cu servicii externe și instrumente de testare. Valoarea proiectului nu este doar numărul de ecrane, ci coerența dintre ele și controlul datelor pe întregul proces de admitere.
