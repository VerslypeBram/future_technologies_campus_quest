# Model toevoegen

Zet hier de export van Teachable Machine:

1. Teachable Machine > Export Model > Tensorflow.js > **Download**.
2. Pak de zip uit en kopieer `model.json`, `metadata.json` en `weights.bin` naar deze map.

Alternatief: kies **Upload (shareable link)** en zet de link in `.env`:
`VITE_MODEL_URL=https://teachablemachine.withgoogle.com/models/XXXX/`
