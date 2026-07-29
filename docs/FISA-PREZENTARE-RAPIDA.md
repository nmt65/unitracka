# UniTrack - fisa rapida pentru prezentare

## Ideea in 20 de secunde

UniTrack este o platforma completa pentru gestionarea admiterii universitare. Elevul isi organizeaza optiunile, documentele, termenele si aplicatiile intr-un singur loc, iar universitatea primeste si evalueaza dosarele intr-un workspace separat. Platforma reduce erorile, documentele lipsa si timpul pierdut intre site-uri, tabele si emailuri.

## Ordinea demo-ului (10-12 minute)

### 1. Problema si solutia - 45 secunde

- Admiterea este fragmentata: fiecare universitate are alte termene, acte si proceduri.
- UniTrack reuneste catalogul, compararea, dosarul, calendarul si comunicarea cu universitatea.
- Exista trei roluri clar separate: student, universitate si administrator.

### 2. Pagina publica si autentificarea - 45 secunde

- Prezint identitatea vizuala, modul luminos/intunecat si interfata bilingva.
- Mentionez verificarea emailului, recuperarea parolei si protectia sesiunii.
- Fiecare CNP poate fi asociat unui singur cont, iar valoarea completa nu este pastrata.

### 3. Contul studentului - 4 minute

1. **Dashboard:** progresul dosarelor, urgentele si aplicatiile active.
2. **Universitati:** cautare, filtrare, oferta educationala si adaugarea unei optiuni.
3. **Comparare:** selectie directa si comparatie dupa program, cost, termen, documente si compatibilitate.
4. **Documente:** checklist separat pentru fiecare program si verificare asistata de AI.
5. **Admitere:** aplicatia poate fi trimisa numai cu date si documente justificative.
6. **Calendar si notificari:** termenele sunt centralizate si usor de urmarit.
7. **Profil:** rezultate validate, preferinte, poza de profil si controlul contului.

### 4. Contul universitatii - 2 minute

- Universitatea vede numai aplicatiile trimise institutiei sale.
- Poate cauta, filtra si sorta candidatii, deschide dosarul si consulta documentele.
- Poate schimba starea aplicatiei si comunica decizia prin notificari.
- Interfata nu afiseaza functii de student, deoarece autorizarea este bazata pe rol.

### 5. Administrare - 1 minut

- Administratorul gestioneaza institutiile, programele si conturile institutionale.
- Doar administratorul poate crea sau aproba universitati.
- Operatiile sensibile sunt validate pe server, nu doar ascunse in interfata.

### 6. Tehnic si securitate - 2 minute

- **Frontend:** React, Vite, React Router, CSS modularizat si iconite Lucide.
- **Backend:** Node.js si Express, organizat pe rute, controllere, servicii si middleware.
- **Date:** PostgreSQL in Supabase, accesat prin Sequelize; mediul local poate folosi SQLite.
- **Hosting:** frontend pe Netlify, API pe Render, baza de date in Supabase.
- **Autentificare:** parole hashuite cu bcrypt, sesiune prin cookie HTTP-only, verificare email si resetare parola.
- **Protectii:** validare server-side, CSRF, CORS restrictiv, rate limiting, Helmet, interogari parametrizate si control pe rol.
- **CNP:** validare algoritmica si stocare doar ca hash cu pepper; CNP-ul complet nu ramane in baza.
- **AI:** Gemini analizeaza continutul real al fisierului; rezultatul este un ajutor pentru clasificare, nu o decizie finala de admitere.

## Arhitectura intr-o propozitie

Browserul ruleaza interfata React de pe Netlify, aceasta comunica prin HTTPS cu API-ul Express de pe Render, iar API-ul valideaza drepturile si opereaza asupra bazei PostgreSQL din Supabase si a serviciilor externe de email si AI.

## Intrebari tehnice probabile

**De ce PostgreSQL?**  
Pentru relatii clare intre utilizatori, institutii, aplicatii si documente, tranzactii sigure, constrangeri si scalare.

**Cum preveniti SQL injection?**  
Folosim Sequelize si interogari parametrizate, validare a intrarilor si nu concatenam datele utilizatorului in SQL.

**Cum este protejat CNP-ul?**  
Este verificat algoritmic, apoi transformat intr-un hash cu pepper. Aplicatia foloseste hash-ul pentru unicitate si nu stocheaza CNP-ul complet.

**Poate un student vedea dosarul altuia?**  
Nu. API-ul verifica utilizatorul autentificat, rolul si proprietatea fiecarei resurse. Universitatea vede doar aplicatiile propriei institutii.

**AI-ul poate aproba sau respinge un candidat?**  
Nu. AI-ul clasifica documente si ofera explicatii. Decizia ramane la universitate, iar rezultatele incerte cer verificare umana.

**Ce se intampla daca serviciul AI nu raspunde?**  
Aplicatia trateaza eroarea controlat si nu marcheaza documentul ca verificat. Functiile esentiale raman disponibile.

**Cum ati testat aplicatia?**  
Prin build de productie, verificari backend si teste end-to-end Playwright pe desktop si mobil pentru autentificare, roluri si fluxurile principale.

**De ce trei servicii de hosting?**  
Fiecare are un rol clar: Netlify livreaza rapid frontend-ul, Render ruleaza API-ul, iar Supabase ofera PostgreSQL administrat si backup.

## Fraza de incheiere

UniTrack nu este doar un tracker, ci infrastructura comuna dintre candidat si universitate: un dosar verificabil, un proces transparent si mai putine sanse ca o admitere sa fie ratata din cauza unui document sau termen uitat.

## Daca pierd firul

Revin la traseul: **problema -> student -> universitate -> securitate -> impact**.

## Conturi pentru demonstratie

| Rol | Email | Parola |
| --- | --- | --- |
| Student | `andrei@unitracker.ro` | `Demo1234!` |
| Universitate | `admitere@unibuc.ro` | `Demo1234!` |

Conturile sunt destinate exclusiv demonstratiei. Nu prezenta parola contului de administrator.
