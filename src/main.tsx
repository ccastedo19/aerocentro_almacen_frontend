import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from "./components/theme-provider";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </Toaster>
    </ThemeProvider>
  </StrictMode>,
)
