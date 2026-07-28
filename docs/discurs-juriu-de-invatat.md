# Discurs UniTrack pentru juriu

Durată: aproximativ 10-12 minute.

## Introducere

Bună ziua. Proiectul meu se numește UniTrack.

UniTrack este o platformă care organizează întregul proces de admitere la universitate: alegerea programelor, pregătirea documentelor, trimiterea aplicațiilor și urmărirea răspunsurilor.

Ideea a pornit de la o problemă foarte simplă. Atunci când un elev aplică la mai multe universități, informațiile sunt împrăștiate. Fiecare instituție are alte termene, alte documente și alt mod de comunicare. Elevul ajunge să folosească foi Excel, notițe, emailuri și mai multe platforme în paralel.

UniTrack aduce toate aceste etape într-un singur flux clar.

## Cele trei roluri

Platforma are trei roluri: student, universitate și administrator.

Studentul își pregătește dosarul, urmărește universități, compară programe și trimite aplicații.

Universitatea primește numai aplicațiile trimise către instituția sa. Poate vedea documentele reale, poate oferi feedback și poate actualiza statusul candidatului.

Administratorul aprobă instituțiile, gestionează oferta educațională, creează conturile universităților și consultă jurnalul de audit.

Această separare nu există doar în interfață. Ea este verificată pe server pentru fiecare operație importantă.

## Fluxul studentului

Voi începe cu autentificarea.

La crearea contului, elevul își verifică adresa de email și introduce CNP-ul. CNP-ul este folosit pentru regula de cont unic, dar nu este stocat în clar. Serverul păstrează un HMAC și ultimele patru cifre.

Parola este protejată cu bcrypt, iar sesiunea este păstrată într-un cookie HTTP-only. Platforma suportă și passkeys, deci autentificare fără parolă.

După login, dashboard-ul arată imediat aplicațiile, documentele lipsă și deadline-urile apropiate.

În catalog, elevul poate căuta instituțiile aprobate și oferta lor educațională. Pentru o aplicație oficială, el alege un program existent. Nu poate inventa o facultate sau un program care nu există în oferta publicată.

În pagina de comparație poate selecta între două și patru opțiuni. Sunt comparate programul, taxa, deadline-ul, documentele și stadiul aplicației.

În pagina Admitere, elevul alege instituția și programul. Serverul verifică instituția, programul și eventualele duplicate. După trimitere, aplicația apare automat în workspace-ul universității, iar checklist-ul de documente este generat în funcție de cerințele programului.

## Documentele

Documentele reprezintă una dintre cele mai importante părți ale proiectului.

Studentul nu poate marca singur un document ca fiind verificat și nu poate schimba arbitrar tipurile cerute de universitate.

La încărcare sunt verificate extensia, dimensiunea, tipul fișierului și conținutul. Apoi poate fi folosit un model multimodal Gemini sau OpenAI pentru preclasificare.

Este important să precizez că modelul nu certifică autenticitatea juridică a documentului. El ajută la triere și detectează dacă fișierul pare să corespundă tipului cerut. Dacă rezultatul este nesigur, documentul rămâne pentru verificare manuală.

Decizia finală aparține universității.

## Workspace-ul universității

Contul instituțional vede numai candidații care au aplicat la universitatea asociată.

Aplicațiile pot fi filtrate după status și după starea documentelor. Universitatea poate deschide fișierul original, îl poate aproba sau respinge și poate schimba statusul aplicației.

Studentul primește imediat o notificare în platformă. Dacă serviciul de email este activ, primește și un email.

Universitatea își poate publica programele, termenele, numărul de locuri, metoda de admitere și lista documentelor cerute.

## Panoul administratorului

Administratorul controlează datele oficiale ale platformei.

El poate adăuga instituții, poate activa sau dezactiva o universitate, poate crea conturile personalului și poate configura programele pentru anul academic curent.

Panoul arată și starea serviciilor: conexiunea PostgreSQL, emailul, furnizorul de analiză și limitele zilnice.

Acțiunile sensibile sunt salvate în audit log, astfel încât putem vedea cine a făcut o modificare și când.

## Arhitectura

Frontend-ul este construit cu React și Vite. Interfața este responsive, are mod luminos și întunecat și folosește CSS dezvoltat special pentru proiect.

Backend-ul este un API REST construit cu Node.js și Express.

Validarea datelor se face cu Zod, iar accesul la baza de date cu Sequelize ORM.

În dezvoltare folosesc SQLite, pentru ca proiectul să poată fi pornit imediat pe orice laptop.

În producție folosesc PostgreSQL prin Supabase.

Frontend-ul este găzduit pe Netlify, API-ul rulează pe Render, iar domeniul public este unitrack.sbs.

Pentru email folosesc Resend prin API HTTP. Pentru analiza documentelor folosesc Gemini 2.5 Flash, cu OpenAI și clasificatorul local ca alternative.

Cheile acestor servicii există numai în variabilele de mediu ale serverului și nu ajung în frontend sau în repository.

## Securitatea

Securitatea este implementată în mai multe straturi.

Parolele sunt hash-uite cu bcrypt.

JWT-ul este păstrat într-un cookie HTTP-only și secure în producție.

Cererile care modifică date folosesc protecție CSRF.

CORS permite numai originile configurate.

Helmet adaugă headere de securitate.

Există rate limiting general și limite mai stricte pentru login și analiza documentelor.

Input-ul este validat cu Zod și sanitizat, iar Sequelize folosește interogări parametrizate pentru a reduce riscul de SQL injection.

Pe lângă autorizarea din API, proiectul include politici PostgreSQL Row Level Security pentru tabelele sensibile.

## Testarea

Proiectul poate fi verificat printr-o singură comandă.

`npm run check` validează backend-ul și construiește frontend-ul.

`npm run --silent jury:demo` verifică automat conexiunea, baza de date, CSRF, autentificarea, autorizarea și principalele funcții ale rolului curent. Rezultatul este un raport JSON valid.

Am adăugat și teste end-to-end Playwright pentru desktop și telefon, care verifică login-ul și navigarea reală prin aplicație.

## Limitări și concluzie

UniTrack nu încearcă să înlocuiască decizia unei comisii de admitere.

Inteligența artificială este folosită ca instrument de asistență, nu ca autoritate.

Pentru o implementare națională ar mai fi necesare contracte cu registre oficiale, semnătură electronică calificată și politici juridice GDPR adaptate fiecărei instituții.

Valoarea proiectului este că toate componentele lucrează împreună: interfața, API-ul, baza de date, rolurile, documentele, notificările și securitatea.

UniTrack transformă admiterea dintr-un proces fragmentat într-un traseu clar, verificabil și ușor de urmărit atât pentru elev, cât și pentru universitate.

Vă mulțumesc.

## Repere de memorie

Ține minte ordinea:

1. Problema.
2. Trei roluri.
3. Studentul.
4. Documentele.
5. Universitatea.
6. Administratorul.
7. Arhitectura.
8. Securitatea.
9. Testarea.
10. Limitarea și concluzia.

Fraza de salvare dacă uiți:

„Ideea principală este că UniTrack conectează elevul, universitatea și administratorul într-un singur flux, dar păstrează datele și permisiunile fiecărui rol separate.”
