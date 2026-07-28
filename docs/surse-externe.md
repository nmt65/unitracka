# Biblioteci și servicii externe

Acest document declară principalele componente care nu sunt scrise de autorii proiectului. Logica aplicației, schema, componentele React și stilurile UniTrack sunt dezvoltate în repository-ul proiectului.

## Biblioteci frontend

- React și React DOM - randarea interfeței pe componente;
- Vite și pluginul React - server de dezvoltare și build;
- Lucide React - iconițe SVG;
- SimpleWebAuthn Browser - integrarea WebAuthn/passkeys.

## Biblioteci backend

- Express - server HTTP și rutare API;
- Sequelize - ORM și modele relaționale;
- Zod - validarea contractelor API;
- bcryptjs - hash-uirea parolelor;
- jsonwebtoken - emiterea și verificarea JWT;
- Helmet - headere HTTP de securitate;
- cors - politica Cross-Origin Resource Sharing;
- express-rate-limit - limitarea cererilor;
- cookie-parser - citirea cookie-urilor;
- xss - sanitizarea textului;
- SimpleWebAuthn Server - verificarea passkeys;
- nodemailer - fallback SMTP;
- PDFKit - export PDF;
- pg și sqlite3 - driverele bazelor de date.

## Servicii

- Netlify - hosting frontend și proxy `/api`;
- Render - hosting pentru API-ul Node.js;
- Supabase - PostgreSQL administrat;
- Resend - livrarea emailurilor prin API HTTP;
- Google Gemini API - preclasificare multimodală opțională a documentelor;
- OpenAI API - furnizor alternativ opțional pentru analiză și asistent;
- GitHub - versionare și publicarea codului.

## Precizări

- Nicio cheie API nu este inclusă în codul public.
- Modelele externe asistă clasificarea; nu certifică autenticitatea juridică a documentelor.
- Iconițele provin din Lucide; identitatea vizuală, layout-urile și stilurile sunt proprii proiectului.
- Licențele exacte ale pachetelor se găsesc în metadatele npm și în fișierele `package-lock.json`.
