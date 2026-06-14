import { useRef } from 'react'
import type { ImperativePanelHandle } from 'react-resizable-panels'

import { FlowCanvas } from '@/components/canvas/FlowCanvas'
import { EditorToolbar } from '@/components/layout/EditorToolbar'
import { NodePalette } from '@/components/palette/NodePalette'
import { PropertiesPanel } from '@/components/properties/PropertiesPanel'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export function EditorLayout() {
  const paletteRef = useRef<ImperativePanelHandle>(null)
  const propertiesRef = useRef<ImperativePanelHandle>(null)

  const togglePanel = (ref: typeof paletteRef) => {
    const panel = ref.current
    if (!panel) return
    if (panel.isCollapsed()) panel.expand()
    else panel.collapse()
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar
        onTogglePalette={() => togglePanel(paletteRef)}
        onToggleProperties={() => togglePanel(propertiesRef)}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          ref={paletteRef}
          defaultSize={18}
          minSize={12}
          maxSize={30}
          collapsible
          className="bg-muted/20"
        >
          <NodePalette />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          <FlowCanvas />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          ref={propertiesRef}
          defaultSize={22}
          minSize={15}
          maxSize={35}
          collapsible
          className="bg-muted/20"
        >
          <PropertiesPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
