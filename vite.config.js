import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:https` (mode https) gebruikt een self-signed certificaat,
// zodat de camera ook op een gsm in hetzelfde netwerk werkt.
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'https' && basicSsl()].filter(Boolean),
}))
