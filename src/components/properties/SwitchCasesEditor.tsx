import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkflowStore } from '@/store/workflowStore'
import type { SwitchCase, WorkflowNode } from '@/types/workflow'

export function SwitchCasesEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const updateSwitchCases = useWorkflowStore((state) => state.updateSwitchCases)

  const cases = node.data.cases ?? []

  const updateCase = (id: string, partial: Partial<SwitchCase>) => {
    updateSwitchCases(
      node.id,
      cases.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="switch-expression">Switch on (expression)</Label>
        <Input
          id="switch-expression"
          value={(node.data.params.expression as string | undefined) ?? ''}
          onChange={(event) =>
            updateNodeData(node.id, {
              params: { ...node.data.params, expression: event.target.value },
            })
          }
          placeholder="e.g. status"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Cases (when …)</Label>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add case"
            onClick={() =>
              updateSwitchCases(node.id, [...cases, { id: crypto.randomUUID(), when: '' }])
            }
          >
            <PlusIcon />
          </Button>
        </div>
        {cases.length === 0 && (
          <p className="text-[10px] text-muted-foreground">
            No cases — only the default branch fires.
          </p>
        )}
        <div className="space-y-1.5">
          {cases.map((branch, index) => (
            <div key={branch.id} className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[10px] text-muted-foreground">
                case {index + 1}
              </span>
              <Input
                value={branch.when}
                onChange={(event) => updateCase(branch.id, { when: event.target.value })}
                placeholder="value or expression"
                className="font-mono"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove case"
                onClick={() =>
                  updateSwitchCases(node.id, cases.filter((c) => c.id !== branch.id))
                }
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Each case has its own output handle on the node, plus a <em>default</em> output at the
        bottom. Removing a case also removes edges connected to it.
      </p>
    </div>
  )
}
