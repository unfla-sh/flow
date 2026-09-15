import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { buildFullPrompt, buildGenerateMessages, parseGeneratedText } from '@/lib/ai/generateFlow'
import { buildFullModifyPrompt, buildModifyMessages, parseModifiedText } from '@/lib/ai/modifyFlow'
import {
  AI_PROVIDERS,
  callModel,
  loadAiSettings,
  ModelCallError,
  providerInfo,
  saveAiSettings,
  type AiProviderId,
  type AiSettings,
} from '@/lib/ai/providers'
import { loadDocAsNew } from '@/lib/persistence'
import { useWorkflowStore } from '@/store/workflowStore'
import type { WorkflowDoc } from '@/types/workflow'

export type AiDialogMode = 'generate' | 'modify'
type Method = 'api' | 'paste'

const METHOD_KEY = 'wf:ai-method'

function loadMethod(): Method {
  try {
    return localStorage.getItem(METHOD_KEY) === 'paste' ? 'paste' : 'api'
  } catch {
    return 'api'
  }
}

/**
 * The caller remounts this (a fresh `key` per opening) so the mode it asks for
 * and the stored provider settings are read once, at mount.
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
  const [method, setMethod] = useState<Method>(loadMethod)
  const [prompt, setPrompt] = useState('')
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AiSettings>(loadAiSettings)
  const [busy, setBusy] = useState<{ chars: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

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

  const parse = (text: string) =>
    mode === 'modify' ? parseModifiedText(text, doc) : parseGeneratedText(text)

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
    const result = parse(pasted)
    if (!result.ok) {
      setError(result.error)
      return
    }
    applyDoc(result.doc)
  }

  const updateSettings = (partial: Partial<AiSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }

  const changeProvider = (provider: AiProviderId) => {
    updateSettings({ provider, model: providerInfo(provider).defaultModel })
  }

  const chooseMethod = (next: Method) => {
    setMethod(next)
    try {
      localStorage.setItem(METHOD_KEY, next)
    } catch {
      // storage blocked — the choice just does not stick
    }
  }

  const run = async () => {
    saveAiSettings(settings)
    const messages =
      mode === 'modify' ? buildModifyMessages(doc, prompt) : buildGenerateMessages(prompt)
    const controller = new AbortController()
    abortRef.current = controller
    setBusy({ chars: 0 })
    setError(null)
    try {
      const text = await callModel({
        settings,
        ...messages,
        signal: controller.signal,
        onProgress: (chars) => setBusy({ chars }),
      })
      const result = parse(text)
      if (!result.ok) {
        setError(`The model's answer was not a valid diagram: ${result.error}`)
        setPasted(text)
        return
      }
      applyDoc(result.doc)
    } catch (err) {
      setError(err instanceof ModelCallError ? err.message : String(err))
    } finally {
      abortRef.current = null
      setBusy(null)
    }
  }

  const cancel = () => abortRef.current?.abort()

  const provider = providerInfo(settings.provider)
  const canRun = prompt.trim().length > 0 && !busy

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'modify' ? 'Modify with AI' : 'Generate with AI'}</DialogTitle>
          <DialogDescription>
            {mode === 'modify'
              ? 'Describe a change to the current diagram. The result replaces it in place and can be undone with Ctrl+Z.'
              : 'Describe a diagram to build from scratch. It opens as a new, unsaved document.'}
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
            disabled={!!busy}
          />
        </div>

        <Tabs value={method} onValueChange={(value) => chooseMethod(value as Method)}>
          <TabsList className="w-full">
            <TabsTrigger value="api">Call an API (your key)</TabsTrigger>
            <TabsTrigger value="paste">Copy &amp; paste (no key)</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select
                  value={settings.provider}
                  onValueChange={(value) => changeProvider(value as AiProviderId)}
                  disabled={!!busy}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-model">Model</Label>
                <Input
                  id="ai-model"
                  value={settings.model}
                  onChange={(event) => updateSettings({ model: event.target.value })}
                  placeholder={provider.defaultModel || 'model name'}
                  className="font-mono text-[11px]"
                  disabled={!!busy}
                />
              </div>
            </div>
            {settings.provider === 'custom' && (
              <div className="space-y-1.5">
                <Label htmlFor="ai-base-url">Base URL (OpenAI-compatible)</Label>
                <Input
                  id="ai-base-url"
                  value={settings.baseUrl}
                  onChange={(event) => updateSettings({ baseUrl: event.target.value })}
                  placeholder="http://localhost:11434/v1"
                  className="font-mono text-[11px]"
                  disabled={!!busy}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-key">API key</Label>
                {provider.keysUrl && (
                  <a
                    href={provider.keysUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-muted-foreground underline"
                  >
                    Get a key
                  </a>
                )}
              </div>
              <Input
                id="ai-key"
                type="password"
                autoComplete="off"
                value={settings.apiKey}
                onChange={(event) => updateSettings({ apiKey: event.target.value })}
                placeholder={settings.provider === 'custom' ? 'optional' : 'sk-…'}
                className="font-mono text-[11px]"
                disabled={!!busy}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-remember"
                  checked={settings.rememberKey}
                  onCheckedChange={(checked) => updateSettings({ rememberKey: checked === true })}
                  disabled={!!busy}
                />
                <Label htmlFor="ai-remember" className="text-[11px] font-normal">
                  Remember the key in this browser
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                The request goes straight from your browser to the provider; Flow has no server and
                never sees the key. Don't store a key on a shared computer.
              </p>
            </div>
            {busy && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                {busy.chars > 0
                  ? `Receiving the diagram… ${busy.chars.toLocaleString()} characters so far`
                  : 'Waiting for the model…'}
              </div>
            )}
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <DialogFooter>
              {busy ? (
                <Button variant="outline" size="sm" onClick={cancel}>
                  Cancel request
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
              <Button size="sm" disabled={!canRun} onClick={run}>
                {mode === 'modify' ? 'Apply change' : 'Generate diagram'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="paste" className="space-y-3 pt-2">
            <p className="text-[11px] text-muted-foreground">
              Copy the prompt into any chat assistant (Poe, ChatGPT, Claude.ai, Gemini…), then paste
              its JSON answer back here.
            </p>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
