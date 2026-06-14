import type { WorkflowDoc } from '@/types/workflow'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  doc: WorkflowDoc
}
