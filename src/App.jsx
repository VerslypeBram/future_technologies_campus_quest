import Camera from './components/Camera.jsx'

export default function App() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Smart Sort Quest</h1>
      <p>Scan een lege verpakking en ontdek in welke afvalbak ze hoort.</p>
      <Camera />
    </main>
  )
}
