import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Aboutus from './pages/Aboutus'
import Notfound from './pages/NotFound'

function App() {

  return (
   <Routes>
      <Route path='/' element = { <Home/>} />
      <Route path='/about' element = { <Aboutus/>} />
      <Route path='*' element = { <Notfound/>} />
      

   </Routes>
  )
}

export default App
