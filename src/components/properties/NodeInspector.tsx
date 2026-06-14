import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { NODE_CATEGORIES, nodeCatalog } from '@/data/nodeCatalog'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowNode } from '@/types/workflow'

import { FormBuilder } from './FormBuilder'
import { IconPicker } from './IconPicker'
import { JsonOutputEditor } from './JsonOutputEditor'
import { ScriptEditor } from './ScriptEditor'
import { SwitchCasesEditor } from './SwitchCasesEditor'

const generalSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  description: z.string(),
})

type GeneralValues = z.infer<typeof generalSchema>

function GeneralTab({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const replaceNodeType = useWorkflowStore((state) => state.replaceNodeType)

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema),
    mode: 'onChange',
    defaultValues: {
      label: node.data.label,
      description: node.data.description ?? '',
    },
  })

  const syncToStore = useDebouncedCallback((values: GeneralValues) => {
    updateNodeData(node.id, {
      label: values.label,
      description: values.description || undefined,
    })
  })

  useEffect(() => {
    const subscription = watch((values) => {
      const parsed = generalSchema.safeParse(values)
      if (parsed.success) syncToStore(parsed.data)
    })
    return () => subscription.unsubscribe()
  }, [watch, syncToStore])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="node-label">Label</Label>
        <Input id="node-label" {...register('label')} aria-invalid={!!errors.label} />
        {errors.label && <p className="text-[10px] text-destructive">{errors.label.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="node-description">Description</Label>
        <Textarea
          id="node-description"
          {...register('description')}
          placeholder="What does this node do?"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={nodeCatalog.find((e) => e.nodeType === node.data.nodeType)?.id ?? ''}
          onValueChange={(catalogId) => replaceNodeType(node.id, catalogId)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NODE_CATEGORIES.map((category, index) => {
              const entries = nodeCatalog.filter((e) => e.category === category)
              if (entries.length === 0) return null
              return (
                <SelectGroup key={category}>
                  {index > 0 && <SelectSeparator />}
                  <SelectLabel>{category}</SelectLabel>
                  {entries.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            })}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          Changing the type keeps the label and connections but resets type-specific params.
        </p>
      </div>
      <IconPicker
        value={node.data.icon}
        fallbackName={node.data.nodeType}
        iconBg={node.data.style?.iconBg}
        onChange={(icon) => updateNodeData(node.id, { icon })}
        onIconBgChange={(iconBg) =>
          updateNodeData(node.id, { style: { ...node.data.style, iconBg } })
        }
      />
    </div>
  )
}

function StyleTab({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const style = node.data.style ?? {}

  const updateStyle = (partial: NonNullable<WorkflowNode['data']['style']>) => {
    updateNodeData(node.id, { style: { ...style, ...partial } })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="node-border-color">Border color</Label>
          <Input
            id="node-border-color"
            value={style.borderColor ?? ''}
            onChange={(event) => updateStyle({ borderColor: event.target.value || undefined })}
            placeholder="#94a3b8"
          />
        </div>
        <Input
          type="color"
          aria-label="Pick border color"
          value={style.borderColor ?? '#94a3b8'}
          onChange={(event) => updateStyle({ borderColor: event.target.value })}
          className="h-8 w-10 p-1"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Border style</Label>
        <Select
          value={style.borderStyle ?? (node.data.nodeType === 'frame' ? 'dashed' : 'solid')}
          onValueChange={(value) =>
            updateStyle({ borderStyle: value as 'solid' | 'dashed' | 'dotted' })
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
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="node-fill-color">Fill color</Label>
          <Input
            id="node-fill-color"
            value={style.fillColor ?? ''}
            onChange={(event) => updateStyle({ fillColor: event.target.value || undefined })}
            placeholder="#ffffff"
          />
        </div>
        <Input
          type="color"
          aria-label="Pick fill color"
          value={style.fillColor ?? '#ffffff'}
          onChange={(event) => updateStyle({ fillColor: event.target.value })}
          className="h-8 w-10 p-1"
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="node-text-color">Text color</Label>
          <Input
            id="node-text-color"
            value={style.textColor ?? ''}
            onChange={(event) => updateStyle({ textColor: event.target.value || undefined })}
            placeholder="#0f172a"
          />
        </div>
        <Input
          type="color"
          aria-label="Pick text color"
          value={style.textColor ?? '#0f172a'}
          onChange={(event) => updateStyle({ textColor: event.target.value })}
          className="h-8 w-10 p-1"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => updateNodeData(node.id, { style: undefined })}
      >
        Reset style
      </Button>
    </div>
  )
}

function ExpressionTab({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const expression = (node.data.params.expression as string) ?? ''

  return (
    <div className="space-y-1.5">
      <Label htmlFor="node-expression">Expression</Label>
      <Input
        id="node-expression"
        value={expression}
        onChange={(event) =>
          updateNodeData(node.id, {
            params: { ...node.data.params, expression: event.target.value },
          })
        }
        placeholder="e.g. status == 'approved'"
        className="font-mono"
      />
    </div>
  )
}

function SubFlowTab({ node }: { node: WorkflowNode }) {
  const openSubFlow = useWorkflowStore((state) => state.openSubFlow)
  const stats = useWorkflowStore((state) => {
    const graph = node.data.subFlowId ? state.doc.flows[node.data.subFlowId] : undefined
    return `${graph?.nodes.length ?? 0} nodes · ${graph?.edges.length ?? 0} edges`
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
        <span className="text-[11px] text-muted-foreground">Inner flow</span>
        <Badge variant="secondary">{stats}</Badge>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => openSubFlow(node.id)}>
        Edit inner flow
      </Button>
      <p className="text-[10px] text-muted-foreground">
        You can also double-click the node on the canvas. Use the breadcrumbs in the toolbar to
        navigate back up.
      </p>
    </div>
  )
}

function NoteTab({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const text = (node.data.params.text as string) ?? ''

  return (
    <div className="space-y-1.5">
      <Label htmlFor="note-text">Note text</Label>
      <Textarea
        id="note-text"
        value={text}
        onChange={(event) =>
          updateNodeData(node.id, { params: { ...node.data.params, text: event.target.value } })
        }
        placeholder="Write your annotation here…"
        className="min-h-32"
      />
    </div>
  )
}

function MediaTab({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const url = (node.data.params.url as string) ?? ''
  const kind = (node.data.params.kind as string) ?? 'image'

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="media-url">URL</Label>
        <Input
          id="media-url"
          value={url}
          onChange={(event) =>
            updateNodeData(node.id, { params: { ...node.data.params, url: event.target.value } })
          }
          placeholder="https://…"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Kind</Label>
        <Select
          value={kind}
          onValueChange={(value) =>
            updateNodeData(node.id, { params: { ...node.data.params, kind: value } })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function BehaviorTab({ node }: { node: WorkflowNode }) {
  if (node.data.nodeType === 'form') return <FormBuilder node={node} />
  if (node.data.nodeType === 'script') return <ScriptEditor node={node} />
  if (node.data.nodeType === 'subflow') return <SubFlowTab node={node} />
  if (node.data.nodeType === 'switch') return <SwitchCasesEditor node={node} />
  if (node.data.nodeType === 'condition' || node.data.nodeType === 'decision') {
    return <ExpressionTab node={node} />
  }
  if (node.data.nodeType === 'note') return <NoteTab node={node} />
  if (node.data.nodeType === 'media') return <MediaTab node={node} />

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
      This node has no extra behavior settings.
    </div>
  )
}

export function NodeInspector({ node }: { node: WorkflowNode }) {
  return (
    <Tabs defaultValue="general">
      <TabsList className="w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="style">Style</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
        <TabsTrigger value="data">Data</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="pt-2">
        <GeneralTab node={node} />
      </TabsContent>
      <TabsContent value="style" className="pt-2">
        <StyleTab node={node} />
      </TabsContent>
      <TabsContent value="behavior" className="pt-2">
        <BehaviorTab node={node} />
      </TabsContent>
      <TabsContent value="data" className="pt-2">
        <JsonOutputEditor node={node} />
      </TabsContent>
    </Tabs>
  )
}
