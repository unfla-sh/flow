import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowNode } from '@/types/workflow'

function stringify(value: unknown): string {
  if (value === undefined) return ''
  return JSON.stringify(value, null, 2)
}

export function JsonOutputEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)

  const [text, setText] = useState(() => stringify(node.data.simulatedOutput))
  const [error, setError] = useState<string | null>(null)

  const commit = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError(null)
      updateNodeData(node.id, { simulatedOutput: undefined })
      return
    }
    try {
      const parsed: unknown = JSON.parse(trimmed)
      setError(null)
      updateNodeData(node.id, { simulatedOutput: parsed })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  const format = () => {
    try {
      const parsed: unknown = JSON.parse(text)
      setText(stringify(parsed))
      setError(null)
    } catch {
      // leave the text as-is; the error from commit already explains it
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="sim-output">Simulated output (JSON)</Label>
          <Button variant="ghost" size="sm" onClick={format}>
            Format
          </Button>
        </div>
        <Textarea
          id="sim-output"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          placeholder='{ "status": 200, "data": [] }'
          className={cn('min-h-36 font-mono text-xs', error && 'border-destructive')}
          spellCheck={false}
        />
        {error ? (
          <p className="text-[10px] text-destructive">{error}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Sample data shown when simulating this node. Applied on blur.
          </p>
        )}
      </div>

      {node.data.simulatedOutput !== undefined && (
        <div className="space-y-1.5">
          <Label>Preview</Label>
          <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-[10px] leading-relaxed">
            {stringify(node.data.simulatedOutput)}
          </pre>
        </div>
      )}
    </div>
  )
}
