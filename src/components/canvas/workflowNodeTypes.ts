import type { NodeTypes } from '@xyflow/react'

import { ConditionNode } from './nodes/ConditionNode'
import { DataNode } from './nodes/DataNode'
import { DecisionNode } from './nodes/DecisionNode'
import { FormNode } from './nodes/FormNode'
import { FrameNode } from './nodes/FrameNode'
import { MediaNode } from './nodes/MediaNode'
import { NoteNode } from './nodes/NoteNode'
import { ProfileNode } from './nodes/ProfileNode'
import { RecordNode } from './nodes/RecordNode'
import { ResourceNode } from './nodes/ResourceNode'
import { ScoreCardNode } from './nodes/ScoreCardNode'
import { ScriptNode } from './nodes/ScriptNode'
import { EndNode, StartNode } from './nodes/StartEndNode'
import { SubFlowNode } from './nodes/SubFlowNode'
import { SwitchNode } from './nodes/SwitchNode'

export const workflowNodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  script: ScriptNode,
  form: FormNode,
  data: DataNode,
  condition: ConditionNode,
  switch: SwitchNode,
  subflow: SubFlowNode,
  note: NoteNode,
  frame: FrameNode,
  media: MediaNode,
  scorecard: ScoreCardNode,
  profile: ProfileNode,
  record: RecordNode,
  resource: ResourceNode,
}
