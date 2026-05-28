import { useRoutes } from 'react-router-dom'
import { routers } from './router'

function App() {
  return <div>{useRoutes(routers)}</div>
}

export default App
