
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './styles/system-colors.css';

console.log("🚀 Sistema Rei do Óculos: Iniciando bootstrap...");

// O Service Worker será registrado automaticamente pelo vite-plugin-pwa

const mountApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("❌ Erro crítico: Elemento #root não encontrado no DOM.");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    );
    console.log("✅ Sistema renderizado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao renderizar o React:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif;">
        <h1 style="color: #ef4444;">Erro ao Carregar</h1>
        <p>Houve um problema técnico ao iniciar o sistema.</p>
        <code style="background: #f1f1f1; padding: 10px; border-radius: 5px; display: block; margin-top: 20px;">
          ${error instanceof Error ? error.message : String(error)}
        </code>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Tentar Novamente
        </button>
      </div>
    `;
  }
};

// Garante que o DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
