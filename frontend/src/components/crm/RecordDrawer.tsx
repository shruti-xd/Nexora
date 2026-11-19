import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X } from 'lucide-react';

interface RecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  title: string;
  subtitle?: string;
  ownerName?: string;
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEdit?: () => void;
  children: ReactNode;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  isOpen,
  onClose,
  label,
  title,
  subtitle,
  ownerName,
  tabs,
  activeTab,
  onTabChange,
  onEdit,
  children,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end bg-surface-950/15" style={{ top: 0, right: 0, bottom: 0, left: 0, height: '100vh' }}>
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-surface-200 flex flex-col overflow-hidden">
        <div className="px-5 py-5 bg-surface-900 text-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/30 text-brand-100 border border-brand-400/30">
                {label}
              </span>
              {ownerName && <span className="text-xs text-surface-300">Owner: {ownerName}</span>}
            </div>
            <h2 className="text-lg font-bold mt-1.5">{title}</h2>
            {subtitle && <p className="text-xs text-surface-300 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button type="button" onClick={onEdit} className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200" title={`Edit ${label.toLowerCase()}`}>
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="px-5 pt-3 border-b border-surface-200 flex items-center gap-6 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};
