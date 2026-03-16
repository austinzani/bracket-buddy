import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { CreateBracketScreen } from './screens/CreateBracketScreen'
import { PickFlowScreen } from './screens/PickFlowScreen'
import { BracketViewScreen } from './screens/BracketViewScreen'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/new" element={<CreateBracketScreen />} />
        <Route path="/bracket/:id" element={<PickFlowScreen />} />
        <Route path="/bracket/:id/view" element={<BracketViewScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
