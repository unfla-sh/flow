import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActiveFlow, useWorkflowStore } from '@/store/workflowStore'
import type { ArrowShape, EdgeCardinality, EdgeKind, WorkflowEdge } from '@/types/workflow'

const SIDES = ['top', 'right', 'bottom', 'left'] as const
const AUTO = '__auto__'
const EDGE_KINDS: { value: EdgeKind; label: string }[] = [
  { value: 'flow', label: 'Process flow' },
  { value: 'reporting', label: 'Reporting line' },
  { value: 'relationship', label: 'Data relationship' },
  { value: 'network', label: 'Network connection' },
  { value: 'data', label: 'Data transfer' },
  { value: 'dependency', label: 'Dependency' },
  { value: 'transition', label: 'State transition' },
  { value: 'association', label: 'UML association' },
]
const ARROW_SHAPES: { value: ArrowShape; label: string }[] = [
  { value: 'triangle', label: 'Filled arrow' },
  { value: 'open-triangle', label: 'Open triangle (inheritance)' },
  { value: 'diamond', label: 'Filled diamond (composition)' },
  { value: 'open-diamond', label: 'Open diamond (aggregation)' },
  { value: 'circle', label: 'Circle' },
]

function ArrowShapeSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: ArrowShape
  onChange: (shape: ArrowShape) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ArrowShape)}>
      <SelectTrigger id={id} aria-label="Arrow shape">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ARROW_SHAPES.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
const CARDINALITIES: { value: EdgeCardinality; label: string }[] = [
  { value: 'one', label: 'Exactly one' },
  { value: 'zero-one', label: 'Zero or one' },
  { value: 'many', label: 'One or many' },
  { value: 'zero-many', label: 'Zero or many' },
]

function nodeCenter(
  node: ReturnType<typeof useActiveFlow>['nodes'][number] | undefined,
): { x: number; y: number } {
  if (!node) return { x: 0, y: 0 }
  const width = node.measured?.width ?? node.width ?? 180
  const height = node.measured?.height ?? node.height ?? 80
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
}

function nextBendPoint(
  source: { x: number; y: number },
  target: { x: number; y: number },
  existingCount: number,
): { x: number; y: number } {
  if (Math.abs(source.x - target.x) < 1 && Math.abs(source.y - target.y) < 1) {
    return { x: source.x + 140, y: source.y - 120 - existingCount * 28 }
  }

  const mid = { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 }
  const dx = target.x - source.x
  const dy = target.y - source.y
  const length = Math.hypot(dx, dy) || 1
  const normal = { x: -dy / length, y: dx / length }
  const direction = existingCount % 2 === 0 ? -1 : 1
  const distance = 110 + Math.floor(existingCount / 2) * 45

  return {
    x: mid.x + normal.x * distance * direction,
    y: mid.y + normal.y * distance * direction,
  }
}

