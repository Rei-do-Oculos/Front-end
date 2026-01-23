import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => void) | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // Verificar atualizações
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Nova versão disponível
                    setUpdateServiceWorker(() => () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      setShowPrompt(false);
                    });
                    setShowPrompt(true);
                  }
                });
              }
            });

            // Verificar atualizações periodicamente
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // A cada hora
          }
        } catch (error) {
          console.error('Erro ao verificar atualizações do PWA:', error);
        }
      };

      checkForUpdates();
    }
  }, []);

  const handleUpdate = () => {
    if (updateServiceWorker) {
      updateServiceWorker();
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-red-200 p-6 max-w-md mx-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900 mb-1">Nova Versão Disponível!</h3>
            <p className="text-sm text-slate-600 mb-4">
              Uma nova versão do sistema está disponível. Atualize para ter acesso às últimas melhorias.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Atualizar Agora
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
