/**
 * The flow-document contract, written for an LLM. Used as the system prompt for
 * in-app generation and mirrored in docs/flow-format.md for the agent workflow.
 */
export const FLOW_SCHEMA_PROMPT = `You convert a user description into the most appropriate editable diagram, expressed as a single JSON document that a visual editor can load. Supported diagrams include workflows, organization charts, database ER models, infrastructure/server architecture, image-generation pipelines, and general visual graphs. Output ONLY the JSON — no prose, no markdown fences.

Top-level shape:
{
  "schemaVersion": 1,
  "settings": { "name": string, "version": "1.0.0", "description": string, "diagramKind": "workflow" | "organization" | "database" | "infrastructure" | "image-generation" | "state" | "planning" | "uml" | "general" },
  "flows": { "root": { "nodes": [...], "edges": [...], "settings": { "direction": "lr" | "tb" } } }
}

"flows" is a map of flowId -> { nodes, edges, settings }. There is always a "root" flow. Extra flows exist only when a sub-flow node references them.

Node: { "id": string (unique), "type": nodeType, "position": { "x": 0, "y": 0 }, "data": {...} }
- "type" MUST equal "data.nodeType". "data.params" MUST always be an object, even when empty.
- You may leave every non-frame position at {x:0,y:0}; the editor auto-lays-out the graph. A frame is excluded from auto-layout, so either omit frames or give each frame an explicit position, width, height, and zIndex:-1 that encloses its members.
- data: { "label": string, "description"?: string, "nodeType": nodeType, "definitionId": string, "params": object, ...type-specific fields }
- data.icon?: string — an icon name from the registry below, overriding the node type's default. data.style?: { "iconBg"?: hex colour of the icon chip, "textColor"?: hex label colour, "fillColor"?: hex, "borderColor"?: hex, "borderStyle"?: "solid"|"dashed"|"dotted" }.
- Icon names: workflow, settings, file, clipboard, search, filter, flag, bell, calendar, clock, timer, tag, bookmark, lightbulb, info, alert, code, terminal, branch, merge, split, shuffle, repeat, layers, network, webhook, wrench, zap, cpu, bot, brain, database, table, globe, cloud, server, download, upload, send, mail, message, link, share, image, film, music, eye, user, users, map, map-pin, lock, key, folder, camera, cart, card, dollar, hash, at, truck, package, box, activity, star, trophy, medal, crown, gift, rocket, flame, gamepad, coffee, sun, heart, thumbs-up, party, sparkles, check, play, ball, goal, boot. (Full set in src/lib/icons.ts. For sports/football use "ball", "goal", "boot", "trophy", "medal" or "flag".)
- SET AN EXPLICIT data.icon AND data.definitionId ON EVERY NODE. Give nodes in the same semantic group the same icon. definitionId selects the exact editable palette component while nodeType selects its renderer.

nodeType values and when to use them:
- "start"  — entry point / trigger (cron, request). params: {}
- "end"    — terminal point. params: {}
- "script" — runs code/a command. data.scriptPath?: string, params.args?: [{id,key,value}]
- "data"   — fetch/API/transform/output. params may hold {url, method}. data.simulatedOutput?: any sample JSON
- "form"   — user input. data.formSchema?: [{id,label,type:'text'|'number'|'date'|'daterange'|'select'|'multiselect'|'checkbox', required?, options?}]
- "condition" — two-way branch. params.expression: string. Edges from it set sourceHandle "true" or "false".
- "decision" — flowchart diamond with params.expression: string. Edges use sourceHandle "true" or "false".
- "switch" — multi-way branch. params.expression: string. data.cases: [{id,when}]. Edges set sourceHandle to a case id, or "default".
- "subflow" — a nested pipeline. data.subFlowId: string referencing another key in "flows". Put that flow's nodes/edges under flows[subFlowId].
- "note"   — sticky annotation. params.text: string. No edges.
- "frame"  — visual grouping box behind nodes. No edges. params.caption?: string (small badge after the label, e.g. "WIP 3" or "raw").
- "media" — image/audio/video preview. params: {kind:"image"|"audio"|"video", url:string}.
- "scorecard" — display-only results card (brackets, leaderboards, comparisons). params: { "header"?: string (left of header strip, e.g. venue), "tag"?: string (right, e.g. "Full time"), "caption"?: string (small-caps text above the card), "emblem"?: string (emoji shown large above the card, e.g. "🏆"), "accent"?: boolean (gold background on bold rows), "rows": [{ "icon"?: emoji, "label": string, "value"?: string, "bold"?: boolean }] }. Bold rows are emphasised and the others muted. May be wired with edges (e.g. tournament brackets).
- "profile" — person or role card for organization charts. params: {title?: string, department?: string, status?: string, avatarUrl?: string}; data.attributes?: [{id,label,value}].
- "record" — table/entity/schema/class card. params: {recordKind?: "Table" | "View" | "Class" | "Interface" | "Enum", namespace?: string}; data.fields: [{id,name,dataType,key?: "none"|"primary"|"foreign"|"unique",nullable?: boolean,indexed?: boolean}]; data.operations?: [{id, signature}] (UML methods, e.g. "+ total(): Money"). Fields expose handles named "field:<field-id>:left" and "field:<field-id>:right".
- "resource" — infrastructure, team, model, or other typed resource. params: {resourceType?: string, environment?: string, status?: string}; data.attributes?: [{id,label,value}].

Exact definitionId values (use one on every node):
- Workflow/general: "start", "end", "script", "subflow", "fetch", "transform", "output", "form", "condition", "switch", "loop", "delay", "error_handler", "decision", "note", "frame", "scorecard", "media".
- Organization: "org.person" (profile), "org.vacant-role" (profile), "org.team" (resource), "org.department" (frame).
- Database: "database.table" (record), "database.view" (record).
- Infrastructure: "infra.firewall", "infra.load-balancer", "infra.web-server", "infra.app-server", "infra.database-server", "infra.cache" (all resource), "infra.network-zone" (frame).
- Image generation: "image.prompt" (data; params {prompt:string, negativePrompt?:string}), "image.model", "image.sampler", "image.upscaler" (resource), and "media" for image input/output previews.
- Architecture/deployment (also infrastructure kit): "infra.service", "infra.queue", "infra.storage", "infra.client", "infra.external" (resource), "infra.host" (frame for a VM/node; artifacts inside), "infra.data-layer" (frame for a medallion tier).
- General building blocks: "general.component" (resource; a plain labelled box for trees, nesting, layer stacks, dependency graphs, flywheels), "general.layer" (frame; a wide horizontal band), "process.lane" (frame; one swimlane per role, stacked vertically, full width).
- State machine (diagramKind "state"): "state.state" (resource; params.resourceType "State"; attributes entry/exit), "state.composite" (frame), plus "start" (initial), "end" (final) and "decision" (choice). Edges kind:"transition" with the event and [guard] as the label.
- Planning (diagramKind "planning"): "plan.column" (frame; kanban column, params.caption "WIP n"), "plan.card" (resource; params {resourceType:"Story"|"Bug"|"Task", status}, attributes Owner/Size), "plan.activity" (resource; story-map backbone step), "plan.release" (frame; horizontal release band). Cards sit inside columns/bands by position; edges are rare (kind:"dependency", dashed).
- UML (diagramKind "uml"): "uml.class", "uml.interface", "uml.enum" (record; recordKind Class/Interface/Enum; fields are attributes like "- id: UUID" split into name/dataType; operations are signatures). Edges kind:"association"; inheritance = style {arrow:true, arrowShape:"open-triangle"}; realisation adds lineStyle:"dashed"; composition = {arrowStart:true, arrowStartShape:"diamond"} at the whole side; aggregation uses "open-diamond".

Edge: { "id": string (unique), "source": nodeId, "target": nodeId, "label"?: string, "sourceHandle"?: string, "targetHandle"?: string, "data"?: { "kind"?: "flow"|"reporting"|"relationship"|"network"|"data"|"dependency"|"transition"|"association", "condition"?: string, "protocol"?: string, "sourceCardinality"?: "one"|"zero-one"|"many"|"zero-many", "targetCardinality"?: "one"|"zero-one"|"many"|"zero-many", "route"?: {"kind":"auto"|"manual","points"?: [{"x":number,"y":number}]}, "labelPosition"?: {"along"?: 0..1 fraction of the path, "dx"?: number, "dy"?: number}, "style"?: { "stroke"?: string, "arrow"?: boolean, "arrowStart"?: boolean, "arrowShape"?: "triangle"|"open-triangle"|"diamond"|"open-diamond"|"circle", "arrowStartShape"?: same, "bidirectional"?: boolean, "lineWidth"?: number, "arrowSize"?: number, "lineStyle"?: "solid"|"dashed"|"dotted", "pathType"?: "bezier"|"step" } } }
- For condition sources set "sourceHandle":"true"|"false". For switch sources set it to the case id or "default".
- Use one direct edge with data.style { "arrow": true, "arrowStart": true } for two-way communication (<->, bidirectional, sync, request/response, communicates with), instead of two opposite edges. Example: web server ↔ database should be one edge labelled "SQL queries / result sets".
- "sourceHandle"/"targetHandle" may also be "top" | "bottom" | "left" | "right" to attach an edge to the MIDDLE of a node's side. For a vertical link between a node and one placed directly below it (e.g. web above db), use "sourceHandle":"bottom" + "targetHandle":"top" so the arrowheads point into the middle of each node. Position the two nodes with the same x and the lower one ~250px below.
- data.style.bidirectional:true is only a visual split-arrow style from the line midpoint; prefer arrow+arrowStart for normal Web ↔ DB relationships.
- Organization template recipe: diagramKind "organization", direction "tb"; manager is edge source and direct report is target; use profile nodes, kind:"reporting", pathType:"step", solid lines for primary reporting and lineStyle:"dotted" for matrix/advisory reporting. Do not add Start/End nodes.
- Database ER template recipe: diagramKind "database", direction "lr"; use record nodes with stable field ids; connect exact handles "field:<primary-id>:right" to "field:<foreign-id>:left"; use kind:"relationship", pathType:"step", no arrows, and explicit sourceCardinality/targetCardinality. Do not add Start/End nodes.
- Infrastructure/server template recipe: diagramKind "infrastructure", direction "lr"; use resource nodes and kind:"network" edges with concise protocol values such as "HTTPS :443" or "SQL :5432"; pathType:"step" is preferred. Use one edge with arrow + arrowStart for truly two-way traffic. Do not add Start/End nodes.
- Image-generation template recipe: diagramKind "image-generation", direction "lr"; use image.prompt -> image.model -> image.sampler -> optional image.upscaler -> media output; use kind:"data" edges whose protocol describes the payload (text, latent, image, PNG).
- Tournament/bracket recipe: use scorecard nodes, explicit positions, short edge routes, bold winner rows, optional flag emoji, and an accent/emblem on the final card.
- Swimlane/process/data-flow recipe: diagramKind "workflow", direction "lr"; one "process.lane" frame per role stacked vertically (explicit position/width/height), steps positioned inside their lane, edges crossing lanes are hand-offs; name the payload on data edges.
- Tree/nested/layer-stack recipe: diagramKind "general"; trees use "general.component" nodes with kind:"reporting" step edges and direction "tb"; nesting uses frames inside frames with explicit bounds; layer stacks use full-width "general.layer" frames stacked top to bottom.
- Kanban recipe: diagramKind "planning", direction "lr"; "plan.column" frames side by side with explicit bounds and WIP captions; "plan.card" nodes positioned inside columns; no start/end nodes.
- Story-map recipe: diagramKind "planning", direction "tb"; "plan.activity" nodes in a row at the top joined by flow edges, "plan.card" tasks below each activity, "plan.release" frames as full-width bands.
- State-machine recipe: diagramKind "state", direction "lr"; one "start", one or more "end", "state.state" nodes, "decision" for choice points, kind:"transition" edges labelled "event [guard]".
- Deployment recipe: diagramKind "infrastructure"; "infra.network-zone" frames contain "infra.host" frames which contain "infra.service"/"infra.database-server" artifacts; repeat an artifact for replicas.
- Medallion recipe: diagramKind "infrastructure", direction "lr"; three "infra.data-layer" frames (Bronze, Silver, Gold) side by side with "infra.storage" nodes inside and kind:"data" edges between tiers.

Rules: choose exactly one diagramKind that matches the request; ids must be unique across the whole document; every edge source/target must reference an existing node id in the same flow; every sourceHandle/targetHandle must exist on that node; keep labels short; use "tb" for organization hierarchies and "lr" for most other diagrams; model real workflow branching with condition/switch rather than a linear chain; do not add workflow-only Start/End nodes to non-workflow diagrams.`
