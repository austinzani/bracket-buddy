import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { CreateBracketScreen } from './screens/CreateBracketScreen'
import { PickFlowScreen } from './screens/PickFlowScreen'
import { BracketViewScreen } from './screens/BracketViewScreen'
import { ImportScreen } from './screens/ImportScreen'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/new" element={<CreateBracketScreen />} />
        <Route path="/bracket/:id" element={<PickFlowScreen />} />
        <Route path="/bracket/:id/view" element={<BracketViewScreen />} />
        <Route path="/share" element={<ImportScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
