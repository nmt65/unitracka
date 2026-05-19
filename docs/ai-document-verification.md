# Verificare AI documente

Fluxul de documente are trei niveluri:

1. studentul trimite sau completeaza documentele cerute pentru aplicatie;
2. endpoint-ul `/api/ai/documents/check` clasifica documentul dupa nume si text extras;
3. universitatea vede documentele si statusul aplicatiei in workspace.

## Furnizori suportati

In development functioneaza si fara chei externe, printr-un clasificator local euristic `local-yolo-style`. Pentru o verificare mai puternica se pot seta:

```env
OPENAI_API_KEY=
OPENAI_DOCUMENT_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_DOCUMENT_MODEL=gemini-1.5-flash
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

Raspunsul include `label`, `confidence`, `accepted` si `explanation`, apoi actualizeaza documentul in baza de date cu `verified` sau `rejected`.

## Limitari corecte pentru documentatie

Sistemul nu inlocuieste validarea umana a secretariatului. AI-ul este folosit ca pre-verificare si triere, iar decizia finala ramane la contul de universitate.
