import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Aboutus from './pages/Aboutus'

function App() {

  return (
   <Routes>
      <Route path='/' element = { <Home/>} />
      <Route path='/about' element = { <Aboutus/>} />

   </Routes>
  )
}

export default App
