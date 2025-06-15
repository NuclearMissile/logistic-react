import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import PopulationCalculator from './PopulationCalculator.jsx'
import BifurcationDiagram from "./BifurcationDiagram.jsx";
import ChemicalOscillator from "./ChemicalOscillator.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <PopulationCalculator/>
        <BifurcationDiagram/>
        <ChemicalOscillator/>
    </StrictMode>,
)
