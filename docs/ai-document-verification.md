# Verificare asistată documente

Fluxul de documente are trei niveluri:

1. studentul trimite sau completeaza documentele cerute pentru aplicatie;
2. endpoint-ul `/api/ai/documents/check` salveaza fisierul atasat, textul extras/OCR si clasifica documentul;
3. universitatea vede documentul exact din workspace, nu doar statusul de verificare.

## Furnizori suportati

In development functioneaza si fara chei externe, printr-un clasificator local de documente numit `unitrack-document-classifier`. Pentru o verificare mai puternica, in Render > Environment se seteaza una dintre cheile de mai jos:

```env
OPENAI_API_KEY=
OPENAI_DOCUMENT_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_DOCUMENT_MODEL=gemini-3.5-flash
OPENAI_ADVISOR_MODEL=gpt-4o-mini
GEMINI_ADVISOR_MODEL=gemini-3.5-flash
```

Ordinea este:

- OpenAI, daca exista `OPENAI_API_KEY`;
- Gemini, daca exista `GEMINI_API_KEY`;
- clasificator local, daca nu exista niciun API key.

## Tipuri recunoscute

- diploma BAC;
- foaie matricola;
- CV Europass;
- scrisoare motivatie;
- scrisori recomandare;
- cazier judiciar;
- adeverinta medicala;
- certificat limba;
- portofoliu.

Raspunsul include `label`, `confidence`, `accepted` si `explanation`, apoi actualizeaza documentul in baza de date cu `verified` sau `rejected`. Pentru fisiere imagine, OpenAI primeste si imaginea. Pentru Gemini, payload-ul include fisierul atasat inline. Clasificatorul local poate aproba doar fisiere text cu continut suficient; pentru PDF, imagini si documente Word este necesar provider extern sau aprobare manuala de universitate.

Reguli stricte introduse dupa testarea cu documente gresite:

- verificarea API cere un `fileDataUrl` real;
- formularul nu mai contine text/nume de fisier demo;
- schimbarea documentului selectat sterge fisierul, textul OCR si verdictul vechi;
- daca verificarea detecteaza un alt tip de document decat cel cerut, documentul ramane `rejected`;
- daca nu exista text OCR suficient si nu este configurat Gemini/OpenAI, documentul ramane de verificat manual.

## Limitari corecte pentru documentatie

Sistemul nu inlocuieste validarea umana a secretariatului. Verificarea asistata este folosita pentru pre-verificare si triere, iar decizia finala ramane la contul de universitate.
