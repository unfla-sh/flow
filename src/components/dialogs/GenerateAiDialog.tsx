import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buildFullPrompt, parseGeneratedText } from '@/lib/ai/generateFlow'
import { loadDocAsNew } from '@/lib/persistence'

export function GenerateAiDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildFullPrompt(prompt))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — the prompt is shown in a textarea to copy manually
    }
  }

  const loadPasted = () => {
    const result = parseGeneratedText(pasted)
    if (!result.ok) {
      setError(result.error)
      return
    }
    loadDocAsNew(result.doc)
    setPrompt('')
    setPasted('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate with AI</DialogTitle>
          <DialogDescription>
            No API key needed. Describe a diagram, copy the prompt into any chat assistant (Poe,
            ChatGPT, Claude.ai, Gemini…), then paste its JSON answer back here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">Describe the diagram</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="e.g. A web platform with a firewall, load balancer, two web servers, application API, database, and cache…"
            className="min-h-24"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>1 · Prompt to copy</Label>
            <Button variant="outline" size="sm" disabled={!prompt.trim()} onClick={copyPrompt}>
              {copied ? 'Copied!' : 'Copy prompt'}
            </Button>
          </div>
          <Textarea
            readOnly
            value={prompt.trim() ? buildFullPrompt(prompt) : 'Describe the diagram above first…'}
            className="max-h-28 min-h-20 overflow-auto font-mono text-[10px]"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-paste">2 · Paste the model's JSON answer</Label>
          <Textarea
            id="ai-paste"
            value={pasted}
            onChange={(event) => {
              setPasted(event.target.value)
              setError(null)
            }}
            placeholder='{ "schemaVersion": 1, "settings": …, "flows": … }'
            className="min-h-28 font-mono text-[10px]"
            spellCheck={false}
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!pasted.trim()} onClick={loadPasted}>
            Load diagram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
