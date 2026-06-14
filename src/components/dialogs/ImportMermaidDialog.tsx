import { useRef, useState } from 'react'

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
import { parseMermaid } from '@/lib/import/mermaid'
import { loadDocAsNew } from '@/lib/persistence'

const SAMPLE = `flowchart LR
  A([Start]) --> B[fetch_data.py]
  B --> C{valid?}
  C -->|yes| D[transform]
  C -->|no| E([End])
  D --> E`

export function ImportMermaidDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doImport = () => {
    const result = parseMermaid(text)
    if (!result.ok) {
      setError(result.error)
      return
    }
    loadDocAsNew(result.doc)
    setError(null)
    setText('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import from Mermaid</DialogTitle>
          <DialogDescription>
            Paste a Mermaid flowchart, or a Markdown file containing a ```mermaid block. Subgraphs
            become frame groups; diamonds become condition nodes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="mermaid-src">Diagram</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
                Sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                Load file…
              </Button>
            </div>
          </div>
          <Textarea
            id="mermaid-src"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
            }}
            placeholder={SAMPLE}
            className="min-h-56 font-mono text-xs"
            spellCheck={false}
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.mmd,.txt,text/markdown,text/plain"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) {
              setText(await file.text())
              setError(null)
            }
            event.target.value = ''
          }}
        />
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!text.trim()} onClick={doImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
