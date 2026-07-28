# Discurs UniTrack - 15 minute

## 0:00-1:20 - Context și problemă

Bună ziua. Proiectul pe care îl prezint se numește UniTrack. Este o platformă web care organizează procesul de admitere universitară, de la alegerea programului până la răspunsul instituției.

Ideea a pornit de la o problemă practică. Un elev care aplică la mai multe universități trebuie să urmărească site-uri diferite, cerințe diferite, deadline-uri diferite și versiuni diferite ale acelorași documente. De obicei, informațiile ajung într-un amestec de foldere, emailuri, foi de calcul și notițe. În același timp, universitatea primește dosare neuniforme și trebuie să verifice manual dacă fiecare candidatură este completă.

UniTrack nu încearcă să înlocuiască decizia universității. El construiește infrastructura prin care studentul pregătește corect dosarul, iar instituția îl primește într-o formă coerentă și trasabilă.

## 1:20-2:40 - Utilizatori și principiu de produs

Platforma are trei roluri.

Primul este studentul. El caută programe, compară opțiuni, pregătește documentele și urmărește aplicațiile.

Al doilea este contul de universitate. Acesta publică oferta educațională și procesează candidaturile primite.

Al treilea este administratorul platformei. El aprobă instituții, gestionează conturi și verifică starea operațională.

Principiul de design este că fiecare rol vede doar informația necesară deciziei curente. De aceea, interfețele nu sunt doar același dashboard cu alte etichete. Navigarea, acțiunile și datele sunt adaptate rolului.

## 2:40-5:20 - Demonstrarea fluxului studentului

Încep de pe pagina publică. Ea explică produsul fără să oblige utilizatorul să își creeze imediat cont. De aici intru în autentificare.

După login ajung în dashboard. Acesta nu încearcă să afișeze toate datele sistemului. Îmi arată universitățile urmărite, aplicațiile trimise, documentele lipsă și nivelul de pregătire. Mai important, îmi spune care este următoarea acțiune.

În catalog pot căuta după numele universității sau program. Rezultatele sunt limitate și căutarea este temporizată, astfel încât aplicația să nu trimită o cerere nouă la fiecare tastă. Pentru fiecare instituție văd oferta educațională, țara, descrierea și legătura oficială.

Selectez programele și deschid comparația. Aici nu compar doar numele universităților. Compar deadline-uri, taxe, tipuri de studiu, documente și programe. Selecția este păstrată local, astfel încât utilizatorul să nu piardă comparația dacă navighează în altă pagină.

După alegerea programului deschid Admitere. Sistemul construiește cerințele dosarului pe baza programului selectat. Studentul nu poate declara pur și simplu că are o medie sau un certificat. Rezultatele academice sunt deblocate doar după existența unui document atestator verificat.

În pagina Documente văd checklistul. La încărcarea unui fișier, sistemul verifică extensia, dimensiunea, textul extras și concordanța cu tipul cerut. Modelul Gemini poate analiza documentul și întoarce un rezultat structurat, dar nu este singura regulă. Dacă modelul nu este disponibil sau încrederea este mică, sistemul păstrează documentul pentru revizuire și nu îl declară automat valid.

Calendarul și notificările transformă aceste date în acțiuni. Deadline-urile expirate nu sunt prezentate ca zile negative, iar notificările pot fi marcate citite și se închid corect la click în exterior.

## 5:20-7:10 - Fluxul universității

Schimb rolul și intru în workspace-ul unei universități.

Interfața este împărțită în trei zone clare. Prima conține aplicațiile primite. Pot filtra după program și status, pot deschide un candidat și pot vedea documentele încărcate, nu doar un indicator generic de verificare.

A doua zonă este oferta educațională. Instituția adaugă programele anului curent și cerințele lor. Aceasta este sursa din care studentul vede opțiunile din catalog.

A treia zonă este profilul universității: descriere succintă, argumentele relevante și linkul către site-ul oficial.

Statusurile aplicației sunt controlate de universitate. Studentul le poate urmări, dar nu le poate modifica.

## 7:10-8:15 - Rolul administratorului

Administratorul are un panou separat. El poate aproba instituțiile înainte ca acestea să apară public, poate gestiona conturile instituționale și poate vedea programele și evenimentele de audit.

Această separare este importantă. Un student nu poate adăuga o universitate oficială, iar o universitate nu poate accesa datele alteia. Aceste reguli sunt aplicate în API, nu doar ascunse în interfață.

