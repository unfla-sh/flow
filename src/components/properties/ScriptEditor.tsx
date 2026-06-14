import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useWorkflowStore } from '@/store/workflowStore'
import type { ScriptArg, WorkflowNode } from '@/types/workflow'

export function ScriptEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)

  const args = (node.data.params.args as ScriptArg[] | undefined) ?? []

  const setArgs = (next: ScriptArg[]) => {
    updateNodeData(node.id, { params: { ...node.data.params, args: next } })
  }

  const updateArg = (id: string, partial: Partial<ScriptArg>) => {
    setArgs(args.map((arg) => (arg.id === id ? { ...arg, ...partial } : arg)))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="script-path">Script path</Label>
        <Input
          id="script-path"
          value={node.data.scriptPath ?? ''}
          onChange={(event) => updateNodeData(node.id, { scriptPath: event.target.value })}
          placeholder="1.py"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Arguments</Label>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add argument"
            onClick={() =>
              setArgs([...args, { id: crypto.randomUUID(), key: '', value: '' }])
            }
          >
            <PlusIcon />
          </Button>
        </div>
        {args.length === 0 && (
          <p className="text-[10px] text-muted-foreground">No arguments configured.</p>
        )}
        <div className="space-y-1.5">
          {args.map((arg) => (
            <div key={arg.id} className="flex items-center gap-1.5">
              <Input
                value={arg.key}
                onChange={(event) => updateArg(arg.id, { key: event.target.value })}
                placeholder="key"
                className="font-mono"
              />
              <Input
                value={arg.value}
                onChange={(event) => updateArg(arg.id, { value: event.target.value })}
                placeholder="value"
                className="font-mono"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove argument"
                onClick={() => setArgs(args.filter((a) => a.id !== arg.id))}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="script-snippet">Code snippet</Label>
        <Textarea
          id="script-snippet"
          value={node.data.scriptSnippet ?? ''}
          onChange={(event) => updateNodeData(node.id, { scriptSnippet: event.target.value })}
          placeholder={'# optional inline snippet\nprint("hello")'}
          className="min-h-32 font-mono text-xs"
          spellCheck={false}
        />
        <p className="text-[10px] text-muted-foreground">
          Plain editor for now — Monaco is a planned upgrade.
        </p>
      </div>
    </div>
  )
}
