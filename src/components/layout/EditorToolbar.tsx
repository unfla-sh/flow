import {
  AlignCenterHorizontalIcon,
  AlignCenterVerticalIcon,
  AlignEndHorizontalIcon,
  AlignEndVerticalIcon,
  AlignHorizontalDistributeCenterIcon,
  AlignStartHorizontalIcon,
  AlignStartVerticalIcon,
  AlignVerticalDistributeCenterIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CopyIcon,
  InfoIcon,
  LayersIcon,
  LockIcon,
  MoonIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PlayIcon,
  PauseIcon,
  Redo2Icon,
  SkipForwardIcon,
  SquareIcon,
  SunIcon,
  Trash2Icon,
  Undo2Icon,
  UnlockIcon,
  WandIcon,
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { ConfirmDialog, type ConfirmRequest } from '@/components/dialogs/ConfirmDialog'
import { GenerateAiDialog } from '@/components/dialogs/GenerateAiDialog'
import { ImportMermaidDialog } from '@/components/dialogs/ImportMermaidDialog'
import { OpenWorkflowDialog } from '@/components/dialogs/OpenWorkflowDialog'
import { ValidationMenu } from '@/components/layout/ValidationMenu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { templates } from '@/data/templates'
import type { FlowDirection } from '@/types/workflow'
import {
  exportToJsonFile,
  exportToPng,
  importFromJsonFile,
  loadTemplate,
  loadWorkflowById,
  saveCurrentWorkflow,
} from '@/lib/persistence'
import { getTheme, setTheme, type Theme } from '@/lib/theme'
import { APP_VERSION } from '@/lib/version'
import { buildShareUrl } from '@/lib/share'
import { useHotkeys } from '@/lib/useHotkeys'
import {
  redo,
  undo,
  useBreadcrumbs,
  useTemporalStore,
  useWorkflowStore,
} from '@/store/workflowStore'

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function EditorToolbar({
  onTogglePalette,
  onToggleProperties,
}: {
  onTogglePalette: () => void
  onToggleProperties: () => void
}) {
  const dirty = useWorkflowStore((state) => state.dirty)
  const version = useWorkflowStore((state) => state.doc.settings.version)
  const navigateToPathIndex = useWorkflowStore((state) => state.navigateToPathIndex)
  const duplicateSelected = useWorkflowStore((state) => state.duplicateSelected)
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected)
  const updateActiveFlowSettings = useWorkflowStore((state) => state.updateActiveFlowSettings)
  const layoutActiveFlow = useWorkflowStore((state) => state.layoutActiveFlow)
  const alignSelection = useWorkflowStore((state) => state.alignSelection)
  const distributeSelection = useWorkflowStore((state) => state.distributeSelection)
  const selectionCount = useWorkflowStore((state) => {
    const flowId = state.activeFlowPath[state.activeFlowPath.length - 1]
    const graph = state.doc.flows[flowId]
    if (!graph) return 0
    const selected = graph.nodes.filter((node) => node.selected).length
    return selected > 0 ? selected : state.selectedNodeId ? 1 : 0
  })
  const presentationMode = useWorkflowStore((state) => state.presentationMode)
  const setPresentationMode = useWorkflowStore((state) => state.setPresentationMode)
  const sim = useWorkflowStore((state) => state.sim)
  const activeFlowDirection = useWorkflowStore((state) => {
    const flowId = state.activeFlowPath[state.activeFlowPath.length - 1]
    return state.doc.flows[flowId]?.settings?.direction ?? 'lr'
  })
  const breadcrumbs = useBreadcrumbs()
  const canUndo = useTemporalStore((state) => state.pastStates.length > 0)
  const canRedo = useTemporalStore((state) => state.futureStates.length > 0)

  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [openOpen, setOpenOpen] = useState(false)
  const [mermaidOpen, setMermaidOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      setTheme(next)
      return next
    })
  }, [])

  const guarded = useCallback((title: string, action: () => void) => {
    if (useWorkflowStore.getState().dirty) {
      setConfirm({
        title,
        description: 'You have unsaved changes that will be lost. Continue anyway?',
        confirmLabel: 'Discard changes',
        destructive: true,
        onConfirm: action,
      })
    } else {
      action()
    }
  }, [])

  const handleSave = useCallback(() => {
    if (useWorkflowStore.getState().currentWorkflowId) {
      saveCurrentWorkflow()
    } else {
      setSaveAsName(useWorkflowStore.getState().doc.settings.name)
      setSaveAsOpen(true)
    }
  }, [])

  const setDirection = useCallback(
    (direction: FlowDirection) => {
      updateActiveFlowSettings({ direction })
    },
    [updateActiveFlowSettings],
  )

  useHotkeys(handleSave)

  // Auto-advance the simulation while it's running.
  useEffect(() => {
    if (sim.status !== 'running') return
    const timer = setInterval(() => useWorkflowStore.getState().simStep(), 750)
    return () => clearInterval(timer)
  }, [sim.status])

  // Surface localStorage quota failures (otherwise saves fail silently).
  useEffect(() => {
    const onStorageError = (event: Event) => {
      setError({ title: 'Storage problem', message: String((event as CustomEvent).detail) })
    }
    window.addEventListener('wf:storage-error', onStorageError)
    return () => window.removeEventListener('wf:storage-error', onStorageError)
  }, [])

  const handleImportFile = async (file: File) => {
    const result = await importFromJsonFile(file)
    if (!result.ok) {
      setError({ title: 'Import failed', message: result.error ?? 'Unknown error' })
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle node palette"
        onClick={onTogglePalette}
      >
        <PanelLeftIcon />
      </Button>
      <Separator orientation="vertical" className="!h-5" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => guarded('New workflow', () => useWorkflowStore.getState().newWorkflow())}
          >
            New
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>New from template</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {templates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onSelect={() => guarded(`Load “${template.name}”`, () => loadTemplate(template))}
                >
                  {template.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setOpenOpen(true)}>Open…</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSave}>
            Save <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSaveAsName(useWorkflowStore.getState().doc.settings.name)
              setSaveAsOpen(true)
            }}
          >
            Save As…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => guarded('Import workflow', () => fileInputRef.current?.click())}
          >
            Import JSON…
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => guarded('Import from Mermaid', () => setMermaidOpen(true))}
          >
            Import from Mermaid…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => guarded('Generate with AI', () => setAiOpen(true))}>
            Generate with AI…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={exportToJsonFile}>Export JSON</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              const result = await exportToPng()
              if (!result.ok) {
                setError({ title: 'PNG export failed', message: result.error ?? 'Unknown error' })
              }
            }}
          >
            Export PNG
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              try {
                const url = await buildShareUrl()
                await navigator.clipboard.writeText(url)
                setError({
                  title: 'Share link copied',
                  message:
                    'A link to this workflow is on your clipboard — opening it loads this flow. The flow is gzip-compressed into the link (which lives in the URL hash, never sent to a server), so even large flows share fine; use Export JSON if a tool truncates very long links.',
                })
              } catch {
                setError({ title: 'Copy failed', message: 'Could not access the clipboard.' })
              }
            }}
          >
            Copy share link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
            <InfoIcon /> About Flow
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="!h-5" />
      <img
        src={`${import.meta.env.BASE_URL}flow-logo.png`}
        alt="Flow"
        className="h-5 w-7 shrink-0 object-contain"
      />
      <nav className="flex min-w-0 items-center gap-0.5 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <Fragment key={`${crumb.flowId}-${index}`}>
              {index > 0 && (
                <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {isLast ? (
                <span className="truncate text-xs font-semibold">{crumb.label}</span>
              ) : (
                <button
                  className="cursor-pointer truncate rounded px-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => navigateToPathIndex(index)}
                >
                  {crumb.label}
                </button>
              )}
            </Fragment>
          )
        })}
        {dirty && <span className="pl-0.5 text-muted-foreground">•</span>}
      </nav>
      <Badge variant="outline" className="ml-1 shrink-0">
        v{version}
      </Badge>

      <div className="flex-1" />

      <ValidationMenu />
      <Separator orientation="vertical" className="!h-5" />

      {sim.status !== 'idle' && (
        <Badge variant="secondary" className="shrink-0 gap-1 tabular-nums">
          {sim.status === 'done' ? 'finished' : `step ${sim.step}`}
        </Badge>
      )}
      {sim.status === 'running' ? (
        <IconAction label="Pause simulation" onClick={() => useWorkflowStore.getState().simPause()}>
          <PauseIcon />
        </IconAction>
      ) : (
        <IconAction
          label={sim.status === 'idle' ? 'Run simulation' : 'Resume simulation'}
          onClick={() => useWorkflowStore.getState().simPlay()}
        >
          <PlayIcon />
        </IconAction>
      )}
      <IconAction
        label="Step simulation"
        disabled={sim.status === 'done'}
        onClick={() => {
          const s = useWorkflowStore.getState()
          if (s.sim.status === 'idle') s.simReset()
          else if (s.sim.status === 'running') s.simPause()
          s.simStep()
        }}
      >
        <SkipForwardIcon />
      </IconAction>
      <IconAction
        label="Stop simulation"
        disabled={sim.status === 'idle'}
        onClick={() => useWorkflowStore.getState().simStop()}
      >
        <SquareIcon />
      </IconAction>
      <Separator orientation="vertical" className="!h-5" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={presentationMode}>
            {activeFlowDirection === 'tb' ? <ArrowDownIcon /> : <ArrowRightIcon />}
            Arrange
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem onSelect={layoutActiveFlow}>
            <WandIcon /> Auto layout
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={selectionCount < 2}
            onSelect={() => useWorkflowStore.getState().groupSelectionIntoSubFlow()}
          >
            <LayersIcon /> Group into sub-flow
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {activeFlowDirection === 'tb' ? <ArrowDownIcon /> : <ArrowRightIcon />} Flow direction
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => setDirection('lr')}>
                <ArrowRightIcon /> Left to right
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDirection('tb')}>
                <ArrowDownIcon /> Top to bottom
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            Align {selectionCount < 2 && '(select 2+ nodes)'}
          </DropdownMenuLabel>
          <DropdownMenuItem disabled={selectionCount < 2} onSelect={() => alignSelection('left')}>
            <AlignStartVerticalIcon /> Align left
          </DropdownMenuItem>
          <DropdownMenuItem disabled={selectionCount < 2} onSelect={() => alignSelection('center-h')}>
            <AlignCenterVerticalIcon /> Align centre (horizontal)
          </DropdownMenuItem>
          <DropdownMenuItem disabled={selectionCount < 2} onSelect={() => alignSelection('right')}>
            <AlignEndVerticalIcon /> Align right
          </DropdownMenuItem>
          <DropdownMenuItem disabled={selectionCount < 2} onSelect={() => alignSelection('top')}>
            <AlignStartHorizontalIcon /> Align top
          </DropdownMenuItem>
          <DropdownMenuItem disabled={selectionCount < 2} onSelect={() => alignSelection('center-v')}>
            <AlignCenterHorizontalIcon /> Align middle (vertical)
          </DropdownMenuItem>
          <DropdownMenuItem disabled={selectionCount < 2} onSelect={() => alignSelection('bottom')}>
            <AlignEndHorizontalIcon /> Align bottom
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            Distribute {selectionCount < 3 && '(select 3+ nodes)'}
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={selectionCount < 3}
            onSelect={() => distributeSelection('horizontal')}
          >
            <AlignHorizontalDistributeCenterIcon /> Distribute horizontally
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={selectionCount < 3}
            onSelect={() => distributeSelection('vertical')}
          >
            <AlignVerticalDistributeCenterIcon /> Distribute vertically
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="!h-5" />
      <IconAction
        label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </IconAction>
      <IconAction
        label={presentationMode ? 'Unlock editing' : 'Presentation lock'}
        onClick={() => setPresentationMode(!presentationMode)}
      >
        {presentationMode ? <UnlockIcon /> : <LockIcon />}
      </IconAction>
      <Separator orientation="vertical" className="!h-5" />
      <IconAction label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo || presentationMode}>
        <Undo2Icon />
      </IconAction>
      <IconAction
        label="Redo (Ctrl+Shift+Z)"
        onClick={redo}
        disabled={!canRedo || presentationMode}
      >
        <Redo2Icon />
      </IconAction>
      <Separator orientation="vertical" className="!h-5" />
      <IconAction
        label="Duplicate selection (Ctrl+D)"
        onClick={duplicateSelected}
        disabled={presentationMode}
      >
        <CopyIcon />
      </IconAction>
      <IconAction label="Delete selection (Del)" onClick={deleteSelected} disabled={presentationMode}>
        <Trash2Icon />
      </IconAction>
      <Separator orientation="vertical" className="!h-5" />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle properties panel"
        onClick={onToggleProperties}
      >
        <PanelRightIcon />
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleImportFile(file)
          event.target.value = ''
        }}
      />

      <OpenWorkflowDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        onOpenWorkflow={(id) => {
          setOpenOpen(false)
          guarded('Open workflow', () => {
            if (!loadWorkflowById(id)) {
              setError({ title: 'Open failed', message: 'This workflow could not be loaded.' })
            }
          })
        }}
      />

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save workflow</DialogTitle>
            <DialogDescription>Saved in this browser. Use Export JSON to share a file.</DialogDescription>
          </DialogHeader>
          <Input
            value={saveAsName}
            onChange={(event) => setSaveAsName(event.target.value)}
            placeholder="Workflow name"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && saveAsName.trim()) {
                saveCurrentWorkflow(saveAsName)
                setSaveAsOpen(false)
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveAsOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!saveAsName.trim()}
              onClick={() => {
                saveCurrentWorkflow(saveAsName)
                setSaveAsOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={error !== null} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{error?.title}</DialogTitle>
            <DialogDescription>{error?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setError(null)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img
                src={`${import.meta.env.BASE_URL}flow-logo.png`}
                alt=""
                className="h-6 w-9 object-contain"
              />{' '}
              Flow
            </DialogTitle>
            <DialogDescription>
              Flow · version {APP_VERSION}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A hierarchical workflow editor. More details coming soon.
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href="https://flow.unfla.sh"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              flow.unfla.sh
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/unfla-sh/flow"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              GitHub
            </a>
          </p>
          <DialogFooter>
            <Button size="sm" onClick={() => setAboutOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportMermaidDialog open={mermaidOpen} onOpenChange={setMermaidOpen} />
      <GenerateAiDialog open={aiOpen} onOpenChange={setAiOpen} />

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </header>
  )
}
