# Generates src/data/templates/worldCup.ts — Tour 5 as score-card nodes with
# the real 2026 World Cup knockout results (source: FIFA, through Jul 19).
import json

T = {
    'CAN': ('🇨🇦', 'Canada'), 'RSA': ('🇿🇦', 'South Africa'),
    'MAR': ('🇲🇦', 'Morocco'), 'NED': ('🇳🇱', 'Netherlands'),
    'PAR': ('🇵🇾', 'Paraguay'), 'GER': ('🇩🇪', 'Germany'),
    'FRA': ('🇫🇷', 'France'), 'SWE': ('🇸🇪', 'Sweden'),
    'POR': ('🇵🇹', 'Portugal'), 'CRO': ('🇭🇷', 'Croatia'),
    'ESP': ('🇪🇸', 'Spain'), 'AUT': ('🇦🇹', 'Austria'),
    'USA': ('🇺🇸', 'United States'), 'BIH': ('🇧🇦', 'Bosnia & Herz.'),
    'BEL': ('🇧🇪', 'Belgium'), 'SEN': ('🇸🇳', 'Senegal'),
    'BRA': ('🇧🇷', 'Brazil'), 'JPN': ('🇯🇵', 'Japan'),
    'NOR': ('🇳🇴', 'Norway'), 'CIV': ('🇨🇮', 'Ivory Coast'),
    'MEX': ('🇲🇽', 'Mexico'), 'ECU': ('🇪🇨', 'Ecuador'),
    'ENG': ('🏴\U000E0067\U000E0062\U000E0065\U000E006E\U000E0067\U000E007F', 'England'),
    'COD': ('🇨🇩', 'DR Congo'),
    'ARG': ('🇦🇷', 'Argentina'), 'CPV': ('🇨🇻', 'Cape Verde'),
    'EGY': ('🇪🇬', 'Egypt'), 'AUS': ('🇦🇺', 'Australia'),
    'SUI': ('🇨🇭', 'Switzerland'), 'ALG': ('🇩🇿', 'Algeria'),
    'COL': ('🇨🇴', 'Colombia'), 'GHA': ('🇬🇭', 'Ghana'),
}

nodes, edges = [], []

def card_node(nid, x, y, header, tag, rows, label, *, emblem=None, accent=False, caption=None):
    params = {'header': header, 'tag': tag, 'rows': rows}
    if caption:
        params['caption'] = caption
    if emblem:
        params['emblem'] = emblem
    if accent:
        params['accent'] = True
    nodes.append({
        'id': nid, 'type': 'scorecard', 'position': {'x': x, 'y': y},
        'data': {'label': label, 'nodeType': 'scorecard', 'params': params},
    })

def team_row(code, value=None, bold=False):
    row = {'icon': T[code][0], 'label': T[code][1]}
    if value is not None:
        row['value'] = value
    if bold:
        row['bold'] = True
    return row

def match_node(nid, x, y, venue, tag, a, b, label_prefix, **kw):
    (ca, sa, wa), (cb, sb, wb) = a, b
    card_node(nid, x, y, venue, tag,
              [team_row(ca, sa, wa), team_row(cb, sb, wb)],
              f"{label_prefix} · {T[ca][1]} v {T[cb][1]}", **kw)

def edge(src, dst, right_half=False):
    sh, th = ('left', 'right') if right_half else ('right', 'left')
    edges.append({'id': f'e_{src}_{dst}', 'source': src, 'target': dst,
                  'sourceHandle': sh, 'targetHandle': th})

