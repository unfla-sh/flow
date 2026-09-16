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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { buildFullPrompt, parseGeneratedText } from '@/lib/ai/generateFlow'
import { buildFullModifyPrompt, parseModifiedText } from '@/lib/ai/modifyFlow'
import { loadDocAsNew } from '@/lib/persistence'
import { useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowDoc } from '@/types/workflow'

export type AiDialogMode = 'generate' | 'modify'

/**
 * Copy-and-paste only, by design: the editor is a public static site, so it
 * never asks for or stores a provider API key. The prompt goes to whichever
 * chat assistant the user already has, and its JSON answer comes back here.
 * The caller remounts this (a fresh `key` per opening) so it starts in the
 * requested mode.
 */
export function GenerateAiDialog({
  open,
  onOpenChange,
  mode: initialMode = 'generate',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: AiDialogMode
}) {
  const doc = useWorkflowStore((state) => state.doc)
  const replaceDoc = useWorkflowStore((state) => state.replaceDoc)
  const [mode, setMode] = useState<AiDialogMode>(initialMode)
  const [prompt, setPrompt] = useState('')
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fullPrompt = !prompt.trim()
    ? ''
    : mode === 'modify'
      ? buildFullModifyPrompt(doc, prompt)
      : buildFullPrompt(prompt)

  const applyDoc = (next: WorkflowDoc) => {
    if (mode === 'modify') replaceDoc(next)
    else loadDocAsNew(next)
    setPrompt('')
    setPasted('')
    setError(null)
    onOpenChange(false)
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — the prompt is shown in a textarea to copy manually
    }
  }

  const loadPasted = () => {
    const result = mode === 'modify' ? parseModifiedText(pasted, doc) : parseGeneratedText(pasted)
    if (!result.ok) {
      setError(result.error)
      return
    }
    applyDoc(result.doc)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'modify' ? 'Modify with AI' : 'Generate with AI'}</DialogTitle>
          <DialogDescription>
            No API key needed. Copy the prompt into any chat assistant (Poe, ChatGPT, Claude.ai,
            Gemini…), then paste its JSON answer back here.
            {mode === 'modify'
              ? ' The result replaces the current diagram in place and can be undone with Ctrl+Z.'
              : ' The result opens as a new, unsaved document.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as AiDialogMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="generate">Generate new</TabsTrigger>
            <TabsTrigger value="modify">Modify current</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">
            {mode === 'modify' ? 'What should change?' : 'Describe the diagram'}
          </Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              mode === 'modify'
                ? 'e.g. Add a "Manager approval" condition after the review step; route rejected requests back to the form. Colour all database nodes blue.'
                : 'e.g. A web platform with a firewall, load balancer, two web servers, application API, database, and cache…'
            }
            className="min-h-24"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>1 · Prompt to copy</Label>
            <Button variant="outline" size="sm" disabled={!fullPrompt} onClick={copyPrompt}>
              {copied ? 'Copied!' : 'Copy prompt'}
            </Button>
          </div>
          <Textarea
            readOnly
            value={fullPrompt || 'Describe the diagram or change above first…'}
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
            {mode === 'modify' ? 'Apply change' : 'Load diagram'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
