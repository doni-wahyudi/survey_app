import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuth } from './store/useAuth.ts'

function Root() {
  const initializeAuth = useAuth(state => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
