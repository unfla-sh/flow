import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useWorkflowStore } from '@/store/workflowStore'
import {
  scoreCardParamsOf,
  type ScoreCardParams,
  type ScoreRow,
  type WorkflowNode,
} from '@/types/workflow'

/**
 * Behavior-tab editor for a score-card node: header strip (header + tag),
 * caption and emblem above the card, any number of rows (icon / label /
 * value / bold), and the gold-accent toggle for bold rows.
 */
export function ScoreCardEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const card = scoreCardParamsOf(node.data.params)

  const setCard = (partial: Partial<ScoreCardParams>) => {
    updateNodeData(node.id, { params: { ...node.data.params, ...partial } })
  }

  const setRow = (index: number, partial: Partial<ScoreRow>) => {
    setCard({ rows: card.rows.map((row, i) => (i === index ? { ...row, ...partial } : row)) })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="card-header">Header</Label>
          <Input
            id="card-header"
            value={card.header ?? ''}
            onChange={(event) => setCard({ header: event.target.value || undefined })}
            placeholder="e.g. venue, category"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-tag">Tag</Label>
          <Input
            id="card-tag"
            value={card.tag ?? ''}
            onChange={(event) => setCard({ tag: event.target.value || undefined })}
            placeholder="e.g. Full time"
          />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_4rem] gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="card-caption">Caption above card</Label>
          <Input
            id="card-caption"
            value={card.caption ?? ''}
            onChange={(event) => setCard({ caption: event.target.value || undefined })}
            placeholder="e.g. 3RD-PLACE"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-emblem">Emblem</Label>
          <Input
            id="card-emblem"
            value={card.emblem ?? ''}
            onChange={(event) => setCard({ emblem: event.target.value || undefined })}
            placeholder="🏆"
            className="px-1 text-center"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Rows</Label>
        {card.rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-[2.5rem_1fr_2.5rem_auto_auto] items-center gap-1.5"
          >
            <Input
              aria-label={`Row ${index + 1} icon`}
              value={row.icon ?? ''}
              onChange={(event) => setRow(index, { icon: event.target.value || undefined })}
              placeholder="🏳️"
              className="px-1 text-center"
            />
            <Input
              aria-label={`Row ${index + 1} label`}
              value={row.label}
              onChange={(event) => setRow(index, { label: event.target.value })}
            />
            <Input
              aria-label={`Row ${index + 1} value`}
              value={row.value ?? ''}
              onChange={(event) => setRow(index, { value: event.target.value || undefined })}
              className="px-1 text-center tabular-nums"
            />
            <div className="flex items-center gap-1" title="Bold this row (mutes the others)">
              <Checkbox
                aria-label={`Row ${index + 1} bold`}
                checked={!!row.bold}
                onCheckedChange={(checked) =>
                  setRow(index, { bold: checked === true || undefined })
                }
              />
              <span className="text-[10px] text-muted-foreground">B</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Remove row ${index + 1}`}
              onClick={() => setCard({ rows: card.rows.filter((_, i) => i !== index) })}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setCard({ rows: [...card.rows, { label: `Entry ${card.rows.length + 1}` }] })}
        >
          <Plus className="size-3.5" /> Add row
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Icon · label · value · <b>B</b>old. Bold rows are emphasised; the rest are muted.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <Label htmlFor="card-accent">Gold accent</Label>
          <p className="text-[10px] text-muted-foreground">Bold rows get a gold background.</p>
        </div>
        <Switch
          id="card-accent"
          checked={!!card.accent}
          onCheckedChange={(checked) => setCard({ accent: checked || undefined })}
        />
      </div>
    </div>
  )
}
