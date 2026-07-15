import { useCallback, useState } from 'react';
import { type NodeType, getNodeById } from './data/ecosystem';
import { EcosystemMap } from './components/EcosystemMap';
import { InfoModal } from './components/InfoModal';
import { LegendFilter } from './components/LegendFilter';

const ALL_TYPES: NodeType[] = ['portal', 'worker', 'app', 'infra', 'external'];

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<NodeType>>(
    () => new Set(ALL_TYPES),
  );

  const selected = selectedId ? getNodeById(selectedId) ?? null : null;

  const onToggleType = useCallback((t: NodeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size === 1) return prev;
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }, []);

  const onSelectAllTypes = useCallback(() => {
    setActiveTypes(new Set(ALL_TYPES));
  }, []);

  const onSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-[var(--eaz-border)] bg-[rgba(13,15,18,0.88)] px-4 backdrop-blur-md">
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-wide text-[var(--eaz-text)]">
            eazpire
          </span>
          <span className="hidden text-[10px] tracking-[0.14em] uppercase text-[var(--eaz-text-dim)] sm:inline">
            Ecosystem
          </span>
        </div>

        <div className="mx-auto w-full max-w-sm flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-[var(--eaz-border)] bg-[var(--eaz-bg-elevated)] px-3 py-1.5 text-sm text-[var(--eaz-text)] placeholder:text-[var(--eaz-text-dim)] outline-none transition focus:border-[var(--eaz-border-strong)] focus:ring-1 focus:ring-[rgba(196,132,90,0.25)]"
          />
        </div>

        <LegendFilter
          activeTypes={activeTypes}
          onToggleType={onToggleType}
          onSelectAllTypes={onSelectAllTypes}
        />

        <a
          href="/auth/logout"
          className="shrink-0 rounded-md border border-[var(--eaz-border)] px-2.5 py-1 text-[10px] tracking-wider uppercase text-[var(--eaz-text-dim)] transition hover:border-[var(--eaz-border-strong)] hover:text-[var(--eaz-text-muted)]"
        >
          Sign out
        </a>
      </header>

      <main className="relative min-h-0 flex-1">
        <EcosystemMap
          selectedId={selectedId}
          onSelect={onSelect}
          activeTypes={activeTypes}
          search={search}
        />
      </main>

      {selected && (
        <InfoModal
          node={selected}
          onClose={() => setSelectedId(null)}
          onSelectRelated={setSelectedId}
        />
      )}
    </div>
  );
}
