# Hardening pentru producție

Acest document separă funcțiile active din cod de serviciile care necesită configurare externă.

## 1. Stocarea privată a documentelor

1. Creează în Supabase Storage bucket-ul privat `admission-documents`.
2. Adaugă pe Render `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` și `DOCUMENT_STORAGE_BUCKET`.
3. Nu adăuga cheia service-role în Netlify, frontend sau GitHub.
4. Backend-ul va stoca în SQL numai metadatele și calea obiectului; descărcarea trece prin autorizarea API-ului.

Fără aceste variabile, aplicația păstrează compatibilitatea cu stocarea actuală în baza de date.

## 2. Antivirus

Configurează un serviciu HTTP izolat, bazat pe ClamAV sau un furnizor echivalent, care acceptă multipart `file` și întoarce:

```json
{ "clean": true, "provider": "clamav" }
```

Setează `FILE_SCAN_URL` și, dacă este necesar, `FILE_SCAN_TOKEN`. După validare setează `FILE_SCAN_REQUIRED=true`. În acest mod, o scanare indisponibilă blochează salvarea fișierului.

## 3. RLS strict

Aplică politicile:

```bash
npm run db:rls
```

Auditează starea:

```bash
npm run db:rls:audit
```

Pentru RLS strict, conexiunea API trebuie să folosească un rol PostgreSQL `NOBYPASSRLS`, iar fiecare tranzacție autentificată trebuie să seteze `app.current_user_id`, `app.current_user_role` și `app.current_institution_id`. Nu activa `FORCE ROW LEVEL SECURITY` pe conexiunea owner înainte de această migrare, deoarece poți bloca loginul și migrațiile.

## 4. GDPR

Verificare fără ștergere:

```bash
npm run gdpr:retention
```

Aplicare controlată:

```bash
npm run gdpr:retention -- --execute
```

Politica juridică finală și duratele contractuale trebuie validate de responsabilul cu protecția datelor al fiecărei instituții.

## 5. Registre oficiale și semnătură

Codul include adaptoare server-side pentru `OFFICIAL_REGISTRY_API_URL` și `QUALIFIED_SIGNATURE_API_URL`. Activarea necesită alegerea furnizorului, contract, bază legală, maparea răspunsurilor și testare într-un sandbox oficial. Până atunci, panoul admin raportează aceste integrări ca neconfigurate.
