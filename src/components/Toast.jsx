import { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Warning, XCircle, Info, X } from '@phosphor-icons/react';

const ICONS = { success: CheckCircle, warning: Warning, error: XCircle, info: Info };
const COLORS = {
  success: 'border-green-500/30 bg-green-500/5 text-green-400',
  warning: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
  error:   'border-red-500/30 bg-red-500/5 text-red-400',
  info:    'border-white/10 bg-white/5 text-white/60',
};

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) =>
    setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(({ id, msg, type }) => {
            const Icon = ICONS[type] ?? Info;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl pointer-events-auto silicon-glass ${COLORS[type]}`}
              >
                <Icon size={20} weight="fill" />
                <p className="font-black text-xs uppercase tracking-widest text-white/80">{msg}</p>
                <button onClick={() => dismiss(id)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
export default ToastProvider;
