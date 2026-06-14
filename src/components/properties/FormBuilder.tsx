import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import DatePicker from 'react-datepicker'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useWorkflowStore } from '@/store/workflowStore'
import {
  FIELD_TYPE_LABELS,
  type FieldType,
  type FormField,
  type WorkflowNode,
} from '@/types/workflow'

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[]
const OPTION_FIELD_TYPES: FieldType[] = ['select', 'multiselect']

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function OptionsEditor({
  field,
  onChange,
}: {
  field: FormField
  onChange: (options: string[]) => void
}) {
  const [text, setText] = useState((field.options ?? []).join('\n'))

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`options-${field.id}`}>Options (one per line)</Label>
      <Textarea
        id={`options-${field.id}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() =>
          onChange(
            text
              .split('\n')
              .map((option) => option.trim())
              .filter(Boolean),
          )
        }
        placeholder={'Option A\nOption B'}
        className="min-h-16 text-xs"
      />
    </div>
  )
}

function DefaultValueEditor({
  field,
  onChange,
}: {
  field: FormField
  onChange: (defaultValue: unknown) => void
}) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
          onChange={(event) => onChange(event.target.value || undefined)}
          placeholder="Default text"
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          value={typeof field.defaultValue === 'number' ? field.defaultValue : ''}
          onChange={(event) =>
            onChange(event.target.value === '' ? undefined : Number(event.target.value))
          }
          placeholder="0"
        />
      )
    case 'checkbox':
      return (
        <div className="flex h-8 items-center">
          <Checkbox
            checked={field.defaultValue === true}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
        </div>
      )
    case 'date':
      return (
        <DatePicker
          selected={parseDate(field.defaultValue)}
          onChange={(date: Date | null) => onChange(date ? date.toISOString() : undefined)}
          customInput={<Input />}
          placeholderText="Pick a date"
          portalId="datepicker-portal"
          isClearable
          dateFormat="yyyy-MM-dd"
        />
      )
    case 'daterange': {
      const [start, end] = Array.isArray(field.defaultValue) ? field.defaultValue : []
      return (
        <DatePicker
          selectsRange
          startDate={parseDate(start)}
          endDate={parseDate(end)}
          onChange={([startDate, endDate]) =>
            onChange(
              startDate || endDate
                ? [startDate?.toISOString() ?? null, endDate?.toISOString() ?? null]
                : undefined,
            )
          }
          customInput={<Input />}
          placeholderText="Pick a range"
          portalId="datepicker-portal"
          isClearable
          dateFormat="yyyy-MM-dd"
        />
      )
    }
    case 'select':
      return (
        <Select
          value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
          onValueChange={(value) => onChange(value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No default" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'multiselect': {
      const selected = Array.isArray(field.defaultValue)
        ? (field.defaultValue as string[])
        : []
      return (
        <div className="space-y-1">
          {(field.options ?? []).length === 0 && (
            <p className="text-[10px] text-muted-foreground">Add options first.</p>
          )}
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={(checked) => {
                  const next =
                    checked === true
                      ? [...selected, option]
                      : selected.filter((item) => item !== option)
                  onChange(next.length > 0 ? next : undefined)
                }}
              />
              {option}
            </label>
          ))}
        </div>
      )
    }
  }
}

function FieldCard({
  field,
  index,
  total,
  onUpdate,
  onMove,
  onDelete,
}: {
  field: FormField
  index: number
  total: number
  onUpdate: (partial: Partial<FormField>) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-2.5 rounded-md border p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Field {index + 1}
        </span>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDownIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete field" onClick={onDelete}>
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`label-${field.id}`}>Label</Label>
        <Input
          id={`label-${field.id}`}
          value={field.label}
          onChange={(event) => onUpdate({ label: event.target.value })}
        />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>Type</Label>
          <Select
            value={field.type}
            onValueChange={(value) => {
              const type = value as FieldType
              onUpdate({
                type,
                defaultValue: undefined,
                options: OPTION_FIELD_TYPES.includes(type) ? (field.options ?? []) : undefined,
              })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {FIELD_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex h-8 items-center gap-1.5 text-xs">
          <Checkbox
            checked={field.required ?? false}
            onCheckedChange={(checked) => onUpdate({ required: checked === true })}
          />
          Required
        </label>
      </div>

      {OPTION_FIELD_TYPES.includes(field.type) && (
        <OptionsEditor
          key={field.type}
          field={field}
          onChange={(options) => onUpdate({ options })}
        />
      )}

      <div className="space-y-1.5">
        <Label>Default value</Label>
        <DefaultValueEditor field={field} onChange={(defaultValue) => onUpdate({ defaultValue })} />
      </div>
    </div>
  )
}

export function FormBuilder({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)

  const fields = node.data.formSchema ?? []

  const setFields = (next: FormField[]) => {
    updateNodeData(node.id, { formSchema: next })
  }

  const moveField = (index: number, direction: -1 | 1) => {
    const next = [...fields]
    const [moved] = next.splice(index, 1)
    next.splice(index + direction, 0, moved)
    setFields(next)
  }

  return (
    <div className="space-y-2.5">
      {fields.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          No fields yet — add one to start building the form.
        </p>
      )}
      {fields.map((field, index) => (
        <FieldCard
          key={field.id}
          field={field}
          index={index}
          total={fields.length}
          onUpdate={(partial) =>
            setFields(fields.map((f) => (f.id === field.id ? { ...f, ...partial } : f)))
          }
          onMove={(direction) => moveField(index, direction)}
          onDelete={() => setFields(fields.filter((f) => f.id !== field.id))}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          setFields([
            ...fields,
            {
              id: crypto.randomUUID(),
              label: `Field ${fields.length + 1}`,
              type: 'text',
            },
          ])
        }
      >
        <PlusIcon /> Add field
      </Button>
    </div>
  )
}