## 8:15-10:15 - Arhitectura tehnică

Frontendul este construit cu React și Vite. Folosesc componente reutilizabile și pagini încărcate dinamic. Code splittingul înseamnă că pagina publică nu descarcă din prima panoul de administrator, calendarul și workspace-ul universității.

Backendul este un API Express. Fiecare domeniu are rute, controller, serviciu, validator și modele. Validarea requesturilor este făcută cu Zod.

Accesul la date este realizat prin Sequelize. În producție, baza este PostgreSQL în Supabase. Schema conține utilizatori, instituții, programe, aplicații, cerințe, documente, notificări, passkey-uri și audit.

Frontendul este servit de Netlify. Cererile `/api` sunt proxiate către Render. Această arhitectură păstrează frontendul rapid pe CDN și backendul separat, fără a expune secrete în browser.

Datele sunt transferate ca JSON. Exporturile și integrarea cu servicii externe sunt implementate în backend, unde cheile rămân în variabile de mediu.

## 10:15-12:20 - Securitate

Pentru autentificare, parola este hash-uită și nu poate fi recuperată din baza de date. După login, serverul setează un cookie `httpOnly`. JavaScriptul din browser nu poate citi acest cookie, ceea ce reduce riscul furtului tokenului prin XSS.

Pentru cererile care modifică date există protecție CSRF. CORS acceptă doar originile configurate. Helmet adaugă antete de securitate, iar rate limitingul limitează abuzul asupra autentificării și API-ului.

Toate datele de intrare sunt validate. Interogările trec prin ORM și sunt parametrizate, deci valorile utilizatorului nu sunt concatenate în SQL.

CNP-ul are un tratament special. Este validat cu structura și cifra de control, apoi transformat cu HMAC și un secret de server. În baza de date nu ajunge CNP-ul în clar. Coloana rezultată are constrângere unică, ceea ce implementează un singur cont de student pentru aceeași identitate.

Autorizarea verifică rolul și proprietatea resursei. În plus, proiectul conține politici Row Level Security pentru PostgreSQL. Astfel, separarea datelor nu depinde doar de un `if` din interfață.

Resetarea parolei și verificarea emailului folosesc tokenuri sau coduri cu expirare. Evenimentele administrative importante sunt înregistrate în audit.

## 12:20-13:25 - Testare, performanță și fiabilitate

Testarea are două niveluri.

Primul este testul de browser Playwright. El rulează pe desktop și mobil și parcurge autentificarea, navigarea și funcțiile principale. Verifică inclusiv comportamentul notificărilor.

Al doilea este scriptul de verificare pentru juriu. Acesta testează endpointurile de sănătate și readiness, inițializează CSRF, verifică faptul că o rută protejată respinge accesul anonim, se autentifică și testează rutele permise rolului. Rezultatul este JSON valid, cu durate și erori.

Pentru performanță, paginile sunt lazy-loaded, căutarea este temporizată, rezultatele vizibile sunt limitate, asseturile au cache lung și imaginile de profil sunt redimensionate. Am evitat efectele 3D deoarece într-un instrument de lucru ar crește timpul de încărcare fără să ajute utilizatorul.

## 13:25-14:15 - Originalitate și decizii

Originalitatea proiectului este fluxul bilateral. Multe produse oferă un catalog, un checklist sau un formular. UniTrack le conectează cu workspace-ul instituției, verificarea documentelor și reguli de securitate aplicate consecvent.

Interfața este scrisă special pentru produs, fără un template administrativ cumpărat. Sistemul vizual monocrom păstrează atenția pe date și folosește text, iconuri și structură, nu doar culoare, pentru a comunica statusul.

## 14:15-15:00 - Limitări și încheiere

Există și limite asumate. AI-ul este un asistent și nu poate înlocui validarea juridică a unui document. Oferta educațională trebuie menținută de instituții. Pentru o lansare națională ar fi necesară integrarea cu un serviciu oficial de identitate și un audit extern de securitate.

UniTrack demonstrează însă întregul flux: alegere, comparație, dosar, verificare, candidatură și evaluare. Studentul știe ce are de făcut, universitatea primește informație structurată, iar administratorul controlează ecosistemul.

Aceasta este contribuția proiectului: transformarea unui proces fragmentat într-un produs web coerent, verificabil și sigur. Vă mulțumesc și aștept întrebările dumneavoastră.

