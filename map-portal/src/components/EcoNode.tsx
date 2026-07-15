import type { Node, NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import {
  NODE_TYPE_META,
  STATUS_LABEL,
  type EcosystemNode,
  type NodeStatus,
} from '../data/ecosystem';

export type EcoFlowNode = Node<
  {
    eco: EcosystemNode;
    selected: boolean;
    dimmed: boolean;
  },
  'eco'
>;

const STATUS_DOT: Record<NodeStatus, string> = {
  live: '#6aab7a',
  beta: '#b89a5e',
  wip: '#c4845a',
  planned: '#6b6760',
};

export function EcoNode({ data }: NodeProps<EcoFlowNode>) {
  const { eco, selected, dimmed } = data;
  const meta = NODE_TYPE_META[eco.type];

  return (
    <div
      className="relative min-w-[168px] max-w-[200px] rounded-lg border px-3 py-2.5 transition-all duration-300"
      style={{
        background: selected
          ? `linear-gradient(145deg, ${meta.soft}, rgba(20,23,28,0.95))`
          : 'rgba(20, 23, 28, 0.92)',
        borderColor: selected ? meta.accent : 'rgba(255,255,255,0.08)',
        boxShadow: selected
          ? `0 0 0 1px ${meta.accent}55, 0 0 28px ${meta.soft}`
          : '0 4px 20px rgba(0,0,0,0.35)',
        opacity: dimmed ? 0.22 : 1,
        filter: dimmed ? 'grayscale(0.4)' : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0"
        style={{ background: meta.accent }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0"
        style={{ background: meta.accent }}
      />

      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className="text-[9px] font-medium tracking-[0.14em] uppercase"
          style={{ color: meta.accent }}
        >
          {meta.label}
        </span>
        <span className="flex items-center gap-1 text-[9px] text-[var(--eaz-text-dim)]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: STATUS_DOT[eco.status] }}
          />
          {STATUS_LABEL[eco.status]}
        </span>
      </div>

      <div className="font-display text-[15px] leading-tight font-semibold tracking-wide text-[var(--eaz-text)]">
        {eco.label}
      </div>

      {eco.host && (
        <div className="mt-1 truncate text-[10px] text-[var(--eaz-text-muted)]">{eco.host}</div>
      )}
    </div>
  );
}
