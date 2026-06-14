import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { APP_VERSION } from '@/lib/version'
import { useWorkflowStore } from '@/store/workflowStore'

export function WorkflowSettingsPanel() {
  const settings = useWorkflowStore((state) => state.doc.settings)
  const updateSettings = useWorkflowStore((state) => state.updateSettings)
  const flowCount = useWorkflowStore((state) => Object.keys(state.doc.flows).length)
  const nodeCount = useWorkflowStore((state) =>
    Object.values(state.doc.flows).reduce((sum, flow) => sum + flow.nodes.length, 0),
  )
  const edgeCount = useWorkflowStore((state) =>
    Object.values(state.doc.flows).reduce((sum, flow) => sum + flow.edges.length, 0),
  )

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="wf-name">Name</Label>
        <Input
          id="wf-name"
          value={settings.name}
          onChange={(event) => updateSettings({ name: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wf-version">Version</Label>
        <Input
          id="wf-version"
          value={settings.version}
          onChange={(event) => updateSettings({ version: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wf-description">Description</Label>
        <Textarea
          id="wf-description"
          value={settings.description ?? ''}
          onChange={(event) => updateSettings({ description: event.target.value })}
          placeholder="What does this workflow do?"
        />
      </div>
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        {nodeCount} nodes · {edgeCount} edges · {flowCount} flow{flowCount === 1 ? '' : 's'}
        <span className="ml-1 opacity-70">· Editor v{APP_VERSION}</span>
      </div>
    </div>
  )
}
