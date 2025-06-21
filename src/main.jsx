import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import PopulationCalculator from './components/PopulationCalculator.jsx'
import BifurcationDiagram from "./components/BifurcationDiagram.jsx";
import ChemicalOscillator from "./components/ChemicalOscillator.jsx";
import LorenzAttractor from "./components/LorenzAttractor.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <PopulationCalculator/>
        <BifurcationDiagram/>
        <ChemicalOscillator/>
        <LorenzAttractor/>
    </StrictMode>,
)
