import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Placeholder({ name }: { name: string }) {
  return <div style={{ padding: '2rem' }}><h1>{name}</h1><p>Coming soon...</p></div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/new" element={<Placeholder name="Create Bracket" />} />
        <Route path="/bracket/:id" element={<Placeholder name="Pick Flow" />} />
        <Route path="/bracket/:id/view" element={<Placeholder name="Bracket View" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
