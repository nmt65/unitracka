# Prezentare tehnică scurtă

Durată recomandată: 5-6 minute.

## Discurs

UniTrack rezolvă o problemă concretă: procesul de admitere este fragmentat între site-uri, fișiere și termene limită. Platforma reunește într-un singur loc catalogul universităților, dosarul candidatului, documentele, aplicațiile și comunicarea cu instituțiile.

Aplicația are trei roluri. Studentul caută programe, pregătește documentele, compară opțiuni și trimite candidatura. Universitatea primește aplicațiile, consultă documentele autorizate și actualizează statusul. Administratorul gestionează catalogul și conturile instituționale. Fiecare rol vede doar funcțiile de care are nevoie.

Frontendul este construit în React și Vite și este livrat prin Netlify. Cererile `/api` sunt redirecționate către API-ul Express găzduit pe Render. Backendul folosește Sequelize pentru PostgreSQL, găzduit în Supabase. Separarea păstrează interfața rapidă și toate secretele exclusiv pe server.

Autentificarea folosește parole hash-uite cu bcrypt și sesiuni JWT în cookie `httpOnly`. Formularul este protejat prin CSRF, rate limiting, validare Zod și sanitizare. CNP-ul nu este salvat în clar: serverul păstrează numai un hash cu pepper pentru a impune un singur cont per elev. Autorizarea se aplică pe fiecare endpoint, iar PostgreSQL adaugă politici Row Level Security.

La încărcarea unui document, backendul validează tipul și dimensiunea, păstrează fișierul în storage privat și poate trimite conținutul către Gemini. Modelul returnează o clasificare structurată, dar decizia este verificată și prin reguli deterministe; un document incompatibil nu este acceptat automat. Cheia API nu ajunge niciodată în browser.

Calitatea proiectului este verificată automat prin build de producție, controale de sintaxă, teste Playwright pe desktop și mobil și un script care returnează raport JSON pentru frontend, API și baza de date. Astfel, demonstrația poate arăta nu doar interfața, ci și starea reală a sistemului.

## Traseu sincronizat

| Timp | Ecran | Ce demonstrezi |
|---|---|---|
| 0:00-0:35 | Pagina publică | Problema, cele trei roluri și accesul în platformă |
| 0:35-1:15 | Login | Autentificare, verificarea emailului, recuperare și passkey |
| 1:15-2:00 | Dashboard student | Progres, deadline-uri și navigare rapidă |
| 2:00-2:45 | Universități | Căutare, ofertă educațională și selectarea programului |
| 2:45-3:30 | Documente | Checklist, upload privat și verificarea asistată |
| 3:30-4:00 | Comparare | Alegerea universităților și comparația criteriilor |
| 4:00-4:40 | Workspace universitate | Aplicații primite, documente și schimbarea statusului |
| 4:40-5:15 | Admin | Catalog, programe, conturi instituționale și audit |
| 5:15-5:45 | Raport JSON | `npm run verify:live` și starea serviciilor |

## Comenzi înainte de prezentare

```bash
npm run verify
```

```powershell
npm run verify:live
```

În ziua prezentării deschide din timp `https://unitrack.sbs`, autentifică cele trei roluri în ferestre separate și păstrează raportul JSON într-un terminal.
