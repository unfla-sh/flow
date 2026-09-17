import type {
  DiagramKind,
  EdgeCardinality,
  EdgeKind,
  EdgeStyle,
  WorkflowEdgeData,
  WorkflowSettings,
} from '@/types/workflow'

export interface DiagramKit {
  id: DiagramKind
  label: string
  description: string
}

export const diagramKits: DiagramKit[] = [
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Processes, decisions, forms, scripts, and nested flows.',
  },
  {
    id: 'organization',
    label: 'Organisation',
    description: 'People, teams, departments, and reporting lines.',
  },
  {
    id: 'database',
    label: 'Database ER',
    description: 'Tables, fields, keys, and cardinality-aware relationships.',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Networks, firewalls, load balancers, services, and data stores.',
  },
  {
    id: 'image-generation',
    label: 'Image generation',
    description: 'Prompts, models, samplers, image processing, and outputs.',
  },
  {
    id: 'state',
    label: 'State machine',
    description: 'States, transitions with guards, choice points, and composite states.',
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Kanban columns with WIP limits, work items, story maps, and release slices.',
  },
  {
    id: 'uml',
    label: 'UML class',
    description: 'Classes, interfaces, enums with attributes and operations; inheritance and composition.',
  },
  {
    id: 'general',
    label: 'General diagram',
    description: 'Mixed cards, resources, records, annotations, and connections.',
  },
]

export const ALL_DIAGRAM_KINDS = diagramKits.map((kit) => kit.id)

export function diagramKindOf(settings: WorkflowSettings): DiagramKind {
  return settings.diagramKind ?? 'workflow'
}

export function getDiagramKit(id: DiagramKind): DiagramKit {
  return diagramKits.find((kit) => kit.id === id) ?? diagramKits[0]
}

export interface KitEdgeDefaults extends WorkflowEdgeData {
  kind: EdgeKind
  style: EdgeStyle
  sourceCardinality?: EdgeCardinality
  targetCardinality?: EdgeCardinality
}

export function edgeDefaultsForKit(kind: DiagramKind): KitEdgeDefaults {
  if (kind === 'organization') {
    return { kind: 'reporting', style: { arrow: false, pathType: 'step' } }
  }
  if (kind === 'database') {
    return {
      kind: 'relationship',
      style: { arrow: false, pathType: 'step' },
      sourceCardinality: 'one',
      targetCardinality: 'many',
    }
  }
  if (kind === 'infrastructure') {
    return { kind: 'network', style: { arrow: true, pathType: 'step' } }
  }
  if (kind === 'image-generation') {
    return { kind: 'data', style: { arrow: true } }
  }
  if (kind === 'state') {
    return { kind: 'transition', style: { arrow: true } }
  }
  if (kind === 'planning') {
    return { kind: 'dependency', style: { arrow: true, pathType: 'step', lineStyle: 'dashed' } }
  }
  if (kind === 'uml') {
    return { kind: 'association', style: { arrow: false, pathType: 'step' } }
  }
  return { kind: 'flow', style: { arrow: true } }
}
