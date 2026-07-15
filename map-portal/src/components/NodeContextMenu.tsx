import { useEffect, useRef } from 'react';

export interface ContextMenuAction {
  id: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

interface NodeContextMenuProps {
  x: number;
  y: number;
  title?: string;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function NodeContextMenu({
  x,
  y,
  title,
  actions,
  onClose,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > innerWidth - 8) left = Math.max(8, innerWidth - rect.width - 8);
    if (top + rect.height > innerHeight - 8) top = Math.max(8, innerHeight - rect.height - 8);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y, actions.length]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-[var(--eaz-border-strong)] bg-[rgba(20,23,28,0.96)] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {title && (
        <div className="border-b border-[var(--eaz-border)] px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase text-[var(--eaz-text-dim)]">
          {title}
        </div>
      )}
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          disabled={action.disabled}
          className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[var(--eaz-text)] transition hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-40"
          style={
            action.danger
              ? { color: 'var(--eaz-ember)' }
              : undefined
          }
          onClick={() => {
            if (action.disabled) return;
            action.onSelect();
            onClose();
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
