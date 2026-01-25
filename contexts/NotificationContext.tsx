import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
    };

    setNotifications((prev) => [...prev, notification]);

    // Remover automaticamente após a duração especificada
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const showSuccess = useCallback(
    (title: string, message?: string, duration?: number) => {
      showNotification('success', title, message, duration);
    },
    [showNotification]
  );

  const showError = useCallback(
    (title: string, message?: string, duration?: number) => {
      showNotification('error', title, message, duration || 7000); // Erros ficam mais tempo
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string, duration?: number) => {
      showNotification('warning', title, message, duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string, duration?: number) => {
      showNotification('info', title, message, duration);
    },
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const { type, title, message } = notification;

  const config = {
    success: {
      icon: <CheckCircle2 size={20} className="text-emerald-600" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      titleColor: 'text-emerald-900',
      messageColor: 'text-emerald-700',
    },
    error: {
      icon: <XCircle size={20} style={{ color: 'var(--store-color)' }} />,
      bgColor: 'bg-[var(--store-color-light)]',
      borderColor: 'border-[var(--store-color-opacity-20)]',
      iconBg: 'bg-[var(--store-color-lighter)]',
      titleColor: 'text-[var(--store-color-darker)]',
      messageColor: 'text-[var(--store-color-dark)]',
    },
    warning: {
      icon: <AlertCircle size={20} className="text-amber-600" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100',
      titleColor: 'text-amber-900',
      messageColor: 'text-amber-700',
    },
    info: {
      icon: <Info size={20} className="text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
    },
  };

  const style = config[type];

  return (
    <div
      className={`
        ${style.bgColor} ${style.borderColor}
        border rounded-xl shadow-lg p-4
        animate-in slide-in-from-right-4 fade-in duration-300
        pointer-events-auto
        flex items-start gap-3
      `}
    >
      <div className={`${style.iconBg} rounded-lg p-2 shrink-0`}>
        {style.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-sm ${style.titleColor} mb-0.5`}>
          {title}
        </h4>
        {message && (
          <p className={`text-xs ${style.messageColor} leading-relaxed`}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className={`
          shrink-0 p-1 rounded-lg transition-colors
          ${style.messageColor} hover:bg-white/50
        `}
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }
  return context;
};
