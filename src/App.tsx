import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { CreateBracketScreen } from './screens/CreateBracketScreen'
import { PickFlowScreen } from './screens/PickFlowScreen'
import { Layout } from './components/Layout'

function Placeholder({ name }: { name: string }) {
  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1>{name}</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Coming soon...</p>
      </div>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/new" element={<CreateBracketScreen />} />
        <Route path="/bracket/:id" element={<PickFlowScreen />} />
        <Route path="/bracket/:id/view" element={<Placeholder name="Bracket View" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
