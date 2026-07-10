import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { useWorkflowStore } from '@/store/workflowStore'
import type {
  NodeAttribute,
  RecordField,
  RecordFieldKey,
  WorkflowNode,
} from '@/types/workflow'

function AttributeEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const attributes = node.data.attributes ?? []
  const update = (next: NodeAttribute[]) => updateNodeData(node.id, { attributes: next })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Metadata rows</Label>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Add metadata row"
          onClick={() =>
            update([...attributes, { id: crypto.randomUUID(), label: 'Label', value: '' }])
          }
        >
          <PlusIcon />
        </Button>
      </div>
      {attributes.map((attribute, index) => (
        <div key={attribute.id} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] gap-1.5">
          <Input
            aria-label={`Metadata ${index + 1} label`}
            value={attribute.label}
            placeholder="Label"
            onChange={(event) =>
              update(
                attributes.map((item) =>
                  item.id === attribute.id ? { ...item, label: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            aria-label={`Metadata ${index + 1} value`}
            value={attribute.value}
            placeholder="Value"
            onChange={(event) =>
              update(
                attributes.map((item) =>
                  item.id === attribute.id ? { ...item, value: event.target.value } : item,
                ),
              )
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove metadata row ${index + 1}`}
            onClick={() => update(attributes.filter((item) => item.id !== attribute.id))}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      {attributes.length === 0 && (
        <div className="border-y py-3 text-center text-[10px] text-muted-foreground">
          No metadata rows
        </div>
      )}
    </div>
  )
}

function ParamInput({
  node,
  param,
  label,
  placeholder,
}: {
  node: WorkflowNode
  param: string
  label: string
  placeholder?: string
}) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${node.id}-${param}`}>{label}</Label>
      <Input
        id={`${node.id}-${param}`}
        value={String(node.data.params[param] ?? '')}
        placeholder={placeholder}
        onChange={(event) =>
          updateNodeData(node.id, {
            params: { ...node.data.params, [param]: event.target.value },
          })
        }
      />
    </div>
  )
}

export function ProfileEditor({ node }: { node: WorkflowNode }) {
  return (
    <div className="space-y-4">
      <ParamInput node={node} param="title" label="Role title" placeholder="e.g. Engineering Director" />
      <ParamInput node={node} param="department" label="Department" placeholder="e.g. Engineering" />
      <ParamInput node={node} param="status" label="Status" placeholder="Active, Vacant, On leave" />
      <ParamInput node={node} param="avatarUrl" label="Avatar URL" placeholder="https://..." />
      <AttributeEditor node={node} />
    </div>
  )
}

export function ResourceEditor({ node }: { node: WorkflowNode }) {
  return (
    <div className="space-y-4">
      <ParamInput node={node} param="resourceType" label="Resource type" placeholder="e.g. Web Server" />
      <ParamInput node={node} param="environment" label="Environment" placeholder="Production, Staging" />
      <ParamInput node={node} param="status" label="Status" placeholder="Healthy, Degraded" />
      <AttributeEditor node={node} />
    </div>
  )
}

const KEY_OPTIONS: { value: RecordFieldKey; label: string }[] = [
  { value: 'none', label: 'No key' },
  { value: 'primary', label: 'Primary key' },
  { value: 'foreign', label: 'Foreign key' },
  { value: 'unique', label: 'Unique' },
]

export function RecordEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const fields = node.data.fields ?? []
  const update = (next: RecordField[]) => updateNodeData(node.id, { fields: next })
  const setField = (id: string, partial: Partial<RecordField>) =>
    update(fields.map((field) => (field.id === id ? { ...field, ...partial } : field)))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <ParamInput node={node} param="namespace" label="Namespace" placeholder="public" />
        <ParamInput node={node} param="recordKind" label="Record kind" placeholder="Table" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fields</Label>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add field"
            onClick={() =>
              update([
                ...fields,
                {
                  id: crypto.randomUUID(),
                  name: `field_${fields.length + 1}`,
                  dataType: 'text',
                  key: 'none',
                },
              ])
            }
          >
            <PlusIcon />
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2 border-t pt-2 first:border-t-0 first:pt-0">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-1.5">
              <Input
                aria-label={`Field ${index + 1} name`}
                value={field.name}
                placeholder="field_name"
                className="font-mono"
                onChange={(event) => setField(field.id, { name: event.target.value })}
              />
              <Input
                aria-label={`Field ${index + 1} data type`}
                value={field.dataType}
                placeholder="text"
                className="font-mono"
                onChange={(event) => setField(field.id, { dataType: event.target.value })}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove field ${index + 1}`}
                onClick={() => update(fields.filter((item) => item.id !== field.id))}
              >
                <Trash2Icon />
              </Button>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <Select
                value={field.key ?? 'none'}
                onValueChange={(value) => setField(field.id, { key: value as RecordFieldKey })}
              >
                <SelectTrigger aria-label={`Field ${index + 1} key type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label htmlFor={`${field.id}-nullable`}>Nullable</Label>
                <Switch
                  id={`${field.id}-nullable`}
                  checked={field.nullable ?? false}
                  onCheckedChange={(nullable) => setField(field.id, { nullable })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
