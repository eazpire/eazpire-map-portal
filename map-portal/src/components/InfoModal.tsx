import { useEffect, useRef } from 'react';
import {
  NODE_TYPE_META,
  STATUS_LABEL,
  getConnections,
  getNodeById,
  type EcosystemNode,
} from '../data/ecosystem';

interface InfoModalProps {
  node: EcosystemNode;
  onClose: () => void;
  onSelectRelated: (id: string) => void;
}

export function InfoModal({ node, onClose, onSelectRelated }: InfoModalProps) {
  const meta = NODE_TYPE_META[node.type];
  const { outbound, inbound } = getConnections(node.id);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [node.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[rgba(6,8,10,0.72)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eco-modal-title"
        tabIndex={-1}
        className="eaz-scroll relative z-10 flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--eaz-border-strong)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] outline-none"
        style={{
          background:
            'linear-gradient(165deg, rgba(28,32,40,0.98) 0%, rgba(16,18,22,0.98) 100%)',
        }}
      >
        <div
          className="relative shrink-0 border-b border-[var(--eaz-border)] px-6 pt-5 pb-4"
          style={{
            background: `linear-gradient(160deg, ${meta.soft}, transparent 75%)`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md text-[var(--eaz-text-dim)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--eaz-text)]"
            aria-label="Close dialog"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 pr-8">
            <span
              className="text-[10px] font-medium tracking-[0.16em] uppercase"
              style={{ color: meta.accent }}
            >
              {meta.label}
            </span>
            <span className="text-[10px] text-[var(--eaz-text-dim)]">·</span>
            <span className="text-[10px] text-[var(--eaz-text-muted)]">
              {STATUS_LABEL[node.status]}
            </span>
          </div>
          <h2
            id="eco-modal-title"
            className="font-display mt-2 text-3xl font-semibold tracking-wide text-[var(--eaz-text)]"
          >
            {node.label}
          </h2>
          {node.host && (
            <p className="mt-1 text-sm text-[var(--eaz-text-muted)]">{node.host}</p>
          )}
        </div>

        <div className="eaz-scroll flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="mb-1.5 text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--eaz-text-dim)]">
              Purpose
            </h3>
            <p className="text-sm leading-relaxed text-[var(--eaz-text)]">{node.summary}</p>
          </section>

          {(node.url || node.repoPath) && (
            <section className="space-y-2">
              <h3 className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--eaz-text-dim)]">
                Location
              </h3>
              {node.url && (
                <a
                  href={node.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm transition hover:opacity-80"
                  style={{ color: meta.accent }}
                >
                  {node.url}
                </a>
              )}
              <code className="block rounded border border-[var(--eaz-border)] bg-[var(--eaz-bg)] px-2.5 py-1.5 text-[11px] text-[var(--eaz-text-muted)]">
                {node.repoPath}
              </code>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--eaz-text-dim)]">
              Functions
            </h3>
            <ul className="space-y-1.5">
              {node.functions.map((fn) => (
                <li key={fn} className="flex gap-2 text-sm text-[var(--eaz-text)]">
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                    style={{ background: meta.accent }}
                  />
                  {fn}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--eaz-text-dim)]">
              Key features
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {node.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-[var(--eaz-border)] px-2.5 py-0.5 text-[11px] text-[var(--eaz-text-muted)]"
                >
                  {f}
                </span>
              ))}
            </div>
          </section>

          {node.relatedIdeaIds && node.relatedIdeaIds.length > 0 && (
            <section>
              <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--eaz-text-dim)]">
                Related backlog
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {node.relatedIdeaIds.map((id) => (
                  <span
                    key={id}
                    className="rounded border border-[var(--eaz-border)] bg-[var(--eaz-bg)] px-2 py-0.5 font-mono text-[10px] text-[var(--eaz-gold)]"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--eaz-text-dim)]">
              Connections
            </h3>
            <div className="space-y-3">
              {outbound.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] text-[var(--eaz-text-dim)]">Outbound</p>
                  <ul className="space-y-0.5">
                    {outbound.map((e) => {
                      const target = getNodeById(e.to);
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => onSelectRelated(e.to)}
                            className="group flex w-full items-baseline justify-between gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-[rgba(255,255,255,0.04)]"
                          >
                            <span className="text-[var(--eaz-text)] group-hover:text-[var(--eaz-ember)]">
                              → {target?.label ?? e.to}
                            </span>
                            <span className="shrink-0 text-[10px] text-[var(--eaz-text-dim)]">
                              {e.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {inbound.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] text-[var(--eaz-text-dim)]">Inbound</p>
                  <ul className="space-y-0.5">
                    {inbound.map((e) => {
                      const source = getNodeById(e.from);
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => onSelectRelated(e.from)}
                            className="group flex w-full items-baseline justify-between gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-[rgba(255,255,255,0.04)]"
                          >
                            <span className="text-[var(--eaz-text)] group-hover:text-[var(--eaz-teal)]">
                              ← {source?.label ?? e.from}
                            </span>
                            <span className="shrink-0 text-[10px] text-[var(--eaz-text-dim)]">
                              {e.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {outbound.length === 0 && inbound.length === 0 && (
                <p className="text-sm text-[var(--eaz-text-dim)]">No edges defined.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
