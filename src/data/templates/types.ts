import type { WorkflowDoc } from '@/types/workflow'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  /** Menu group in File ▸ New from template (e.g. "Structure", "Tours"). */
  category?: string
  doc: WorkflowDoc
}
