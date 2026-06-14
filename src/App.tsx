import { ReactFlowProvider } from '@xyflow/react'

import { EditorLayout } from '@/components/layout/EditorLayout'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <ReactFlowProvider>
      <TooltipProvider>
        <EditorLayout />
      </TooltipProvider>
    </ReactFlowProvider>
  )
}

export default App
