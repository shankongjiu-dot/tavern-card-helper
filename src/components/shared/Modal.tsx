/** Generic modal wrapper with overlay */
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal content */}
      <div className={`relative w-full ${maxWidth} rounded-xl bg-slate-800 border border-slate-700 shadow-2xl`}>
        {title && (
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl cursor-pointer">×</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
