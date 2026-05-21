# Verificare AI documente

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
GEMINI_DOCUMENT_MODEL=gemini-1.5-flash
OPENAI_ADVISOR_MODEL=gpt-4o-mini
GEMINI_ADVISOR_MODEL=gemini-1.5-flash
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

Raspunsul include `label`, `confidence`, `accepted` si `explanation`, apoi actualizeaza documentul in baza de date cu `verified` sau `rejected`. Pentru fisiere imagine, OpenAI primeste si imaginea. Pentru Gemini, payload-ul include fisierul atasat inline, iar fallback-ul local foloseste numele fisierului si textul extras.

## Limitari corecte pentru documentatie

Sistemul nu inlocuieste validarea umana a secretariatului. AI-ul este folosit ca pre-verificare si triere, iar decizia finala ramane la contul de universitate.
