import {
  NODE_TYPE_META,
  type NodeType,
} from '../data/ecosystem';

const TYPES: NodeType[] = ['portal', 'worker', 'app', 'infra', 'external'];

interface LegendFilterProps {
  activeTypes: Set<NodeType>;
  onToggleType: (t: NodeType) => void;
  onSelectAllTypes: () => void;
}

export function LegendFilter({
  activeTypes,
  onToggleType,
  onSelectAllTypes,
}: LegendFilterProps) {
  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1">
      <button
        type="button"
        onClick={onSelectAllTypes}
        className="rounded px-1.5 py-1 text-[9px] tracking-wider uppercase text-[var(--eaz-text-dim)] transition hover:text-[var(--eaz-text-muted)]"
      >
        All
      </button>
      {TYPES.map((t) => {
        const meta = NODE_TYPE_META[t];
        const on = activeTypes.has(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggleType(t)}
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] whitespace-nowrap transition"
            style={{
              borderColor: on ? meta.accent : 'rgba(255,255,255,0.08)',
              background: on ? meta.soft : 'transparent',
              color: on ? meta.accent : 'var(--eaz-text-dim)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: meta.accent, opacity: on ? 1 : 0.4 }}
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
