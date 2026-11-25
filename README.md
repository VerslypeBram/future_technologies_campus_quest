# Smart Sort Quest (Campus Quest – Track D)

Een mobiele webapplicatie waarmee je afval correct leert sorteren (`PMD`, `Papier/Karton`, `Restafval`) met behulp van een zelfgetraind beeldherkenningsmodel. De app draait volledig in de browser op een smartphone via HTTPS en beloont correcte scans met een compliment. Op de achtergrond houdt Firebase per gebruiker de scans en punten bij; de app toont het aantal gesorteerde verpakkingen.

## 🔗 Live Demo & Video

- **Live HTTPS-app:** https://future-technologies-campus-quest.vercel.app/
- **Demovideo (max. 2 min):** `[Plaats hier de link naar je demovideo]`

---

## 🎯 Gekozen Track & Concept

- **Track:** D – Eigen idee (Afvalsorteerhulp)
- **Klassen** (exact zoals in Teachable Machine):
  1. `PMD` – plastic flessen, drankblikjes, brikjes, yoghurtpotjes
  2. `Papier/Karton` – kartonnen doosjes, papieren zakken, kranten
  3. `Restafval` – chipszakken, koffiecapsules, vuile servetten, folies
  4. `Geen verpakking` – lege tafel/vloer (negatieve controleklasse om valse triggers te voorkomen)

---

## 🧠 Dataset & Modeltraining

- **Tool:** Google Teachable Machine (Image Project – Standard image model)
- **Omvang:** 100 foto's per klasse (400 beelden in totaal). Een deel van de foto's toont hetzelfde object vanuit andere hoeken.
- **Variatie:**
  - Verschillende objecten per afvalstroom (intact én gedeeltelijk ingedeukt/verkreukeld).
  - Opgenomen op meerdere momenten van de dag (natuurlijk daglicht vs. kunstlicht).
  - Gefotografeerd op verschillende ondergronden (hout, wit bureau, donkere vloer) om achtergrond-bias te beperken.
- **Export:** TensorFlow.js-export (`model.json`, `metadata.json`, `weights.bin`) in [`public/model/`](public/model/).
- **Testen & fouten:** zie [`docs/faalsituaties.md`](docs/faalsituaties.md).

---

## 🔒 Privacy

- Alle trainingsfoto's bevatten enkel losse objecten en ondergronden (geen personen).
- **Beelden blijven op het toestel.** Het model draait lokaal in de browser via TensorFlow.js. Camerabeelden worden nooit geüpload of opgeslagen.
- Naar Firebase gaat enkel een bevestigde scan: **label, zekerheid, punten en tijdstip**, gekoppeld aan een anonieme gebruikers-ID (geen naam of e-mail).

---

## ⚙️ Technische Stack & Anti-fop Logica

- **Frontend:** React + Vite
- **AI Inference:** `@teachablemachine/image` + `@tensorflow/tfjs` 1.3.1 (lokaal op het toestel)
- **Backend / BaaS:** Firebase – anonieme login + Firestore (punten en gesorteerde items)
- **Hosting:** Vercel (HTTPS vereist voor smartphone-camera)

**Anti-fop regels** (instelbaar in [`src/config.js`](src/config.js)):

1. **Zekerheidsdrempel & stabilisatie:** Een detectie telt pas mee bij `≥ 90%` zekerheid gedurende 6 opeenvolgende frames (~1,5 sec).
2. **Reset-vereiste:** Na het scoren van punten moet de camera eerst 8 frames (~2 sec) `Geen verpakking` detecteren voordat een volgende scan punten oplevert. Zo telt hetzelfde object niet dubbel.
3. **Firestore-regels** ([`firestore.rules`](firestore.rules)): een gebruiker kan enkel zijn eigen punten wijzigen, maximaal +10 per keer, en enkel scans met een geldig label en `≥ 90%` zekerheid opslaan.

De beslislogica zit in [`src/lib/stabilizer.js`](src/lib/stabilizer.js) en is getest met Vitest (`npm test`).

---

## 🚀 Hoe starten (Lokaal testen)

1. Clone deze repository:
   ```bash
   git clone https://github.com/VerslypeBram/future_technologies_campus_quest.git
   cd future_technologies_campus_quest
   ```
2. Installeer de afhankelijkheden:
   ```bash
   npm install
   ```
3. Maak een `.env` aan op basis van `.env.example` en vul de Firebase-config in
   (Firebase-console → Project settings → Your apps). `.env` wordt niet gecommit.
4. Zorg dat het model in `public/model/` staat (zie [`public/model/LEESMIJ.md`](public/model/LEESMIJ.md)).
5. Start de dev-server en open http://localhost:5173:
   ```bash
   npm run dev
   ```

**Firebase eenmalig instellen:** zet *Anonymous sign-in* aan (Authentication), maak een Firestore-database aan en publiceer de regels uit `firestore.rules`. Voeg het Vercel-domein toe bij *Authentication → Settings → Authorized domains*.

**Deploy op Vercel:** importeer de repo, zet de `VITE_FIREBASE_*`-variabelen onder *Environment Variables* en deploy.

---

## 📝 Reflectie

Zie [`docs/reflectie.md`](docs/reflectie.md).
