# AGENTS.md

Afspraken voor AI-assistenten (Claude, Copilot, Codex, ...) die meewerken aan **Smart Sort Quest**.

## Werkwijze

- Werk **stap per stap**: eerst een kort voorstel, dan akkoord van Bram, dan alleen die stap uitvoeren.
- De AI is een **sparringpartner**. Leg keuzes en afwegingen voor in plaats van zelf grote beslissingen te nemen.
- Maak geen stap half af en bouw niet vooruit op stappen die nog niet goedgekeurd zijn.
- Communicatie in het Nederlands, kort en direct.

## Git

- Nooit rechtstreeks op `main` werken.
- Elke stap krijgt een eigen branch: `feature/NN-korte-naam` (bv. `feature/02-camera`).
- Kleine commits met Nederlandse commitberichten.
- **Geen `Co-Authored-By`-regel of andere AI-vermelding in commits.**
- Committen, pushen en mergen enkel na akkoord van Bram.

## Project

- Track D (eigen idee): een smartphone scant een lege verpakking en de app geeft sorteeradvies.
- Stack: React + Vite, `@teachablemachine/image` (minimumvereiste van de opdracht, met `@tensorflow/tfjs` 1.3.1), Firebase (Firestore + anonieme login), hosting op Vercel.
- Klassen (exact zoals in Teachable Machine): `pmd`, `papier_karton`, `restafval`, `achtergrond_geen_object`.
  - `achtergrond_geen_object` betekent "geen object": geen advies en geen punten.
- Drempels (zekerheid, aantal stabiele frames, reset-tijd) staan in **één configbestand**, nooit verspreid in de code.

## Regels

- **Privacy:** camerabeelden verlaten het toestel nooit. Enkel het label, de score en de punten gaan naar Firebase.
- **Geen secrets in git.** De Firebase-config komt via `.env` (`VITE_...`-variabelen). `.env` staat in `.gitignore` en `.env.example` toont welke variabelen nodig zijn.
- Geen nieuwe npm-pakketten en geen uitbreidingen zonder akkoord.
- UI-teksten en README in het Nederlands.

## Commando's

```bash
npm install      # afhankelijkheden installeren
npm run dev      # lokale dev-server (http://localhost:5173)
npm run build    # productiebuild in dist/
npm run preview  # productiebuild lokaal bekijken
```

## Een stap is klaar wanneer

1. `npm run build` zonder fouten slaagt;
2. Bram de stap zelf getest heeft;
3. de wijziging gecommit is op de branch van die stap.