export function EdgeInspector({ edge }: { edge: WorkflowEdge }) {
  const updateEdge = useWorkflowStore((state) => state.updateEdge)
  const toggleEdgeTwoWay = useWorkflowStore((state) => state.toggleEdgeTwoWay)
  const simplifyToTwoWayEdge = useWorkflowStore((state) => state.simplifyToTwoWayEdge)
  const graph = useActiveFlow()
  const route = edge.data?.route
  const style = edge.data?.style ?? {}
  const points = route?.kind === 'manual' ? (route.points ?? []) : []
  const lineWidth = style.lineWidth ?? 1.75
  const arrowSize = style.arrowSize ?? 10

  const setPoint = (index: number, partial: { x?: number; y?: number }) => {
    const next = points.map((point, i) => (i === index ? { ...point, ...partial } : point))
    updateEdge(edge.id, { data: { route: { kind: 'manual', points: next } } })
  }

  const removePoint = (index: number) => {
    const next = points.filter((_, i) => i !== index)
    updateEdge(edge.id, {
      data: { route: next.length ? { kind: 'manual', points: next } : { kind: 'auto' } },
    })
  }

  const addBendPoint = () => {
    const source = nodeCenter(graph.nodes.find((node) => node.id === edge.source))
    const target = nodeCenter(graph.nodes.find((node) => node.id === edge.target))
    const point = nextBendPoint(source, target, points.length)
    updateEdge(edge.id, {
      data: { route: { kind: 'manual', points: [...points, point] } },
    })
  }

  return (
    <Tabs defaultValue="general">
      <TabsList className="w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="route">Route</TabsTrigger>
        <TabsTrigger value="style">Style</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label htmlFor="edge-label">Label</Label>
          <Input
            id="edge-label"
            value={typeof edge.label === 'string' ? edge.label : ''}
            onChange={(event) => updateEdge(edge.id, { label: event.target.value })}
            placeholder="e.g. submitted"
          />
        </div>
        {typeof edge.label === 'string' && edge.label && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edge-label-along">Label position along the arrow</Label>
              <span className="text-[10px] text-muted-foreground">
                {Math.round((edge.data?.labelPosition?.along ?? 0.5) * 100)}%
              </span>
            </div>
            <input
              id="edge-label-along"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round((edge.data?.labelPosition?.along ?? 0.5) * 100)}
              onChange={(event) =>
                updateEdge(edge.id, {
                  data: {
                    labelPosition: {
                      ...edge.data?.labelPosition,
                      along: Number(event.target.value) / 100,
                    },
                  },
                })
              }
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Or drag the label on the canvas to nudge it.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                disabled={!edge.data?.labelPosition}
                onClick={() => updateEdge(edge.id, { data: { labelPosition: undefined } })}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Connection type</Label>
          <Select
            value={edge.data?.kind ?? 'flow'}
            onValueChange={(kind) => updateEdge(edge.id, { data: { kind: kind as EdgeKind } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDGE_KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(edge.data?.kind === 'network' || edge.data?.kind === 'data') && (
          <div className="space-y-1.5">
            <Label htmlFor="edge-protocol">Protocol / format</Label>
            <Input
              id="edge-protocol"
              value={edge.data?.protocol ?? ''}
              onChange={(event) => updateEdge(edge.id, { data: { protocol: event.target.value } })}
              placeholder="HTTPS :443, SQL :5432, JSON"
            />
          </div>
        )}
        {edge.data?.kind === 'relationship' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Source cardinality</Label>
              <Select
                value={edge.data?.sourceCardinality ?? 'one'}
                onValueChange={(value) =>
                  updateEdge(edge.id, {
                    data: { sourceCardinality: value as EdgeCardinality },
                  })
                }
              >
                <SelectTrigger aria-label="Source cardinality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARDINALITIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target cardinality</Label>
              <Select
                value={edge.data?.targetCardinality ?? 'many'}
                onValueChange={(value) =>
                  updateEdge(edge.id, {
                    data: { targetCardinality: value as EdgeCardinality },
                  })
                }
              >
                <SelectTrigger aria-label="Target cardinality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARDINALITIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="edge-condition">Condition expression</Label>
          <Input
            id="edge-condition"
            value={edge.data?.condition ?? ''}
            onChange={(event) => updateEdge(edge.id, { data: { condition: event.target.value } })}
            placeholder="e.g. status == 'approved'"
            className="font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Evaluated during simulation (later phase) to decide whether this path is taken.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edge-animated">Animated</Label>
          <Switch
            id="edge-animated"
            checked={edge.animated ?? false}
            onCheckedChange={(checked) => updateEdge(edge.id, { animated: checked })}
          />
        </div>
      </TabsContent>
      <TabsContent value="route" className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label>Endpoints</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={edge.sourceHandle ?? AUTO}
              onValueChange={(v) =>
                updateEdge(edge.id, { sourceHandle: v === AUTO ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO}>From: auto</SelectItem>
                {SIDES.map((s) => (
                  <SelectItem key={s} value={s}>
                    From: {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={edge.targetHandle ?? AUTO}
              onValueChange={(v) =>
                updateEdge(edge.id, { targetHandle: v === AUTO ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO}>To: auto</SelectItem>
                {SIDES.map((s) => (
                  <SelectItem key={s} value={s}>
                    To: {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Attach the edge to a node's side (e.g. From: bottom · To: top for a vertical link). Pair
            with start + end arrows on the Style tab for a two-way connection.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edge-step">Right-angle route</Label>
          <Switch
            id="edge-step"
            checked={style.pathType === 'step'}
            onCheckedChange={(checked) =>
              updateEdge(edge.id, { data: { style: { ...style, pathType: checked ? 'step' : 'bezier' } } })
            }
          />
        </div>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          {route?.kind === 'manual'
            ? `${points.length} manual bend point${points.length === 1 ? '' : 's'}`
            : style.pathType === 'step'
              ? 'Automatic right-angle (step) route'
              : 'Automatic curved route'}
          <p className="mt-1 text-[10px]">
            On the canvas: select the edge, then drag the small handle on the line (or
            double-click the line) to add a bend. Drag a numbered bend to move it (it snaps to
            straight lines; hold Alt to place freely) and double-click it to remove it. Drag
            either arrow end onto another node to re-attach it.
          </p>
        </div>
        {points.length > 0 && (
          <div className="space-y-1.5">
            <Label>Bend points</Label>
            {points.map((point, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-1.5">
                <span className="w-4 text-center text-[10px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <Input
                  type="number"
                  aria-label={`Bend point ${index + 1} x`}
                  value={Math.round(point.x)}
                  onChange={(event) => setPoint(index, { x: Number(event.target.value) || 0 })}
                  className="h-7 px-2 text-[11px]"
                />
                <Input
                  type="number"
                  aria-label={`Bend point ${index + 1} y`}
                  value={Math.round(point.y)}
                  onChange={(event) => setPoint(index, { y: Number(event.target.value) || 0 })}
                  className="h-7 px-2 text-[11px]"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  aria-label={`Remove bend point ${index + 1}`}
                  onClick={() => removePoint(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={addBendPoint}>
          Add bend point
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => simplifyToTwoWayEdge(edge.id)}
        >
          Simplify to two-way edge
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => updateEdge(edge.id, { data: { route: { kind: 'auto' } } })}
        >
          Reset route
        </Button>
      </TabsContent>
      <TabsContent value="style" className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label>Line style</Label>
          <Select
            value={style.lineStyle ?? 'solid'}
            onValueChange={(lineStyle) =>
              updateEdge(edge.id, {
                data: {
                  style: {
                    ...style,
                    lineStyle: lineStyle as 'solid' | 'dashed' | 'dotted',
                  },
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edge-twoway">Two-way arrow (⇄)</Label>
          <Switch
            id="edge-twoway"
            checked={style.arrow === true && style.arrowStart === true}
            onCheckedChange={() => toggleEdgeTwoWay(edge.id)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edge-bidirectional">Split arrows</Label>
          <Switch
            id="edge-bidirectional"
            checked={style.bidirectional === true}
            onCheckedChange={(checked) =>
              updateEdge(edge.id, {
                data: {
                  style: {
                    ...style,
                    bidirectional: checked,
                    ...(checked ? { arrowStart: false, arrow: false } : {}),
                  },
                },
              })
            }
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Visual-only arrows from the edge midpoint.
        </p>
        <div className="flex items-center justify-between">
          <Label htmlFor="edge-arrow-start">Start arrow</Label>
          <Switch
            id="edge-arrow-start"
            checked={style.arrowStart === true}
            disabled={style.bidirectional === true}
            onCheckedChange={(checked) =>
              updateEdge(edge.id, {
                data: { style: { ...style, arrowStart: checked, bidirectional: false } },
              })
            }
          />
        </div>
        {style.arrowStart === true && !style.bidirectional && (
          <ArrowShapeSelect
            id="edge-arrow-start-shape"
            value={style.arrowStartShape ?? 'triangle'}
            onChange={(arrowStartShape) =>
              updateEdge(edge.id, { data: { style: { ...style, arrowStartShape } } })
            }
          />
        )}
        <div className="flex items-center justify-between">
          <Label htmlFor="edge-arrow">End arrow</Label>
          <Switch
            id="edge-arrow"
            checked={style.arrow === true}
            disabled={style.bidirectional === true}
            onCheckedChange={(checked) =>
              updateEdge(edge.id, {
                data: { style: { ...style, arrow: checked, bidirectional: false } },
              })
            }
          />
        </div>
        {style.arrow === true && !style.bidirectional && (
          <ArrowShapeSelect
            id="edge-arrow-shape"
            value={style.arrowShape ?? 'triangle'}
            onChange={(arrowShape) =>
              updateEdge(edge.id, { data: { style: { ...style, arrowShape } } })
            }
          />
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            updateEdge(edge.id, {
              data: { style: { ...style, bidirectional: true, arrowStart: false, arrow: false } },
            })
          }
        >
          Use split arrows
        </Button>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="edge-stroke">Line color</Label>
            <Input
              id="edge-stroke"
              value={style.stroke ?? ''}
              onChange={(event) =>
                updateEdge(edge.id, {
                  data: { style: { ...style, stroke: event.target.value || undefined } },
                })
              }
              placeholder="#64748b"
            />
          </div>
          <Input
            type="color"
            aria-label="Pick line color"
            value={style.stroke ?? '#64748b'}
            onChange={(event) =>
              updateEdge(edge.id, { data: { style: { ...style, stroke: event.target.value } } })
            }
            className="h-8 w-10 p-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="edge-line-width">Line width</Label>
            <Input
              id="edge-line-width"
              type="number"
              min={1}
              max={8}
              step={0.25}
              value={lineWidth}
              onChange={(event) =>
                updateEdge(edge.id, {
                  data: {
                    style: { ...style, lineWidth: Number(event.target.value) || undefined },
                  },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edge-arrow-size">Arrow size</Label>
            <Input
              id="edge-arrow-size"
              type="number"
              min={6}
              max={28}
              step={1}
              value={arrowSize}
              onChange={(event) =>
                updateEdge(edge.id, {
                  data: {
                    style: { ...style, arrowSize: Number(event.target.value) || undefined },
                  },
                })
              }
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