# ─ Round of 32, real results (Jun 28 – Jul 3).
FT, PEN, AET = 'Full time', 'Penalties', 'Extra time'
r32_left = [
    ('m1', 'Los Angeles', FT, ('RSA', '0', False), ('CAN', '1', True)),
    ('m2', 'Monterrey', PEN, ('NED', '1 (2)', False), ('MAR', '1 (3)', True)),
    ('m3', 'Boston', PEN, ('GER', '1 (3)', False), ('PAR', '1 (4)', True)),
    ('m4', 'New York', FT, ('FRA', '3', True), ('SWE', '0', False)),
    ('m5', 'Toronto', FT, ('POR', '2', True), ('CRO', '1', False)),
    ('m6', 'Los Angeles', FT, ('ESP', '3', True), ('AUT', '0', False)),
    ('m7', 'San Francisco', FT, ('USA', '2', True), ('BIH', '0', False)),
    ('m8', 'Seattle', AET, ('BEL', '3', True), ('SEN', '2', False)),
]
r32_right = [
    ('m9', 'Houston', FT, ('BRA', '2', True), ('JPN', '1', False)),
    ('m10', 'Dallas', FT, ('CIV', '1', False), ('NOR', '2', True)),
    ('m11', 'Mexico City', FT, ('MEX', '2', True), ('ECU', '0', False)),
    ('m12', 'Atlanta', FT, ('ENG', '2', True), ('COD', '1', False)),
    ('m13', 'Miami', AET, ('ARG', '3', True), ('CPV', '2', False)),
    ('m14', 'Dallas', PEN, ('AUS', '1 (2)', False), ('EGY', '1 (4)', True)),
    ('m15', 'Vancouver', FT, ('SUI', '2', True), ('ALG', '0', False)),
    ('m16', 'Kansas City', FT, ('COL', '1', True), ('GHA', '0', False)),
]
for i, (nid, venue, tag, a, b) in enumerate(r32_left):
    match_node(nid, 0, i * 140, venue, tag, a, b, 'R32')
for i, (nid, venue, tag, a, b) in enumerate(r32_right):
    match_node(nid, 3800, i * 140, venue, tag, a, b, 'R32')

# ─ Round of 16, real results (Jul 4 – Jul 7).
r16_left = [
    ('r16_l1', 'Houston', FT, ('CAN', '0', False), ('MAR', '3', True)),
    ('r16_l2', 'Philadelphia', FT, ('PAR', '0', False), ('FRA', '1', True)),
    ('r16_l3', 'Dallas', FT, ('POR', '0', False), ('ESP', '1', True)),
    ('r16_l4', 'Seattle', FT, ('USA', '1', False), ('BEL', '4', True)),
]
r16_right = [
    ('r16_r1', 'New York', FT, ('BRA', '1', False), ('NOR', '2', True)),
    ('r16_r2', 'Mexico City', FT, ('MEX', '2', False), ('ENG', '3', True)),
    ('r16_r3', 'Atlanta', FT, ('ARG', '3', True), ('EGY', '2', False)),
    ('r16_r4', 'Vancouver', PEN, ('SUI', '0 (4)', True), ('COL', '0 (3)', False)),
]
for i, (nid, venue, tag, a, b) in enumerate(r16_left):
    match_node(nid, 380, 70 + i * 280, venue, tag, a, b, 'R16')
for i, (nid, venue, tag, a, b) in enumerate(r16_right):
    match_node(nid, 3420, 70 + i * 280, venue, tag, a, b, 'R16')

# ─ Quarter-finals, real results (Jul 9 – Jul 11).
match_node('qf_l1', 760, 210, 'Boston', FT, ('FRA', '2', True), ('MAR', '0', False), 'QF')
match_node('qf_l2', 760, 770, 'Los Angeles', FT, ('ESP', '2', True), ('BEL', '1', False), 'QF')
match_node('qf_r1', 3040, 210, 'Miami', AET, ('NOR', '1', False), ('ENG', '2', True), 'QF')
match_node('qf_r2', 3040, 770, 'Kansas City', AET, ('ARG', '3', True), ('SUI', '1', False), 'QF')

# ─ Semi-finals, real results (Jul 14 – Jul 15).
match_node('sf_l', 1140, 490, 'Dallas', FT, ('FRA', '0', False), ('ESP', '2', True), 'SF')
match_node('sf_r', 2660, 490, 'Atlanta', FT, ('ENG', '1', False), ('ARG', '2', True), 'SF')

