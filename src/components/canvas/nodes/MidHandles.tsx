import { Handle, Position } from '@xyflow/react'

/**
 * Extra connection points at the centre of each side (ids: top/bottom/left/
 * right), in addition to a node's default head/tail handles. With the canvas
 * in loose connection mode these act as both source and target, so edges can
 * attach to a node's middle — e.g. a vertical web ⇄ db link from one node's
 * bottom into another's top. Rendered muted; they brighten on node hover
 * (see `.react-flow__node:hover` rule in index.css).
 */
export function MidHandles({ connectable }: { connectable: boolean }) {
  const sides = [
    { id: 'top', position: Position.Top },
    { id: 'right', position: Position.Right },
    { id: 'bottom', position: Position.Bottom },
    { id: 'left', position: Position.Left },
  ] as const

  return (
    <>
      {sides.map(({ id, position }) => (
        <Handle
          key={id}
          id={id}
          type="source"
          position={position}
          isConnectable={connectable}
          className="workflow-mid-handle !size-2 !border !border-background !bg-muted-foreground/40"
        />
      ))}
    </>
  )
}
