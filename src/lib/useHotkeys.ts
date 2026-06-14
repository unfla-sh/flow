import { useEffect } from 'react'

import { redo, undo, useWorkflowStore } from '@/store/workflowStore'

function isEditingText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

/**
 * Global editor shortcuts: copy/cut/paste/duplicate, delete, undo/redo, save.
 * Inactive while a text field has focus so normal editing keys still work.
 */
export function useHotkeys(onSave: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditingText(event.target)) return
      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      const store = useWorkflowStore.getState()
      const locked = store.presentationMode

      if (mod && key === 's') {
        event.preventDefault()
        onSave()
      } else if (locked) {
        return
      } else if (mod && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if ((mod && key === 'z' && event.shiftKey) || (mod && key === 'y')) {
        event.preventDefault()
        redo()
      } else if (mod && key === 'c') {
        event.preventDefault()
        store.copySelection()
      } else if (mod && key === 'x') {
        event.preventDefault()
        store.cutSelection()
      } else if (mod && key === 'v') {
        event.preventDefault()
        store.paste()
      } else if (mod && key === 'd') {
        event.preventDefault()
        store.duplicateSelected()
      } else if (!mod && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault()
        store.deleteSelected()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSave])
}