# ─ Final and 3rd-place play-off, real results (Jul 18 – Jul 19).
match_node('final', 1900, 450, 'New York', AET,
           ('ESP', '1', True), ('ARG', '0', False), 'Final',
           emblem='🏆', accent=True)
match_node('third', 1900, 700, 'Miami', FT,
           ('FRA', '4', False), ('ENG', '6', True), '3rd place',
           caption='3RD-PLACE')

# ─ Winner-path edges (mirrored halves) + losers into the 3rd-place match.
for feeders, target in [
    (('m1', 'm2'), 'r16_l1'), (('m3', 'm4'), 'r16_l2'),
    (('m5', 'm6'), 'r16_l3'), (('m7', 'm8'), 'r16_l4'),
    (('r16_l1', 'r16_l2'), 'qf_l1'), (('r16_l3', 'r16_l4'), 'qf_l2'),
    (('qf_l1', 'qf_l2'), 'sf_l'),
]:
    for src in feeders:
        edge(src, target)
for feeders, target in [
    (('m9', 'm10'), 'r16_r1'), (('m11', 'm12'), 'r16_r2'),
    (('m13', 'm14'), 'r16_r3'), (('m15', 'm16'), 'r16_r4'),
    (('r16_r1', 'r16_r2'), 'qf_r1'), (('r16_r3', 'r16_r4'), 'qf_r2'),
    (('qf_r1', 'qf_r2'), 'sf_r'),
]:
    for src in feeders:
        edge(src, target, right_half=True)
edge('sf_l', 'final')
edge('sf_r', 'final', right_half=True)
edge('sf_l', 'third')
edge('sf_r', 'third', right_half=True)

# ─ Round header notes above each column.
for nid, x, text in [
    ('note_r32_l', 0, 'Round of 32'), ('note_r16_l', 380, 'Round of 16'),
    ('note_qf_l', 760, 'Quarter-finals'), ('note_sf_l', 1140, 'Semi-finals'),
    ('note_final', 1900, 'Final'),
    ('note_sf_r', 2660, 'Semi-finals'), ('note_qf_r', 3040, 'Quarter-finals'),
    ('note_r16_r', 3420, 'Round of 16'), ('note_r32_r', 3800, 'Round of 32'),
]:
    nodes.append({
        'id': nid, 'type': 'note', 'position': {'x': x, 'y': -150},
        'data': {'label': text, 'nodeType': 'note', 'params': {'text': text}},
    })

doc = {
    'schemaVersion': 1,
    'settings': {
        'name': 'Tour 5 · FIFA World Cup 2026',
        'version': '1.4.0',
        'description': 'Mirrored 32-team knockout bracket built from score-card nodes: venue header, flag/name/score rows, winner in bold, gold final with trophy and a 3rd-place match. Complete tournament results, with Spain crowned world champions.',
    },
    'flows': {
        'root': {
            'settings': {'direction': 'lr'},
            'nodes': nodes,
            'edges': edges,
        }
    },
}

header = '''import type { WorkflowDoc } from '@/types/workflow'

/**
 * Tour 5 — a real-world showcase: the 2026 FIFA World Cup knockout bracket
 * built from score-card nodes (one card per match: venue header, flag/name/
 * score rows, winner bold, loser greyed). Mirrored 16-left/16-right layout
 * converging on a gold Final card with trophy, plus a 3rd-place match.
 * Complete tournament results (per FIFA, through the final on Jul 19 2026),
 * with Spain crowned world champions after beating Argentina in extra time.
 * Regenerated by scripts/generate-worldcup-template.py; match data is also
 * editable per-node in the inspector's Behavior tab.
 */
export const worldCup: WorkflowDoc = '''

with open('src/data/templates/worldCup.ts', 'w') as f:
    f.write(header + json.dumps(doc, ensure_ascii=False, indent=2) + '\n')

print('nodes:', len(nodes), 'edges:', len(edges))
