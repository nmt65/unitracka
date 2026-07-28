# Arhitectură tehnică UniTrack

## Scop

UniTrack gestionează procesul de admitere dintre elevi și universități: cont unic per elev, dosare de aplicație, documente, verificare asistată, notificări și workspace pentru instituții.

## Stack

- Frontend: React + Vite, CSS custom, lucide-react.
- Backend: Node.js + Express, Sequelize ORM, Zod validation.
- Date local: SQLite pentru development.
- Date producție: PostgreSQL recomandat, cu politici RLS în `backend/sql/postgres_rls.sql`.
- Verificare documente: OpenAI/Gemini prin API key sau reguli locale stricte pentru fișiere text.

## Fluxuri principale

1. Studentul creează cont cu CNP valid; backend-ul salvează doar HMAC-ul CNP-ului și ultimele 4 cifre.
2. Studentul trimite aplicație către o instituție activă aprobată de admin.
3. Sistemul creează checklist-ul de documente și notifică workspace-ul universității.
4. Studentul verifică documentele prin fluxul asistat; documentele acceptate sunt marcate ca finalizate.
5. Universitatea sortează aplicațiile, schimbă statusul și trimite notificare studentului.
6. Adminul aprobă instituții și creează conturi de universitate.
7. Acțiunile critice sunt păstrate în audit log pentru verificare și depanare.

## Model de date

- `Users`: studenți, admini, conturi universitate, parolă hash-uită, CNP hash-uit.
- `Institutions`: universități reale aprobate în platformă.
- `Universities`: tracker personal al studentului pentru universități/programe urmărite.
- `AdmissionApplications`: aplicații trimise către instituții.
- `Documents`: documente din tracker sau dintr-o aplicație de admitere.
- `Notifications`: notificări interne pentru aplicații și schimbări de status.
- `AuditLogs`: evenimente de securitate și administrare.

## API principal

- `/api/auth/*`: login, signup, CNP check, resetare parolă.
- `/api/admin/*`: instituții, conturi universitate, listă utilizatori, audit log.
- `/api/applications/*`: aplicații student și workspace universitate.
- `/api/documents/*`: documente checklist.
- `/api/ai/documents/check`: verificare asistată documente.
- `/api/exports/*`: CSV, JSON, XML, PDF, ICS.

## Securitate

- Cookie JWT `httpOnly`; în producție este `secure` și folosește politica `sameSite` configurată pentru proxy-ul frontend/API.
- Token CSRF double-submit pentru metode unsafe.
- Rate limiting global, separat pentru auth și verificări documente.
- Validare Zod și sanitizare XSS pe body/query/params.
- Helmet și CORS configurabil prin `CORS_ORIGIN`.
- CNP-ul nu se păstrează în clar.
- SMTP este folosit pentru resetare parolă, notificare aplicație nouă și status aplicație când este configurat.
- Pentru PostgreSQL există RLS SQL pregătit.
- Autorizarea principală este aplicată în API; RLS strict per utilizator necesită rol PostgreSQL non-owner și context `app.*` setat în fiecare tranzacție.

## Demonstrație locală

```bash
npm run install:all
npm run dev
npm run check
npm run smoke
```

Conturi demo:

- Student: `andrei@unitracker.ro` / `Demo1234!`
- Admin: `admin@unitracker.ro` / `Demo1234!`
- Universitate: `admitere@unibuc.ro` / `Demo1234!`

## Deploy

- GitHub Pages: `npm run build:pages` publică frontend static pentru prezentare.
- Producție reală: backend Node separat, PostgreSQL, `SEED_DEMO=false`, `BOOTSTRAP_ADMIN=true`, chei secrete generate.
