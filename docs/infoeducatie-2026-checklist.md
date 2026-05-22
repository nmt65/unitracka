# Checklist InfoEducație 2026 - secțiunea Web

Surse oficiale verificate:

- Regulamentul specific privind organizarea și desfășurarea Olimpiadei de Inovare și Creație Digitală - InfoEducație, nr. 24.683/05.02.2026: https://www.edu.ro/sites/default/files/_fi%C8%99iere/Minister/2026/olimpiade_concursuri/regulamente_actualizate/Regulament_Olimpiada_Inovare_Creatie%20digitala_Infoeducatie_2026.pdf
- Criterii de jurizare InfoEducație - Secțiunea Web: https://data.infoeducatie.ro/manual/web.pdf

## Aplicabil pentru UniTrack

- Secțiune: aplicații web.
- Participare: individual sau echipă de maximum 2 elevi.
- Un elev poate participa la o singură secțiune și cu o singură lucrare.
- Pentru etapa națională, proiectul trebuie înscris pe site-ul oficial în termenul cerut de regulament.
- Lucrarea trebuie să aibă documentație tehnică în format electronic.
- Trebuie pus la dispoziție codul sursă, împreună cu materialele auxiliare necesare rulării/testării.
- Dacă proiectul folosește resurse externe sau componente care nu sunt făcute de autor/autori, acestea trebuie declarate în documentație.
- Proiectul trebuie să poată fi compilat/rulat de evaluator pe cont propriu.

## Ce acoperă proiectul local

- Cod sursă complet în `backend` și `frontend`.
- README cu instalare, rulare, conturi demo și structură.
- Build verificat cu `npm run check`.
- Autentificare, recuperare parolă, validare server-side și separare date pe roluri.
- Deconectare, schimbare parolă și ștergere cont cu confirmare.
- CNP verificat și hash-uit, cu regulă de un singur cont student per CNP.
- Configurație live fără seed demo prin `SEED_DEMO=false` și `BOOTSTRAP_ADMIN=true`.
- SQL RLS pentru PostgreSQL în `backend/sql/postgres_rls.sql`.
- UI complet pentru flow-ul de aplicații universitare: dashboard, admitere, documente, comparație, calendar, profil.
- Admin panel pentru universități și conturi instituționale.
- Workspace de universitate pentru sortarea aplicațiilor primite.
- Documentație pentru securitate/RLS și verificare asistată a documentelor.

## Mapare pe criteriile de jurizare Web

| Criteriu | Ce arată UniTrack |
| --- | --- |
| Inginerie web și programare | React/Vite modular, Express API, servicii separate, validatoare Zod, modele Sequelize, suport SQLite/PostgreSQL, exporturi XML/JSON/CSV/PDF/ICS. |
| Arhitectura datelor | Schema relațională cu utilizatori, instituții, aplicații, documente, notificări; script `backend/sql/postgres_rls.sql`; CNP hash-uit cu HMAC. |
| Funcționalitate și utilitate | Flux complet student-universitate-admin: cont unic, aplicații, documente, verificare asistată, workspace, comparație, calendar, profil public, notificări. |
| Design și UX | Interfață responsive construită manual în React/CSS, dark/light mode, navigare laterală, stări goale, validări live, feedback prin toast. |
| Securitate | JWT `httpOnly`, CSRF, rate limit, body limit, Helmet, CORS configurabil, validare server-side, sanitizare XSS, verificare CNP, RLS SQL pentru PostgreSQL. |
| Testare și prezentare | `npm run check`, `npm run smoke`, health/readiness endpoints, capturi QA în `docs/`, checklist lansare publică. |

## Ce mai trebuie pregătit pentru predare

- Capturi finale din aplicație la rezoluție mare; una este deja în `docs/unitracka-qa-public-ready-dashboard-latest.png`.
- Documentație tehnică finală de prezentare: arhitectură, model DB, API, securitate, limitări.
- Fișier explicit cu surse externe: biblioteci npm, iconițe lucide, framework-uri, eventuale modele externe dacă se adaugă ulterior.
- Instrucțiuni de rulare offline/pe laptopul de prezentare.
- În README-ul final trebuie menționat clar ce componente sunt cod propriu și ce biblioteci externe sunt folosite, deoarece regulamentul cere declararea materialelor/fragmentelor care nu aparțin autorului.
