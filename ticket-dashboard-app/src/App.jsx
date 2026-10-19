import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'

function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' Component={Home}/>
          <Route path='/home' Component={Home}/>
          <Route path='/projects' Component={Project}/>
          <Route path='/skills' Component={SkillsPage}/>
          <Route path='/about' Component={AboutPage}/>
          <Route path='/badges' Component={Badges}/>

          <Route
            path="/*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
