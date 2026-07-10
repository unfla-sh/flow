import type { WorkflowDoc, WorkflowEdge, WorkflowNode } from '@/types/workflow'

import type { WorkflowTemplate } from './types'

function profile(
  id: string,
  x: number,
  y: number,
  label: string,
  title: string,
  department: string,
): WorkflowNode {
  return {
    id,
    type: 'profile',
    position: { x, y },
    data: {
      label,
      nodeType: 'profile',
      definitionId: 'org.person',
      params: { title, department, status: 'Active' },
      attributes: [],
      icon: 'user',
    },
  }
}

function record(
  id: string,
  x: number,
  y: number,
  label: string,
  fields: NonNullable<WorkflowNode['data']['fields']>,
): WorkflowNode {
  return {
    id,
    type: 'record',
    position: { x, y },
    data: {
      label,
      nodeType: 'record',
      definitionId: 'database.table',
      params: { recordKind: 'Table', namespace: 'public' },
      fields,
      icon: 'table',
    },
  }
}

function resource(
  id: string,
  x: number,
  y: number,
  definitionId: string,
  label: string,
  resourceType: string,
  icon: string,
  attributes: NonNullable<WorkflowNode['data']['attributes']> = [],
): WorkflowNode {
  return {
    id,
    type: 'resource',
    position: { x, y },
    data: {
      label,
      nodeType: 'resource',
      definitionId,
      params: { resourceType, environment: 'Production', status: 'Healthy' },
      attributes,
      icon,
    },
  }
}

const organization: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Organisation Chart',
    version: '1.0.0',
    diagramKind: 'organization',
    description: 'Reporting structure with solid and dotted-line relationships.',
  },
  flows: {
    root: {
      settings: { direction: 'tb' },
      nodes: [
        profile('ceo', 430, 40, 'Alex Morgan', 'Chief Executive Officer', 'Executive'),
        profile('cto', 120, 260, 'Jordan Lee', 'Chief Technology Officer', 'Technology'),
        profile('coo', 430, 260, 'Taylor Chen', 'Chief Operating Officer', 'Operations'),
        profile('cfo', 740, 260, 'Sam Rivera', 'Chief Financial Officer', 'Finance'),
        profile('eng', 20, 500, 'Casey Wong', 'Engineering Director', 'Technology'),
        profile('platform', 310, 500, 'Riley Singh', 'Platform Lead', 'Technology'),
        {
          id: 'vacant',
          type: 'profile',
          position: { x: 680, y: 500 },
          data: {
            label: 'Vacant role',
            nodeType: 'profile',
            definitionId: 'org.vacant-role',
            params: { title: 'Finance Systems Manager', department: 'Finance', status: 'Vacant' },
            attributes: [],
            icon: 'user',
            style: { borderStyle: 'dashed', fillColor: '#f8fafc' },
          },
        },
      ],
      edges: [
        ...[
          ['org-1', 'ceo', 'cto'],
          ['org-2', 'ceo', 'coo'],
          ['org-3', 'ceo', 'cfo'],
          ['org-4', 'cto', 'eng'],
          ['org-5', 'cto', 'platform'],
          ['org-6', 'cfo', 'vacant'],
        ].map(([id, source, target]) => ({
          id,
          source,
          target,
          type: 'workflow',
          data: { kind: 'reporting' as const, style: { arrow: false, pathType: 'step' as const } },
        })),
        {
          id: 'org-dotted',
          source: 'coo',
          target: 'platform',
          label: 'Operational partner',
          type: 'workflow',
          data: {
            kind: 'reporting',
            style: { arrow: false, pathType: 'step', lineStyle: 'dotted' },
          },
        },
      ],
    },
  },
}

