import { useCallback, useEffect, useMemo, type MouseEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import {
  ECOSYSTEM_EDGES,
  ECOSYSTEM_NODES,
  NODE_TYPE_META,
  type EcosystemNode,
  type NodeType,
} from '../data/ecosystem';
import { EcoNode, type EcoFlowNode } from './EcoNode';

const nodeTypes: NodeTypes = {
  eco: EcoNode,
};

function buildNodes(
  all: EcosystemNode[],
  selectedId: string | null,
  visibleIds: Set<string>,
): EcoFlowNode[] {
  return all.map((eco) => ({
    id: eco.id,
    type: 'eco',
    position: eco.position,
    data: {
      eco,
      selected: selectedId === eco.id,
      dimmed: !visibleIds.has(eco.id),
    },
    selectable: visibleIds.has(eco.id),
  }));
}

function buildEdges(visibleIds: Set<string>, selectedId: string | null): Edge[] {
  return ECOSYSTEM_EDGES.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to),
  ).map((e) => {
    const related =
      selectedId != null && (e.from === selectedId || e.to === selectedId);
    const typeAccent =
      NODE_TYPE_META[ECOSYSTEM_NODES.find((n) => n.id === e.from)?.type ?? 'worker']
        .accent;

    return {
      id: e.id,
      source: e.from,
      target: e.to,
      label: e.label,
      animated: related,
      style: {
        stroke: related ? typeAccent : 'rgba(255,255,255,0.12)',
        strokeWidth: related ? 2 : 1,
        opacity: selectedId && !related ? 0.2 : 0.85,
      },
      labelStyle: {
        fill: related ? '#c4bfb6' : '#6b6760',
        fontSize: 10,
      },
      labelBgStyle: { fill: '#14171c', fillOpacity: 0.9 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
    };
  });
}

interface EcosystemMapProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeTypes: Set<NodeType>;
  search: string;
}

export function EcosystemMap({
  selectedId,
  onSelect,
  activeTypes,
  search,
}: EcosystemMapProps) {
  const visibleIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ids = new Set<string>();
    for (const n of ECOSYSTEM_NODES) {
      if (!activeTypes.has(n.type)) continue;
      if (q) {
        const hay = `${n.label} ${n.host ?? ''} ${n.summary} ${n.repoPath}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      ids.add(n.id);
    }
    return ids;
  }, [activeTypes, search]);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildNodes(ECOSYSTEM_NODES, selectedId, visibleIds),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(visibleIds, selectedId),
  );

  useEffect(() => {
    setNodes(buildNodes(ECOSYSTEM_NODES, selectedId, visibleIds));
    setEdges(buildEdges(visibleIds, selectedId));
  }, [selectedId, visibleIds, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: MouseEvent, node: EcoFlowNode) => {
      if (!visibleIds.has(node.id)) return;
      onSelect(node.id);
    },
    [onSelect, visibleIds],
  );

  const onPaneClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.25}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const eco = (n.data as EcoFlowNode['data'] | undefined)?.eco;
            if (!eco) return '#444';
            return NODE_TYPE_META[eco.type].accent;
          }}
          maskColor="rgba(10,12,15,0.75)"
        />
      </ReactFlow>
    </div>
  );
}
