import ReactDOM from 'react-dom/client'
import { App } from './app/index.tsx'
import './main.css'

// fonts
import './fonts/DejaVuSansMono.ttf'
import './fonts/DejaVuSansMono-Bold.ttf'
import './fonts/DejaVuSansMono-Oblique.ttf'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
