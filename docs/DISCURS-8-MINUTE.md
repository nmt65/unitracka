# Discurs UniTrack - 8 minute

## 0:00-0:45 - Introducere

Bună ziua. Proiectul meu se numește UniTrack și rezolvă o problemă pe care o întâlnește aproape orice elev care aplică la facultate: informația este împărțită între multe site-uri, documentele sunt ținute în foldere diferite, iar statusul aplicațiilor ajunge să fie urmărit în tabele sau în emailuri.

UniTrack aduce studentul și universitatea în același flux digital. Studentul își pregătește dosarul o singură dată, compară programe și urmărește aplicațiile, iar universitatea primește candidaturi structurate și poate verifica documentele.

## 0:45-1:40 - Ce oferă produsul

Platforma are trei roluri clare: student, universitate și administrator.

Studentul vede doar datele proprii. El poate căuta programe, compara universități, încărca documente, urmări deadline-uri și trimite aplicații. Universitatea are un workspace separat în care publică oferta educațională și procesează candidaturile. Administratorul aprobă instituțiile și verifică starea sistemului.

Interfața nu este un site de prezentare, ci un produs funcțional. Fiecare rol vede doar acțiunile de care are nevoie.

## 1:40-3:10 - Demonstrație student

Încep din catalog. Pot căuta o universitate sau un program și pot selecta opțiunile care mă interesează. Pagina de comparație pune programele alături și evidențiază criterii reale: deadline, taxă, documente, tip de studiu și oferta educațională.

După ce aleg un program, UniTrack construiește checklistul dosarului. În secțiunea Documente văd ce este complet și ce lipsește. La încărcare, sistemul nu presupune că un fișier este corect doar din nume. Verifică tipul, conținutul extras și indiciile specifice, apoi poate cere modelului Gemini un răspuns structurat. Dacă încrederea este insuficientă sau documentul nu corespunde tipului cerut, fișierul nu este acceptat automat.

Dashboardul rezumă strict ce trebuie să fac în continuare: câte aplicații am trimis, câte documente lipsesc și care este următoarea acțiune.

## 3:10-4:10 - Demonstrație universitate și admin

În workspace-ul universității, aplicațiile pot fi filtrate și deschise individual. Evaluatorul vede programul, candidatul și documentele reale, apoi poate actualiza statusul. Oferta educațională și profilul instituției sunt gestionate separat, astfel încât interfața să nu amestece administrarea cu evaluarea.

Administratorul vede instituțiile, conturile, programele și jurnalul de audit. Doar administratorul poate aproba sau crea instituții în catalog.

## 4:10-5:25 - Arhitectură

Frontendul este realizat în React și Vite. Backendul este un API Express, iar datele sunt stocate în PostgreSQL prin Sequelize. Frontendul este publicat pe Netlify, API-ul rulează pe Render, iar baza de date este găzduită în Supabase.

Componentele sunt separate pe responsabilități: pagini și servicii în frontend, respectiv rute, controllere, servicii, modele și validatoare în backend. Paginile sunt încărcate la cerere, ceea ce reduce dimensiunea codului necesar la prima accesare.

## 5:25-6:45 - Securitate

Securitatea este importantă deoarece proiectul procesează identitate și documente.

Parolele sunt hash-uite. Sesiunea este transmisă într-un cookie `httpOnly`, iar cererile care modifică date sunt protejate CSRF. API-ul folosește Helmet, CORS explicit, rate limiting, limite de dimensiune și validare Zod. Interogările sunt parametrizate prin ORM.

CNP-ul este validat, dar nu este salvat în clar. Stochez doar un HMAC, iar baza are o constrângere unică, astfel încât același CNP să nu poată crea două conturi de student. Separarea pe roluri este dublată de politici RLS în PostgreSQL.

## 6:45-7:35 - Testare și fiabilitate

Proiectul are teste automate Playwright pentru desktop și mobil. Acestea verifică autentificarea, navigarea, funcțiile principale și comportamentul notificărilor. Un script separat verifică API-ul, conexiunea la baza de date, CSRF, autentificarea și autorizarea și returnează un raport JSON.

Pentru servicii externe există degradare controlată: dacă modelul AI nu răspunde, documentul nu este declarat automat valid, iar verificările deterministe continuă.

## 7:35-8:00 - Încheiere

Originalitatea UniTrack nu constă într-un singur ecran, ci în conectarea completă a procesului: catalog, dosar verificat, candidatură și evaluare instituțională, cu securitate aplicată la fiecare nivel.

Scopul proiectului este simplu: studentul să știe mereu ce urmează, iar universitatea să primească un dosar clar și verificabil. Vă mulțumesc.

