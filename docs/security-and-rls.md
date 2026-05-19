# Securitate si RLS

UniTrack foloseste aparare in mai multe straturi:

- parole hash-uite cu `bcrypt`;
- JWT in cookie `httpOnly`;
- CSRF double-submit pentru metodele care modifica date;
- validare Zod pe request body/query;
- sanitizare XSS pentru textul primit;
- Sequelize ORM cu parametri, fara concatenare SQL manuala;
- rate limit global, rate limit separat pentru auth si verificari AI;
- `helmet`, payload JSON limitat si CORS configurabil;
- CNP-ul nu se salveaza in clar, ci ca HMAC-SHA256 cu `CNP_PEPPER`; in UI se pastreaza doar ultimele 4 cifre;
- audit log pentru login, resetare parola, schimbari de profil, actiuni admin, aplicatii, statusuri si verificari AI.

## Roluri

- `student`: isi gestioneaza profilul, aplicatiile, documentele si exporturile.
- `university`: vede aplicatiile trimise catre institutia lui si le poate sorta/actualiza.
- `admin`: adauga universitati, creeaza conturi institutionale si are acces de administrare.

## Conturi live

Pentru deployment, datele demo trebuie oprite:

```env
NODE_ENV=production
SEED_DEMO=false
BOOTSTRAP_ADMIN=true
ADMIN_EMAIL=admin@domeniu.ro
ADMIN_PASSWORD=o-parola-puternica
```

Astfel se creeaza doar primul admin, fara elevi sau aplicatii fictive. Dupa primul login, adminul adauga universitatile reale si conturile institutionale.

Utilizatorii au in profil:

- deconectare;
- schimbare parola;
- stergere cont cu parola si confirmarea `STERG CONTUL`;
- protectie impotriva stergerii ultimului admin.

## PostgreSQL Row Level Security

Scriptul `backend/sql/postgres_rls.sql` activeaza RLS pentru:

- `Users`
- `Institutions`
- `Universities`
- `AdmissionApplications`
- `Documents`
- `Notifications`
- `AuditLogs`

Pentru PostgreSQL, API-ul trebuie sa seteze variabilele de context in tranzactia curenta:

```sql
SELECT set_config('app.current_user_id', '<uuid>', true);
SELECT set_config('app.current_user_role', 'student', true);
SELECT set_config('app.current_institution_id', '', true);
```

Politicile permit:

- adminului sa administreze toate resursele;
- studentului sa vada doar randurile lui si aplicatiile lui;
- universitatii sa vada doar aplicatiile catre institutia asociata;
- documentele si notificarile sa fie citite/modificate doar de actorii implicati;
- logurile de audit sa fie vizibile pentru admin si, defensiv, pentru actorul care a generat randul.

SQLite ramane baza locala de development. Pentru demo InfoEducatie se poate rula imediat local, iar pentru deployment Postgres se aplica scriptul RLS dupa prima pornire a aplicatiei.
