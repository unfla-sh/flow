/**
 * The flow-document contract, written for an LLM. Used as the system prompt for
 * in-app generation and mirrored in docs/flow-format.md for the agent workflow.
 */
export const FLOW_SCHEMA_PROMPT = `You convert a description of a pipeline or process into a workflow diagram, expressed as a single JSON document that a visual editor can load. Output ONLY the JSON — no prose, no markdown fences.

Top-level shape:
{
  "schemaVersion": 1,
  "settings": { "name": string, "version": "1.0.0", "description": string },
  "flows": { "root": { "nodes": [...], "edges": [...], "settings": { "direction": "lr" | "tb" } } }
}

"flows" is a map of flowId -> { nodes, edges, settings }. There is always a "root" flow. Extra flows exist only when a sub-flow node references them.

Node: { "id": string (unique), "type": nodeType, "position": { "x": 0, "y": 0 }, "data": {...} }
- You may leave every position at {x:0,y:0}; the editor auto-lays-out the graph.
- data: { "label": string, "description"?: string, "nodeType": nodeType, "params": object, ...type-specific fields }
- data.icon?: string — an icon name from the registry below, overriding the node type's default. data.style?: { "iconBg"?: hex colour of the icon chip, "textColor"?: hex label colour, "fillColor"?: hex, "borderColor"?: hex, "borderStyle"?: "solid"|"dashed"|"dotted" }.
- Icon names: workflow, settings, file, clipboard, search, filter, flag, bell, calendar, clock, timer, tag, bookmark, lightbulb, info, alert, code, terminal, branch, merge, split, shuffle, repeat, layers, network, webhook, wrench, zap, cpu, bot, brain, database, table, globe, cloud, server, download, upload, send, mail, message, link, share, image, film, music, eye, user, users, map, map-pin, lock, key, folder, camera, cart, card, dollar, hash, at, truck, package, box, activity, star, trophy, medal, crown, gift, rocket, flame, gamepad, coffee, sun, heart, thumbs-up, party, sparkles, check, play, ball, goal, boot. (Full set in src/lib/icons.ts. For sports/football use "ball", "goal", "boot", "trophy", "medal" or "flag".)
- SET AN EXPLICIT data.icon ON EVERY NODE, even when it equals the type default, and give every node in the same semantic group the SAME icon name. This makes the file trivial to re-theme later ("change all X icons to Y" becomes one find/replace) instead of the reader having to add icons from scratch.

nodeType values and when to use them:
- "start"  — entry point / trigger (cron, request). params: {}
- "end"    — terminal point. params: {}
- "script" — runs code/a command. data.scriptPath?: string, params.args?: [{id,key,value}]
- "data"   — fetch/API/transform/output. params may hold {url, method}. data.simulatedOutput?: any sample JSON
- "form"   — user input. data.formSchema?: [{id,label,type:'text'|'number'|'date'|'daterange'|'select'|'multiselect'|'checkbox', required?, options?}]
- "condition" — two-way branch. params.expression: string. Edges from it set sourceHandle "true" or "false".
- "switch" — multi-way branch. params.expression: string. data.cases: [{id,when}]. Edges set sourceHandle to a case id, or "default".
- "subflow" — a nested pipeline. data.subFlowId: string referencing another key in "flows". Put that flow's nodes/edges under flows[subFlowId].
- "note"   — sticky annotation. params.text: string. No edges.
- "frame"  — visual grouping box behind nodes. No edges.
- "scorecard" — display-only results card (brackets, leaderboards, comparisons). params: { "header"?: string (left of header strip, e.g. venue), "tag"?: string (right, e.g. "Full time"), "caption"?: string (small-caps text above the card), "emblem"?: string (emoji shown large above the card, e.g. "🏆"), "accent"?: boolean (gold background on bold rows), "rows": [{ "icon"?: emoji, "label": string, "value"?: string, "bold"?: boolean }] }. Bold rows are emphasised and the others muted. May be wired with edges (e.g. tournament brackets).

Edge: { "id": string (unique), "source": nodeId, "target": nodeId, "label"?: string, "sourceHandle"?: string, "targetHandle"?: string, "data"?: { "condition"?: string, "style"?: { "arrow"?: true, "arrowStart"?: true, "bidirectional"?: true, "lineWidth"?: number, "arrowSize"?: number } } }
- For condition sources set "sourceHandle":"true"|"false". For switch sources set it to the case id or "default".
- Use one direct edge with data.style { "arrow": true, "arrowStart": true } for two-way communication (<->, bidirectional, sync, request/response, communicates with), instead of two opposite edges. Example: web server ↔ database should be one edge labelled "SQL queries / result sets".
- "sourceHandle"/"targetHandle" may also be "top" | "bottom" | "left" | "right" to attach an edge to the MIDDLE of a node's side. For a vertical link between a node and one placed directly below it (e.g. web above db), use "sourceHandle":"bottom" + "targetHandle":"top" so the arrowheads point into the middle of each node. Position the two nodes with the same x and the lower one ~250px below.
- data.style.bidirectional:true is only a visual split-arrow style from the line midpoint; prefer arrow+arrowStart for normal Web ↔ DB relationships.

Rules: ids unique across the whole document; every edge source/target must reference an existing node id in the same flow; prefer "lr" direction; keep labels short; model real branching with condition/switch rather than linear chains when the source implies it.`
