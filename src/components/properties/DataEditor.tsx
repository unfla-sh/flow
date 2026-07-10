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
import type { WorkflowNode } from '@/types/workflow'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function updateParams(
  node: WorkflowNode,
  partial: Record<string, unknown>,
  updateNodeData: (id: string, partial: Partial<WorkflowNode['data']>) => void,
) {
  updateNodeData(node.id, { params: { ...node.data.params, ...partial } })
}

export function DataEditor({ node }: { node: WorkflowNode }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const definitionId = node.data.definitionId
  const isFetch = definitionId === 'fetch' || 'url' in node.data.params || 'method' in node.data.params
  const isTransform = definitionId === 'transform' || 'expression' in node.data.params
  const isPrompt = definitionId === 'image.prompt' || 'prompt' in node.data.params

  if (definitionId === 'output') {
    return (
      <div className="border-y py-3 text-center text-[10px] text-muted-foreground">
        Configure sample output on the Data tab.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isFetch && (
        <>
          <div className="space-y-1.5">
            <Label>HTTP method</Label>
            <Select
              value={String(node.data.params.method ?? 'GET').toUpperCase()}
              onValueChange={(method) => updateParams(node, { method }, updateNodeData)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data-url">URL</Label>
            <Input
              id="data-url"
              value={String(node.data.params.url ?? '')}
              onChange={(event) => updateParams(node, { url: event.target.value }, updateNodeData)}
              placeholder="https://api.example.com/resource"
              className="font-mono"
            />
          </div>
        </>
      )}

      {isTransform && (
        <div className="space-y-1.5">
          <Label htmlFor="data-expression">Transform expression</Label>
          <Textarea
            id="data-expression"
            value={String(node.data.params.expression ?? '')}
            onChange={(event) =>
              updateParams(node, { expression: event.target.value }, updateNodeData)
            }
            placeholder="items.map(item => ({ ...item }))"
            className="min-h-28 font-mono text-xs"
            spellCheck={false}
          />
        </div>
      )}

      {isPrompt && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="image-prompt">Prompt</Label>
            <Textarea
              id="image-prompt"
              value={String(node.data.params.prompt ?? '')}
              onChange={(event) =>
                updateParams(node, { prompt: event.target.value }, updateNodeData)
              }
              placeholder="Describe the image to generate"
              className="min-h-28"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-negative-prompt">Negative prompt</Label>
            <Textarea
              id="image-negative-prompt"
              value={String(node.data.params.negativePrompt ?? '')}
              onChange={(event) =>
                updateParams(node, { negativePrompt: event.target.value }, updateNodeData)
              }
              placeholder="Elements to avoid"
              className="min-h-20"
            />
          </div>
        </>
      )}

      {!isFetch && !isTransform && !isPrompt && (
        <div className="border-y py-3 text-center text-[10px] text-muted-foreground">
          This data node has no operation parameters.
        </div>
      )}
    </div>
  )
}