const database: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Commerce Database ER',
    version: '1.0.0',
    diagramKind: 'database',
    description: 'Commerce entities with keys and cardinality-aware relationships.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        record('customers', 20, 80, 'customers', [
          { id: 'customers-id', name: 'id', dataType: 'uuid', key: 'primary' },
          { id: 'customers-email', name: 'email', dataType: 'varchar(255)', key: 'unique' },
          { id: 'customers-name', name: 'name', dataType: 'varchar(120)' },
        ]),
        record('orders', 390, 60, 'orders', [
          { id: 'orders-id', name: 'id', dataType: 'uuid', key: 'primary' },
          { id: 'orders-customer', name: 'customer_id', dataType: 'uuid', key: 'foreign' },
          { id: 'orders-status', name: 'status', dataType: 'varchar(32)' },
          { id: 'orders-total', name: 'total', dataType: 'decimal(12,2)' },
        ]),
        record('order-items', 760, 40, 'order_items', [
          { id: 'items-id', name: 'id', dataType: 'uuid', key: 'primary' },
          { id: 'items-order', name: 'order_id', dataType: 'uuid', key: 'foreign' },
          { id: 'items-product', name: 'product_id', dataType: 'uuid', key: 'foreign' },
          { id: 'items-quantity', name: 'quantity', dataType: 'integer' },
        ]),
        record('products', 390, 330, 'products', [
          { id: 'products-id', name: 'id', dataType: 'uuid', key: 'primary' },
          { id: 'products-sku', name: 'sku', dataType: 'varchar(64)', key: 'unique' },
          { id: 'products-name', name: 'name', dataType: 'varchar(160)' },
          { id: 'products-price', name: 'price', dataType: 'decimal(12,2)' },
        ]),
      ],
      edges: [
        {
          id: 'er-customer-orders',
          source: 'customers',
          target: 'orders',
          sourceHandle: 'field:customers-id:right',
          targetHandle: 'field:orders-customer:left',
          label: 'places',
          type: 'workflow',
          data: {
            kind: 'relationship',
            sourceCardinality: 'one',
            targetCardinality: 'zero-many',
            style: { pathType: 'step' },
          },
        },
        {
          id: 'er-orders-items',
          source: 'orders',
          target: 'order-items',
          sourceHandle: 'field:orders-id:right',
          targetHandle: 'field:items-order:left',
          label: 'contains',
          type: 'workflow',
          data: {
            kind: 'relationship',
            sourceCardinality: 'one',
            targetCardinality: 'one',
            style: { pathType: 'step' },
          },
        },
        {
          id: 'er-products-items',
          source: 'products',
          target: 'order-items',
          sourceHandle: 'field:products-id:right',
          targetHandle: 'field:items-product:left',
          label: 'referenced by',
          type: 'workflow',
          data: {
            kind: 'relationship',
            sourceCardinality: 'one',
            targetCardinality: 'zero-many',
            style: { pathType: 'step' },
          },
        },
      ],
    },
  },
}

const infrastructureEdges: WorkflowEdge[] = [
  ['net-1', 'internet', 'firewall', 'HTTPS :443'],
  ['net-2', 'firewall', 'load-balancer', 'HTTPS :443'],
  ['net-3', 'load-balancer', 'web-1', 'HTTP :8080'],
  ['net-4', 'load-balancer', 'web-2', 'HTTP :8080'],
  ['net-5', 'web-1', 'app', 'gRPC :50051'],
  ['net-6', 'web-2', 'app', 'gRPC :50051'],
  ['net-7', 'app', 'database', 'SQL :5432'],
  ['net-8', 'app', 'cache', 'RESP :6379'],
].map(([id, source, target, protocol]) => ({
  id,
  source,
  target,
  type: 'workflow',
  data: { kind: 'network', protocol, style: { arrow: true, pathType: 'step' } },
}))

