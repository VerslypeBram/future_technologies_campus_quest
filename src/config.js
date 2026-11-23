// Centrale instellingen van de app.

// Map met de Teachable Machine-export (model.json, metadata.json, weights.bin).
// Standaard: public/model/. Of een gedeelde TM-link via VITE_MODEL_URL in .env.
const rawModelUrl = import.meta.env.VITE_MODEL_URL || '/model/'
export const MODEL_URL = rawModelUrl.endsWith('/') ? rawModelUrl : `${rawModelUrl}/`

// Wanneer telt een herkenning?
export const DETECTION = {
  threshold: 0.9, // minimale zekerheid per frame (90%)
  stableFrames: 6, // zoveel frames na elkaar boven de drempel
  intervalMs: 250, // ~4 voorspellingen per seconde -> 6 frames ≈ 1,5 s
  resetFrames: 8, // na een score eerst 8 frames (≈ 2 s) lege achtergrond tonen
}

export const POINTS_PER_SCAN = 10

// Klasse in Teachable Machine die "geen object" betekent: geen advies.
export const BACKGROUND_LABEL = 'Geen verpakking'

// Sorteeradvies per klasse. De sleutels moeten exact overeenkomen met de
// klassennamen in Teachable Machine (zie public/model/metadata.json).
export const WASTE_CLASSES = {
  PMD: {
    bin: 'Blauwe PMD-zak',
    color: '#2563eb',
    tip: 'Maak de verpakking leeg. Doppen mogen erop, verpakkingen niet in elkaar steken.',
  },
  'Papier/Karton': {
    bin: 'Papier en karton',
    color: '#b45309',
    tip: 'Plooi dozen plat. Vettig of nat karton (zoals een pizzadoos met resten) hoort bij restafval.',
  },
  Restafval: {
    bin: 'Restafvalzak',
    color: '#475569',
    tip: 'Deze verpakking kan niet gerecycleerd worden via PMD of papier.',
  },
}

// Modellen die de testpagina (/vergelijk) naast elkaar zet.
// Elke map bevat een Teachable Machine-export. Model A is ook het scanmodel.
export const COMPARE_MODELS = [
  { name: 'A: huidige dataset', url: MODEL_URL },
  { name: 'B: gevarieerde dataset', url: '/model-b/' },
]
