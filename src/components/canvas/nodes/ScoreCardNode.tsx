import { Handle, type NodeProps } from '@xyflow/react'

import { cn } from '@/lib/utils'
import {
  scoreCardParamsOf,
  TARGET_HANDLE_ID,
  type ScoreRow,
  type WorkflowNode,
} from '@/types/workflow'

import { MidHandles } from './MidHandles'
import {
  nodeStyle,
  sourcePosition,
  targetPosition,
  useNodeInteractionState,
} from './nodeHelpers'

function Row({
  row,
  first,
  muted,
  accent,
  withIcons,
}: {
  row: ScoreRow
  first: boolean
  muted: boolean
  accent?: boolean
  withIcons: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-7 items-center gap-1.5 px-2.5',
        !first && 'border-t border-border/60',
        row.bold && 'font-bold',
        row.bold && accent && 'bg-amber-100 dark:bg-amber-400/25',
        muted && 'text-muted-foreground',
      )}
    >
      {withIcons && (
        <span
          className={cn(
            'w-5 shrink-0 text-center text-[13px] leading-none',
            muted && 'opacity-40 saturate-50',
          )}
        >
          {row.icon ?? ''}
        </span>
      )}
      <span className="truncate text-xs">{row.label}</span>
      <span className="ml-auto pl-2 text-xs tabular-nums">{row.value}</span>
    </div>
  )
}

/**
 * Score card in the style of newspaper results graphics: an optional header
 * strip (e.g. venue + status), one row per entry with glyph/label/value, and
 * bold rows emphasised — when any row is bold the others are muted, and the
 * `accent` param gives bold rows a gold background. An `emblem` emoji (🏆)
 * or a small-caps `caption` can sit above the card. Works for tournament
 * brackets, leaderboards, comparisons — anything with rows and values.
 */
export function ScoreCardNode({ data, selected }: NodeProps<WorkflowNode>) {
  const { direction, presentationMode } = useNodeInteractionState()
  const card = scoreCardParamsOf(data.params)
  const anyBold = card.rows.some((row) => row.bold)
  const withIcons = card.rows.some((row) => row.icon)

  return (
    <div className="w-56">
      {card.caption && (
        <div className="pb-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-foreground/70">
          {card.caption}
        </div>
      )}
      {card.emblem && <div className="pb-1 text-center text-3xl leading-none">{card.emblem}</div>}
      <div
        className={cn(
          'rounded-sm border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
          selected && 'ring-2 ring-ring',
        )}
        style={nodeStyle(data.style)}
      >
        {(card.header || card.tag) && (
          <div className="flex items-baseline justify-between gap-2 border-b bg-muted/50 px-2.5 py-1">
            <span className="truncate text-[10px] font-bold">{card.header}</span>
            {card.tag && (
              <span className="shrink-0 text-[9px] text-muted-foreground">{card.tag}</span>
            )}
          </div>
        )}
        {card.rows.length === 0 && (
          <div className="px-2.5 py-2 text-[10px] text-muted-foreground">
            Add rows in the Behavior tab →
          </div>
        )}
        {card.rows.map((row, index) => (
          <Row
            key={index}
            row={row}
            first={index === 0}
            muted={anyBold && !row.bold}
            accent={card.accent}
            withIcons={withIcons}
          />
        ))}
      </div>
      <Handle
        id={TARGET_HANDLE_ID}
        type="target"
        position={targetPosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <Handle
        type="source"
        position={sourcePosition(direction)}
        className="!size-2.5"
        isConnectable={!presentationMode}
      />
      <MidHandles connectable={!presentationMode} />
    </div>
  )
}
