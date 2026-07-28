# Politica tehnică de retenție GDPR

UniTrack colectează numai datele necesare administrării dosarului de admitere. La înregistrare, utilizatorul acceptă explicit politica, iar serverul salvează data consimțământului și versiunea politicii.

## Reguli implementate

| Date | Retenție tehnică | Acțiune |
|---|---:|---|
| Coduri de verificare, resetare și challenge-uri passkey expirate | până la expirare | valorile sensibile sunt eliminate |
| Notificări deja citite | 180 zile | ștergere |
| Telemetrie AI fără conținutul fișierului | 365 zile | ștergere |
| Jurnal de audit | 730 zile | ștergere |
| Dosar și documente active | pe durata procesului de admitere | păstrare controlată de utilizator și instituție |

Fișierele, notele și CNP-ul nu sunt trimise în raportul de retenție. CNP-ul nu este stocat în clar. Ștergerea contului folosește relațiile cu `ON DELETE CASCADE`, cu excepția datelor de audit care trebuie păstrate separat conform politicii instituției.

## Rulare

Raport fără modificări:

```bash
npm run gdpr:retention
```

Aplicare explicită:

```bash
npm run gdpr:retention -- --execute
```

În producție, comanda de aplicare trebuie rulată numai de un operator autorizat sau de un job programat, după aprobarea responsabilului cu protecția datelor.
