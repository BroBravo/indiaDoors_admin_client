import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from "./context/userContext.jsx";
import './index.css';
import App from './App.jsx';

// BASE_URL comes from vite.config.js -> env.VITE_BASE
// Remove trailing slash so BrowserRouter basename is clean
const basename = import.meta.env.VITE_BASE.replace(/\/$/, '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
)