const infrastructure: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Web Platform Architecture',
    version: '1.0.0',
    diagramKind: 'infrastructure',
    description: 'Firewall, load balancing, web tier, application tier, database, and cache.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        resource('internet', 20, 220, 'infra.web-server', 'Public Clients', 'Internet', 'globe'),
        resource('firewall', 280, 220, 'infra.firewall', 'Edge Firewall', 'Firewall', 'lock', [
          { id: 'fw-policy', label: 'Policy', value: 'HTTPS only' },
        ]),
        resource('load-balancer', 540, 220, 'infra.load-balancer', 'Load Balancer', 'Load Balancer', 'network'),
        resource('web-1', 820, 100, 'infra.web-server', 'Web 01', 'Web Server', 'server', [
          { id: 'web1-host', label: 'Host', value: 'web-01' },
        ]),
        resource('web-2', 820, 340, 'infra.web-server', 'Web 02', 'Web Server', 'server', [
          { id: 'web2-host', label: 'Host', value: 'web-02' },
        ]),
        resource('app', 1100, 220, 'infra.app-server', 'Application API', 'Application Server', 'cpu'),
        resource('database', 1380, 100, 'infra.database-server', 'Primary Database', 'Database', 'database', [
          { id: 'db-engine', label: 'Engine', value: 'PostgreSQL' },
        ]),
        resource('cache', 1380, 340, 'infra.cache', 'Shared Cache', 'Cache', 'zap', [
          { id: 'cache-engine', label: 'Engine', value: 'Redis' },
        ]),
      ],
      edges: infrastructureEdges,
    },
  },
}

const imageGeneration: WorkflowDoc = {
  schemaVersion: 1,
  settings: {
    name: 'Image Generation Pipeline',
    version: '1.0.0',
    diagramKind: 'image-generation',
    description: 'Prompt, model, sampler, enhancement, review, and output stages.',
  },
  flows: {
    root: {
      settings: { direction: 'lr' },
      nodes: [
        {
          id: 'prompt',
          type: 'data',
          position: { x: 20, y: 180 },
          data: {
            label: 'Product prompt',
            description: 'Text conditioning for the image model',
            nodeType: 'data',
            definitionId: 'image.prompt',
            params: {
              prompt: 'Studio product photograph on a clean background, softbox lighting, accurate materials',
              negativePrompt: 'blur, distortion, text, watermark',
            },
            icon: 'sparkles',
          },
        },
        resource('model', 300, 180, 'image.model', 'Image Model', 'Model', 'brain', [
          { id: 'model-name', label: 'Model', value: 'Production checkpoint' },
        ]),
        resource('sampler', 580, 180, 'image.sampler', 'Sampler', 'Sampler', 'settings', [
          { id: 'sampler-steps', label: 'Steps', value: '30' },
          { id: 'sampler-seed', label: 'Seed', value: 'Random' },
          { id: 'sampler-size', label: 'Size', value: '1024x1024' },
        ]),
        resource('upscale', 860, 180, 'image.upscaler', 'Upscale and sharpen', 'Upscaler', 'image', [
          { id: 'upscale-scale', label: 'Scale', value: '2x' },
        ]),
        {
          id: 'output',
          type: 'media',
          position: { x: 1140, y: 150 },
          data: {
            label: 'Approved output',
            nodeType: 'media',
            definitionId: 'media',
            params: { kind: 'image', url: '' },
            icon: 'image',
          },
        },
      ],
      edges: [
        ['image-1', 'prompt', 'model', 'text'],
        ['image-2', 'model', 'sampler', 'latent'],
        ['image-3', 'sampler', 'upscale', 'image'],
        ['image-4', 'upscale', 'output', 'PNG'],
      ].map(([id, source, target, protocol]) => ({
        id,
        source,
        target,
        type: 'workflow',
        data: { kind: 'data', protocol, style: { arrow: true } },
      })),
    },
  },
}

export const scenarioKitTemplates: WorkflowTemplate[] = [
  {
    id: 'kit-organization',
    name: 'Organisation · Reporting Structure',
    description: organization.settings.description ?? '',
    doc: organization,
  },
  {
    id: 'kit-database-er',
    name: 'Database ER · Commerce',
    description: database.settings.description ?? '',
    doc: database,
  },
  {
    id: 'kit-infrastructure',
    name: 'Infrastructure · Web Platform',
    description: infrastructure.settings.description ?? '',
    doc: infrastructure,
  },
  {
    id: 'kit-image-generation',
    name: 'Image Generation · Product Pipeline',
    description: imageGeneration.settings.description ?? '',
    doc: imageGeneration,
  },
]
