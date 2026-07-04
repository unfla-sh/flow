import type { WorkflowDoc } from '@/types/workflow'

/**
 * Tour 5 — a real-world showcase: the 2026 FIFA World Cup knockout bracket.
 * Mirrored left/right layout converging on the Final, real Round-of-32
 * results, football icons and directional mid-side handles. Round of 16
 * onward is left as TBD (the tournament is still in progress).
 */
export const worldCup: WorkflowDoc = {
  "schemaVersion": 1,
  "settings": {
    "name": "Tour 5 · FIFA World Cup 2026",
    "version": "1.0.0",
    "description": "Mirrored 32-team knockout bracket (16 left / 16 right, Final in the centre) with the real Round-of-32 results. Shows ball/goal/trophy icons, directional side-handles and a symmetric layout."
  },
  "flows": {
    "root": {
      "settings": {
        "direction": "lr"
      },
      "nodes": [
        {
          "id": "r32_1",
          "type": "data",
          "position": {
            "x": 0,
            "y": 0
          },
          "data": {
            "label": "🇨🇦 Canada",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_2",
          "type": "data",
          "position": {
            "x": 0,
            "y": 70
          },
          "data": {
            "label": "🇿🇦 South Africa",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_1",
          "type": "data",
          "position": {
            "x": 380,
            "y": 35.0
          },
          "data": {
            "label": "🇨🇦 Canada  1–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_3",
          "type": "data",
          "position": {
            "x": 0,
            "y": 140
          },
          "data": {
            "label": "🇲🇦 Morocco",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_4",
          "type": "data",
          "position": {
            "x": 0,
            "y": 210
          },
          "data": {
            "label": "🇳🇱 Netherlands",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_2",
          "type": "data",
          "position": {
            "x": 380,
            "y": 175.0
          },
          "data": {
            "label": "🇲🇦 Morocco  1–1 (3–2 pens)",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_5",
          "type": "data",
          "position": {
            "x": 0,
            "y": 280
          },
          "data": {
            "label": "🇵🇾 Paraguay",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_6",
          "type": "data",
          "position": {
            "x": 0,
            "y": 350
          },
          "data": {
            "label": "🇩🇪 Germany",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_3",
          "type": "data",
          "position": {
            "x": 380,
            "y": 315.0
          },
          "data": {
            "label": "🇵🇾 Paraguay  1–1 (4–3 pens)",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_7",
          "type": "data",
          "position": {
            "x": 0,
            "y": 420
          },
          "data": {
            "label": "🇫🇷 France",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_8",
          "type": "data",
          "position": {
            "x": 0,
            "y": 490
          },
          "data": {
            "label": "🇸🇪 Sweden",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_4",
          "type": "data",
          "position": {
            "x": 380,
            "y": 455.0
          },
          "data": {
            "label": "🇫🇷 France  3–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_9",
          "type": "data",
          "position": {
            "x": 0,
            "y": 560
          },
          "data": {
            "label": "🇧🇷 Brazil",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_10",
          "type": "data",
          "position": {
            "x": 0,
            "y": 630
          },
          "data": {
            "label": "🇯🇵 Japan",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_5",
          "type": "data",
          "position": {
            "x": 380,
            "y": 595.0
          },
          "data": {
            "label": "🇧🇷 Brazil  2–1",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_11",
          "type": "data",
          "position": {
            "x": 0,
            "y": 700
          },
          "data": {
            "label": "🇳🇴 Norway",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_12",
          "type": "data",
          "position": {
            "x": 0,
            "y": 770
          },
          "data": {
            "label": "🇨🇮 Ivory Coast",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_6",
          "type": "data",
          "position": {
            "x": 380,
            "y": 735.0
          },
          "data": {
            "label": "🇳🇴 Norway  2–1",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_13",
          "type": "data",
          "position": {
            "x": 0,
            "y": 840
          },
          "data": {
            "label": "🇲🇽 Mexico",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_14",
          "type": "data",
          "position": {
            "x": 0,
            "y": 910
          },
          "data": {
            "label": "🇪🇨 Ecuador",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_7",
          "type": "data",
          "position": {
            "x": 380,
            "y": 875.0
          },
          "data": {
            "label": "🇲🇽 Mexico  2–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_15",
          "type": "data",
          "position": {
            "x": 0,
            "y": 980
          },
          "data": {
            "label": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_16",
          "type": "data",
          "position": {
            "x": 0,
            "y": 1050
          },
          "data": {
            "label": "🇨🇩 DR Congo",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_8",
          "type": "data",
          "position": {
            "x": 380,
            "y": 1015.0
          },
          "data": {
            "label": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England  2–1",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_17",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 0
          },
          "data": {
            "label": "🇵🇹 Portugal",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_18",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 70
          },
          "data": {
            "label": "🇭🇷 Croatia",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_9",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 35.0
          },
          "data": {
            "label": "🇵🇹 Portugal  2–1",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_19",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 140
          },
          "data": {
            "label": "🇪🇸 Spain",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_20",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 210
          },
          "data": {
            "label": "🇦🇹 Austria",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_10",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 175.0
          },
          "data": {
            "label": "🇪🇸 Spain  3–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_21",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 280
          },
          "data": {
            "label": "🇺🇸 United States",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_22",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 350
          },
          "data": {
            "label": "🇧🇦 Bosnia & Herz.",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_11",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 315.0
          },
          "data": {
            "label": "🇺🇸 United States  2–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_23",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 420
          },
          "data": {
            "label": "🇧🇪 Belgium",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_24",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 490
          },
          "data": {
            "label": "🇸🇳 Senegal",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_12",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 455.0
          },
          "data": {
            "label": "🇧🇪 Belgium  3–2 (AET)",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_25",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 560
          },
          "data": {
            "label": "🇦🇷 Argentina",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_26",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 630
          },
          "data": {
            "label": "🇨🇻 Cape Verde",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_13",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 595.0
          },
          "data": {
            "label": "🇦🇷 Argentina  3–2 (AET)",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_27",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 700
          },
          "data": {
            "label": "🇪🇬 Egypt",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_28",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 770
          },
          "data": {
            "label": "🇦🇺 Australia",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_14",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 735.0
          },
          "data": {
            "label": "🇪🇬 Egypt  1–1 (4–2 pens)",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_29",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 840
          },
          "data": {
            "label": "🇨🇭 Switzerland",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_30",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 910
          },
          "data": {
            "label": "🇩🇿 Algeria",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_15",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 875.0
          },
          "data": {
            "label": "🇨🇭 Switzerland  2–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "r32_31",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 980
          },
          "data": {
            "label": "🇨🇴 Colombia",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r32_32",
          "type": "data",
          "position": {
            "x": 3800,
            "y": 1050
          },
          "data": {
            "label": "🇬🇭 Ghana",
            "nodeType": "data",
            "params": {},
            "icon": "ball"
          }
        },
        {
          "id": "r16_16",
          "type": "data",
          "position": {
            "x": 3420,
            "y": 1015.0
          },
          "data": {
            "label": "🇨🇴 Colombia  1–0",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_1",
          "type": "data",
          "position": {
            "x": 760,
            "y": 105.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_2",
          "type": "data",
          "position": {
            "x": 760,
            "y": 385.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_3",
          "type": "data",
          "position": {
            "x": 760,
            "y": 665.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_4",
          "type": "data",
          "position": {
            "x": 760,
            "y": 945.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_5",
          "type": "data",
          "position": {
            "x": 3040,
            "y": 105.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_6",
          "type": "data",
          "position": {
            "x": 3040,
            "y": 385.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_7",
          "type": "data",
          "position": {
            "x": 3040,
            "y": 665.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "qf_8",
          "type": "data",
          "position": {
            "x": 3040,
            "y": 945.0
          },
          "data": {
            "label": "Quarter-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "sf_1",
          "type": "data",
          "position": {
            "x": 1140,
            "y": 245.0
          },
          "data": {
            "label": "Semi-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "sf_2",
          "type": "data",
          "position": {
            "x": 1140,
            "y": 805.0
          },
          "data": {
            "label": "Semi-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "sf_3",
          "type": "data",
          "position": {
            "x": 2660,
            "y": 245.0
          },
          "data": {
            "label": "Semi-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "sf_4",
          "type": "data",
          "position": {
            "x": 2660,
            "y": 805.0
          },
          "data": {
            "label": "Semi-final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "final_1",
          "type": "data",
          "position": {
            "x": 1520,
            "y": 525.0
          },
          "data": {
            "label": "Final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "final_2",
          "type": "data",
          "position": {
            "x": 2280,
            "y": 525.0
          },
          "data": {
            "label": "Final · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "goal"
          }
        },
        {
          "id": "champ",
          "type": "data",
          "position": {
            "x": 1900,
            "y": 525.0
          },
          "data": {
            "label": "🏆 Champion · TBD",
            "nodeType": "data",
            "params": {},
            "icon": "trophy"
          }
        },
        {
          "id": "note_r32",
          "type": "note",
          "position": {
            "x": 0,
            "y": -150
          },
          "data": {
            "label": "Round of 32",
            "nodeType": "note",
            "params": {
              "text": "Round of 32"
            }
          }
        },
        {
          "id": "note_r16",
          "type": "note",
          "position": {
            "x": 380,
            "y": -150
          },
          "data": {
            "label": "Round of 16",
            "nodeType": "note",
            "params": {
              "text": "Round of 16"
            }
          }
        },
        {
          "id": "note_qf",
          "type": "note",
          "position": {
            "x": 760,
            "y": -150
          },
          "data": {
            "label": "Quarter-finals",
            "nodeType": "note",
            "params": {
              "text": "Quarter-finals"
            }
          }
        },
        {
          "id": "note_sf",
          "type": "note",
          "position": {
            "x": 1140,
            "y": -150
          },
          "data": {
            "label": "Semi-finals",
            "nodeType": "note",
            "params": {
              "text": "Semi-finals"
            }
          }
        },
        {
          "id": "note_final",
          "type": "note",
          "position": {
            "x": 1900,
            "y": -150
          },
          "data": {
            "label": "Final",
            "nodeType": "note",
            "params": {
              "text": "Final"
            }
          }
        }
      ],
      "edges": [
        {
          "id": "e_r32_1_r16_1",
          "source": "r32_1",
          "target": "r16_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_2_r16_1",
          "source": "r32_2",
          "target": "r16_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_3_r16_2",
          "source": "r32_3",
          "target": "r16_2",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_4_r16_2",
          "source": "r32_4",
          "target": "r16_2",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_5_r16_3",
          "source": "r32_5",
          "target": "r16_3",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_6_r16_3",
          "source": "r32_6",
          "target": "r16_3",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_7_r16_4",
          "source": "r32_7",
          "target": "r16_4",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_8_r16_4",
          "source": "r32_8",
          "target": "r16_4",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_9_r16_5",
          "source": "r32_9",
          "target": "r16_5",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_10_r16_5",
          "source": "r32_10",
          "target": "r16_5",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_11_r16_6",
          "source": "r32_11",
          "target": "r16_6",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_12_r16_6",
          "source": "r32_12",
          "target": "r16_6",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_13_r16_7",
          "source": "r32_13",
          "target": "r16_7",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_14_r16_7",
          "source": "r32_14",
          "target": "r16_7",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_15_r16_8",
          "source": "r32_15",
          "target": "r16_8",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_16_r16_8",
          "source": "r32_16",
          "target": "r16_8",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r32_17_r16_9",
          "source": "r32_17",
          "target": "r16_9",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_18_r16_9",
          "source": "r32_18",
          "target": "r16_9",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_19_r16_10",
          "source": "r32_19",
          "target": "r16_10",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_20_r16_10",
          "source": "r32_20",
          "target": "r16_10",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_21_r16_11",
          "source": "r32_21",
          "target": "r16_11",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_22_r16_11",
          "source": "r32_22",
          "target": "r16_11",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_23_r16_12",
          "source": "r32_23",
          "target": "r16_12",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_24_r16_12",
          "source": "r32_24",
          "target": "r16_12",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_25_r16_13",
          "source": "r32_25",
          "target": "r16_13",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_26_r16_13",
          "source": "r32_26",
          "target": "r16_13",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_27_r16_14",
          "source": "r32_27",
          "target": "r16_14",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_28_r16_14",
          "source": "r32_28",
          "target": "r16_14",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_29_r16_15",
          "source": "r32_29",
          "target": "r16_15",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_30_r16_15",
          "source": "r32_30",
          "target": "r16_15",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_31_r16_16",
          "source": "r32_31",
          "target": "r16_16",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r32_32_r16_16",
          "source": "r32_32",
          "target": "r16_16",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_1_qf_1",
          "source": "r16_1",
          "target": "qf_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_2_qf_1",
          "source": "r16_2",
          "target": "qf_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_3_qf_2",
          "source": "r16_3",
          "target": "qf_2",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_4_qf_2",
          "source": "r16_4",
          "target": "qf_2",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_5_qf_3",
          "source": "r16_5",
          "target": "qf_3",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_6_qf_3",
          "source": "r16_6",
          "target": "qf_3",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_7_qf_4",
          "source": "r16_7",
          "target": "qf_4",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_8_qf_4",
          "source": "r16_8",
          "target": "qf_4",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_r16_9_qf_5",
          "source": "r16_9",
          "target": "qf_5",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_10_qf_5",
          "source": "r16_10",
          "target": "qf_5",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_11_qf_6",
          "source": "r16_11",
          "target": "qf_6",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_12_qf_6",
          "source": "r16_12",
          "target": "qf_6",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_13_qf_7",
          "source": "r16_13",
          "target": "qf_7",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_14_qf_7",
          "source": "r16_14",
          "target": "qf_7",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_15_qf_8",
          "source": "r16_15",
          "target": "qf_8",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_r16_16_qf_8",
          "source": "r16_16",
          "target": "qf_8",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_qf_1_sf_1",
          "source": "qf_1",
          "target": "sf_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_qf_2_sf_1",
          "source": "qf_2",
          "target": "sf_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_qf_3_sf_2",
          "source": "qf_3",
          "target": "sf_2",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_qf_4_sf_2",
          "source": "qf_4",
          "target": "sf_2",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_qf_5_sf_3",
          "source": "qf_5",
          "target": "sf_3",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_qf_6_sf_3",
          "source": "qf_6",
          "target": "sf_3",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_qf_7_sf_4",
          "source": "qf_7",
          "target": "sf_4",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_qf_8_sf_4",
          "source": "qf_8",
          "target": "sf_4",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_sf_1_final_1",
          "source": "sf_1",
          "target": "final_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_sf_2_final_1",
          "source": "sf_2",
          "target": "final_1",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_sf_3_final_2",
          "source": "sf_3",
          "target": "final_2",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_sf_4_final_2",
          "source": "sf_4",
          "target": "final_2",
          "sourceHandle": "left",
          "targetHandle": "right"
        },
        {
          "id": "e_final_1_champ",
          "source": "final_1",
          "target": "champ",
          "sourceHandle": "right",
          "targetHandle": "left"
        },
        {
          "id": "e_final_2_champ",
          "source": "final_2",
          "target": "champ",
          "sourceHandle": "left",
          "targetHandle": "right"
        }
      ]
    }
  }
}
