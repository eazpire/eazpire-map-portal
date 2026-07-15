import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
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
  getConnectedNodeIds,
  getNodeById,
  type EcosystemNode,
  type NodeType,
} from '../data/ecosystem';
import { EcoNode, type EcoFlowNode } from './EcoNode';
import { NodeContextMenu, type ContextMenuAction } from './NodeContextMenu';

const nodeTypes: NodeTypes = {
  eco: EcoNode,
};

function buildNodes(
  all: EcosystemNode[],
  focusNodeId: string | null,
  detailNodeId: string | null,
  visibleIds: Set<string>,
): EcoFlowNode[] {
  return all.map((eco) => ({
    id: eco.id,
    type: 'eco',
    position: eco.position,
    data: {
      eco,
      selected: focusNodeId === eco.id || detailNodeId === eco.id,
      dimmed: !visibleIds.has(eco.id),
    },
    selectable: visibleIds.has(eco.id),
  }));
}

function buildEdges(
  visibleIds: Set<string>,
  focusNodeId: string | null,
  detailNodeId: string | null,
): Edge[] {
  const highlightId = focusNodeId ?? detailNodeId;
  const focusMode = focusNodeId != null;

  return ECOSYSTEM_EDGES.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to),
  ).map((e) => {
    const related =
      highlightId != null && (e.from === highlightId || e.to === highlightId);
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
        strokeWidth: related ? (focusMode ? 2.75 : 2) : 1,
        opacity: highlightId && !related ? (focusMode ? 0.12 : 0.2) : focusMode && related ? 1 : 0.85,
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
  focusNodeId: string | null;
  detailNodeId: string | null;
  onNodeActivate: (id: string) => void;
  onClearFocus: () => void;
  activeTypes: Set<NodeType>;
  search: string;
}

interface MenuState {
  x: number;
  y: number;
  nodeId: string;
}

export function EcosystemMap({
  focusNodeId,
  detailNodeId,
  onNodeActivate,
  onClearFocus,
  activeTypes,
  search,
}: EcosystemMapProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  const baseVisibleIds = useMemo(() => {
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

  // Only Connections: show focus hub + inbound/outbound neighbors (overrides type/search).
  const visibleIds = useMemo(() => {
    if (!focusNodeId) return baseVisibleIds;
    return getConnectedNodeIds(focusNodeId);
  }, [baseVisibleIds, focusNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildNodes(ECOSYSTEM_NODES, focusNodeId, detailNodeId, visibleIds),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(visibleIds, focusNodeId, detailNodeId),
  );

  useEffect(() => {
    setNodes(buildNodes(ECOSYSTEM_NODES, focusNodeId, detailNodeId, visibleIds));
    setEdges(buildEdges(visibleIds, focusNodeId, detailNodeId));
  }, [focusNodeId, detailNodeId, visibleIds, setNodes, setEdges]);

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const onNodeClick = useCallback(
    (_: MouseEvent, node: EcoFlowNode) => {
      // Dimmed / out-of-focus nodes are not selectable — only visible related nodes.
      if (!visibleIds.has(node.id)) return;
      closeMenu();
      onNodeActivate(node.id);
    },
    [onNodeActivate, visibleIds, closeMenu],
  );

  const onNodeContextMenu = useCallback((event: MouseEvent, node: EcoFlowNode) => {
    event.preventDefault();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    closeMenu();
    onClearFocus();
  }, [closeMenu, onClearFocus]);

  // Extensible right-click actions. Only Connections is owned by left-click.
  const menuActions: ContextMenuAction[] = useMemo(() => {
    if (!menu) return [];
    return [
      {
        id: 'show-all',
        label: 'Show all',
        disabled: !focusNodeId,
        onSelect: () => onClearFocus(),
      },
      {
        id: 'coming-soon-details',
        label: 'Open details…',
        disabled: true,
        onSelect: () => {},
      },
      {
        id: 'coming-soon-more',
        label: 'More actions…',
        disabled: true,
        onSelect: () => {},
      },
    ];
  }, [menu, focusNodeId, onClearFocus]);

  const menuTitle = menu
    ? getNodeById(menu.nodeId)?.label ?? menu.nodeId
    : undefined;

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onPaneContextMenu={(e) => {
          e.preventDefault();
          closeMenu();
        }}
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

      {focusNodeId && (
        <button
          type="button"
          onClick={onClearFocus}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border border-[var(--eaz-border-strong)] bg-[rgba(20,23,28,0.92)] px-3 py-1.5 text-[11px] tracking-wider uppercase text-[var(--eaz-text-muted)] shadow-lg backdrop-blur-md transition hover:border-[var(--eaz-ember)] hover:text-[var(--eaz-text)]"
        >
          Show all
          <span className="ml-1.5 text-[var(--eaz-text-dim)]">
            · {getNodeById(focusNodeId)?.label ?? 'focus'}
          </span>
        </button>
      )}

      {menu && (
        <NodeContextMenu
          x={menu.x}
          y={menu.y}
          title={menuTitle}
          actions={menuActions}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}
