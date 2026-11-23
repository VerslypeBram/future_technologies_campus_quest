// Centrale instellingen van de app.

// Map met de Teachable Machine-export (model.json, metadata.json, weights.bin).
// Standaard: public/model/. Of een gedeelde TM-link via VITE_MODEL_URL in .env.
const rawModelUrl = import.meta.env.VITE_MODEL_URL || '/model/'
export const MODEL_URL = rawModelUrl.endsWith('/') ? rawModelUrl : `${rawModelUrl}/`
