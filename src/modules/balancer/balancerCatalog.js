/**
 * balancerCatalog.js
 * ════════════════════════════════════════════════════════════════════════════════
 * База топологий конвейерных балансировщиков Satisfactory.
 * Включает точные координаты и цветовую разводку дуг Безье.
 * Расположены в строгом математическом порядке (входы: 1..6, выходы: 1..8).
 * ════════════════════════════════════════════════════════════════════════════════
 */

export const BALANCERS = [
  // ══════════════════════════════════════════════════════════════════════════════
  // 1 ВХОД (РАСПРЕДЕЛИТЕЛИ)
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── 1:2 ────────────────────────────────────────────────────────────────────
  {
    id: '1to2',
    name: 'Балансировщик 1:2',
    ratio: '1 : 2',
    inputs: 1,
    outputs: 2,
    splitters: 1,
    mergers: 0,
    description: 'Разделение одного входящего потока на 2 равные части по 50%.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 150 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'spl_1', type: 'balancerSplitter', position: { x: 220, y: 140 }, data: {} },
      { id: 'out_1', type: 'balancerOutput', position: { x: 440, y: 70 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 440, y: 230 }, data: { label: 'Output 2', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in_spl', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl_out1', source: 'spl_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl_out2', source: 'spl_1', sourceHandle: 'out-2', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 1:3 ────────────────────────────────────────────────────────────────────
  {
    id: '1to3',
    name: 'Балансировщик 1:3',
    ratio: '1 : 3',
    inputs: 1,
    outputs: 3,
    splitters: 1,
    mergers: 0,
    description: 'Разделение одного потока на 3 равные части по 33.3%.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 150 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'spl_1', type: 'balancerSplitter', position: { x: 220, y: 140 }, data: {} },
      { id: 'out_1', type: 'balancerOutput', position: { x: 440, y: 40 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 440, y: 150 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 440, y: 260 }, data: { label: 'Output 3', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in_spl', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl_out1', source: 'spl_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl_out2', source: 'spl_1', sourceHandle: 'out-1', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl_out3', source: 'spl_1', sourceHandle: 'out-2', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 1:4 ────────────────────────────────────────────────────────────────────
  {
    id: '1to4',
    name: 'Балансировщик 1:4',
    ratio: '1 : 4',
    inputs: 1,
    outputs: 4,
    splitters: 3,
    mergers: 0,
    description: 'Каскадный разветвитель 1 входа на 4 выхода по 25%.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 180 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'spl_root', type: 'balancerSplitter', position: { x: 190, y: 170 }, data: {} },
      { id: 'spl_top', type: 'balancerSplitter', position: { x: 370, y: 80 }, data: {} },
      { id: 'spl_bot', type: 'balancerSplitter', position: { x: 370, y: 260 }, data: {} },
      { id: 'out_1', type: 'balancerOutput', position: { x: 560, y: 30 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 560, y: 130 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 560, y: 220 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 560, y: 310 }, data: { label: 'Output 4', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in_root', source: 'in_1', sourceHandle: 'out', target: 'spl_root', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_root_top', source: 'spl_root', sourceHandle: 'out', target: 'spl_top', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_root_bot', source: 'spl_root', sourceHandle: 'out-2', target: 'spl_bot', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_top_out1', source: 'spl_top', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_top_out2', source: 'spl_top', sourceHandle: 'out-2', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_bot_out3', source: 'spl_bot', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_bot_out4', source: 'spl_bot', sourceHandle: 'out-2', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 1:5 ────────────────────────────────────────────────────────────────────
  {
    id: '1to5',
    name: 'Балансировщик 1:5',
    ratio: '1 : 5',
    inputs: 1,
    outputs: 5,
    splitters: 3,
    mergers: 1,
    description: 'Идеальное деление 1 ленты на 5 равных потоков по 20% с петлей рециркуляции.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 40, y: 150 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'mrg_in', type: 'balancerMerger', position: { x: 170, y: 140 }, data: {} },
      { id: 'spl_root', type: 'balancerSplitter', position: { x: 310, y: 140 }, data: {} },
      { id: 'spl_top', type: 'balancerSplitter', position: { x: 470, y: 60 }, data: {} },
      { id: 'spl_bot', type: 'balancerSplitter', position: { x: 470, y: 240 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 670, y: 20 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 670, y: 90 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 670, y: 160 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 670, y: 230 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 670, y: 300 }, data: { label: 'Output 5', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in_mrg', source: 'in_1', sourceHandle: 'out', target: 'mrg_in', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_mrg_spl', source: 'mrg_in', sourceHandle: 'out', target: 'spl_root', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_root_top', source: 'spl_root', sourceHandle: 'out', target: 'spl_top', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_root_bot', source: 'spl_root', sourceHandle: 'out-2', target: 'spl_bot', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_top_1', source: 'spl_top', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_top_2', source: 'spl_top', sourceHandle: 'out-1', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_top_3', source: 'spl_top', sourceHandle: 'out-2', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },

      { id: 'e_bot_4', source: 'spl_bot', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_bot_5', source: 'spl_bot', sourceHandle: 'out-1', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      // Петля возврата 6-й ветки обратно на входной мерджер
      { id: 'e_bot_loop', source: 'spl_bot', sourceHandle: 'out-2', target: 'mrg_in', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#f59e0b', curvature: 0.7 } },
    ]
  },

  // ─── 1:6 ────────────────────────────────────────────────────────────────────
  {
    id: '1to6',
    name: 'Балансировщик 1:6',
    ratio: '1 : 6',
    inputs: 1,
    outputs: 6,
    splitters: 3,
    mergers: 0,
    description: 'Разделение 1 входящей ленты на 6 симметричных линий по 16.6%.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 220 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'spl_root', type: 'balancerSplitter', position: { x: 200, y: 210 }, data: {} },
      { id: 'spl_top', type: 'balancerSplitter', position: { x: 380, y: 100 }, data: {} },
      { id: 'spl_bot', type: 'balancerSplitter', position: { x: 380, y: 320 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 580, y: 40 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 580, y: 110 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 580, y: 180 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 580, y: 260 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 580, y: 330 }, data: { label: 'Output 5', color: '#60a5fa' } },
      { id: 'out_6', type: 'balancerOutput', position: { x: 580, y: 400 }, data: { label: 'Output 6', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in_root', source: 'in_1', sourceHandle: 'out', target: 'spl_root', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_root_top', source: 'spl_root', sourceHandle: 'out', target: 'spl_top', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_root_bot', source: 'spl_root', sourceHandle: 'out-2', target: 'spl_bot', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_top_1', source: 'spl_top', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_top_2', source: 'spl_top', sourceHandle: 'out-1', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_top_3', source: 'spl_top', sourceHandle: 'out-2', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },

      { id: 'e_bot_4', source: 'spl_bot', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_bot_5', source: 'spl_bot', sourceHandle: 'out-1', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_bot_6', source: 'spl_bot', sourceHandle: 'out-2', target: 'out_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 1:8 ────────────────────────────────────────────────────────────────────
  {
    id: '1to8',
    name: 'Балансировщик 1:8',
    ratio: '1 : 8',
    inputs: 1,
    outputs: 8,
    splitters: 7,
    mergers: 0,
    description: 'Двоичное дерево сплиттеров на 8 выходов по 12.5% каждый.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 40, y: 250 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 's_0', type: 'balancerSplitter', position: { x: 160, y: 240 }, data: {} },
      { id: 's_1', type: 'balancerSplitter', position: { x: 300, y: 120 }, data: {} },
      { id: 's_2', type: 'balancerSplitter', position: { x: 300, y: 360 }, data: {} },
      { id: 's_3', type: 'balancerSplitter', position: { x: 460, y: 60 }, data: {} },
      { id: 's_4', type: 'balancerSplitter', position: { x: 460, y: 180 }, data: {} },
      { id: 's_5', type: 'balancerSplitter', position: { x: 460, y: 300 }, data: {} },
      { id: 's_6', type: 'balancerSplitter', position: { x: 460, y: 420 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 640, y: 30 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 640, y: 90 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 640, y: 150 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 640, y: 210 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 640, y: 270 }, data: { label: 'Output 5', color: '#60a5fa' } },
      { id: 'out_6', type: 'balancerOutput', position: { x: 640, y: 330 }, data: { label: 'Output 6', color: '#60a5fa' } },
      { id: 'out_7', type: 'balancerOutput', position: { x: 640, y: 390 }, data: { label: 'Output 7', color: '#60a5fa' } },
      { id: 'out_8', type: 'balancerOutput', position: { x: 640, y: 450 }, data: { label: 'Output 8', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in', source: 'in_1', sourceHandle: 'out', target: 's_0', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s0_1', source: 's_0', sourceHandle: 'out', target: 's_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s0_2', source: 's_0', sourceHandle: 'out-2', target: 's_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_s1_3', source: 's_1', sourceHandle: 'out', target: 's_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_4', source: 's_1', sourceHandle: 'out-2', target: 's_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s2_5', source: 's_2', sourceHandle: 'out', target: 's_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s2_6', source: 's_2', sourceHandle: 'out-2', target: 's_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_s3_o1', source: 's_3', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s3_o2', source: 's_3', sourceHandle: 'out-2', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s4_o3', source: 's_4', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s4_o4', source: 's_4', sourceHandle: 'out-2', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s5_o5', source: 's_5', sourceHandle: 'out', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s5_o6', source: 's_5', sourceHandle: 'out-2', target: 'out_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s6_o7', source: 's_6', sourceHandle: 'out', target: 'out_7', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_s6_o8', source: 's_6', sourceHandle: 'out-2', target: 'out_8', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 2 ВХОДА
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── 2:1 ────────────────────────────────────────────────────────────────────
  {
    id: '2to1',
    name: 'Балансировщик 2:1',
    ratio: '2 : 1',
    inputs: 2,
    outputs: 1,
    splitters: 0,
    mergers: 1,
    description: 'Объединение 2 входящих лент в 1 суммарный скоростной поток.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 70 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 210 }, data: { label: 'Input 2', color: '#22c55e' } },
      { id: 'mrg_1', type: 'balancerMerger', position: { x: 230, y: 130 }, data: {} },
      { id: 'out_1', type: 'balancerOutput', position: { x: 440, y: 140 }, data: { label: 'Output 1', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1_mrg', source: 'in_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2_mrg', source: 'in_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_mrg_out', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 2:2 (Точно как на Фото 1) ───────────────────────────────────────────────
  {
    id: '2to2',
    name: 'Балансировщик 2:2',
    ratio: '2 : 2',
    inputs: 2,
    outputs: 2,
    splitters: 2,
    mergers: 2,
    description: 'Классический симметричный балансировщик 2 входа на 2 выхода (50/50%).',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 100 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 280 }, data: { label: 'Input 2', color: '#22c55e' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 200, y: 90 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 200, y: 270 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 420, y: 90 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 420, y: 270 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 100 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 280 }, data: { label: 'Output 2', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1_spl1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2_spl2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_spl1_mrg1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl2_mrg2', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_spl1_mrg2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },
      { id: 'e_spl2_mrg1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.5 } },

      { id: 'e_mrg1_out1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_mrg2_out2', source: 'mrg_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 2:3 ────────────────────────────────────────────────────────────────────
  {
    id: '2to3',
    name: 'Балансировщик 2:3',
    ratio: '2 : 3',
    inputs: 2,
    outputs: 3,
    splitters: 3,
    mergers: 2,
    description: 'Равномерное распределение двух входящих лент на три исходящие (по 33.3%).',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 100 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 280 }, data: { label: 'Input 2', color: '#22c55e' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 90 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 270 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 370, y: 90 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 370, y: 270 }, data: {} },

      { id: 'spl_3', type: 'balancerSplitter', position: { x: 520, y: 180 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 680, y: 80 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 680, y: 190 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 680, y: 300 }, data: { label: 'Output 3', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1_spl1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2_spl2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_spl1_mrg1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl1_mrg2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },

      { id: 'e_spl2_mrg1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.5 } },
      { id: 'e_spl2_mrg2', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_mrg1_out1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_mrg1_spl3', source: 'mrg_1', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_mrg2_spl3', source: 'mrg_2', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_mrg2_out3', source: 'mrg_2', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },

      { id: 'e_spl3_out2', source: 'spl_3', sourceHandle: 'out-1', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 2:4 ────────────────────────────────────────────────────────────────────
  {
    id: '2to4',
    name: 'Балансировщик 2:4',
    ratio: '2 : 4',
    inputs: 2,
    outputs: 4,
    splitters: 4,
    mergers: 2,
    description: 'Балансировка двух линий в 4 равных потока по 25%.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 100 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 300 }, data: { label: 'Input 2', color: '#22c55e' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 90 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 290 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 370, y: 90 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 370, y: 290 }, data: {} },

      { id: 'spl_3', type: 'balancerSplitter', position: { x: 530, y: 90 }, data: {} },
      { id: 'spl_4', type: 'balancerSplitter', position: { x: 530, y: 290 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 710, y: 40 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 710, y: 140 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 710, y: 240 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 710, y: 340 }, data: { label: 'Output 4', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1_spl1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2_spl2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_spl1_mrg1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl1_mrg2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },

      { id: 'e_spl2_mrg1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.5 } },
      { id: 'e_spl2_mrg2', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_mrg1_spl3', source: 'mrg_1', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_mrg2_spl4', source: 'mrg_2', sourceHandle: 'out', target: 'spl_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },

      { id: 'e_spl3_out1', source: 'spl_3', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl3_out2', source: 'spl_3', sourceHandle: 'out-2', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl4_out3', source: 'spl_4', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl4_out4', source: 'spl_4', sourceHandle: 'out-2', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 2:5 (Точно как на Фото 2) ───────────────────────────────────────────────
  {
    id: '2to5',
    name: 'Балансировщик 2:5',
    ratio: '2 : 5',
    inputs: 2,
    outputs: 5,
    splitters: 5,
    mergers: 2,
    description: 'Разветвленный каскадный балансировщик 2 входа на 5 выходов с обратными связями.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 80 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 380 }, data: { label: 'Input 2', color: '#22c55e' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 70 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 370 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 350, y: 220 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 350, y: 460 }, data: {} },

      { id: 'spl_3', type: 'balancerSplitter', position: { x: 520, y: 140 }, data: {} },
      { id: 'spl_4', type: 'balancerSplitter', position: { x: 520, y: 310 }, data: {} },
      { id: 'spl_5', type: 'balancerSplitter', position: { x: 520, y: 550 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 720, y: 40 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 720, y: 170 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 720, y: 310 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 720, y: 470 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 720, y: 620 }, data: { label: 'Output 5', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1_spl1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2_spl2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_spl1_mrg1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl1_mrg2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },

      { id: 'e_spl2_mrg1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.5 } },
      { id: 'e_spl2_mrg2', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_mrg1_spl3', source: 'mrg_1', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_mrg1_spl4', source: 'mrg_1', sourceHandle: 'out', target: 'spl_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_mrg2_spl4', source: 'mrg_2', sourceHandle: 'out', target: 'spl_4', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#2563eb' } },
      { id: 'e_mrg2_spl5', source: 'mrg_2', sourceHandle: 'out', target: 'spl_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },

      { id: 'e_spl3_out1', source: 'spl_3', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl3_out2', source: 'spl_3', sourceHandle: 'out-2', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl4_out3', source: 'spl_4', sourceHandle: 'out-1', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl5_out4', source: 'spl_5', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_spl5_out5', source: 'spl_5', sourceHandle: 'out-2', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 3 ВХОДА
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── 3:1 ────────────────────────────────────────────────────────────────────
  {
    id: '3to1',
    name: 'Балансировщик 3:1',
    ratio: '3 : 1',
    inputs: 3,
    outputs: 1,
    splitters: 0,
    mergers: 1,
    description: 'Слияние 3 входящих лент в 1 скоростную линию через 3-портовый мерджер.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 60 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 160 }, data: { label: 'Input 2', color: '#22c55e' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 260 }, data: { label: 'Input 3', color: '#eab308' } },
      { id: 'mrg_1', type: 'balancerMerger', position: { x: 250, y: 150 }, data: {} },
      { id: 'out_1', type: 'balancerOutput', position: { x: 450, y: 160 }, data: { label: 'Output 1', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308' } },
      { id: 'e_mrg_o', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 3:2 ────────────────────────────────────────────────────────────────────
  {
    id: '3to2',
    name: 'Балансировщик 3:2',
    ratio: '3 : 2',
    inputs: 3,
    outputs: 2,
    splitters: 3,
    mergers: 2,
    description: 'Один из самых популярных балансировщиков Satisfactory: 3 бура или плавильни в 2 равные ленты.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 60 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 180 }, data: { label: 'Input 2', color: '#22c55e' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 300 }, data: { label: 'Input 3', color: '#eab308' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 50 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 170 }, data: {} },
      { id: 'spl_3', type: 'balancerSplitter', position: { x: 190, y: 290 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 420, y: 100 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 420, y: 240 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 110 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 250 }, data: { label: 'Output 2', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_s1_m1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },

      { id: 'e_s2_m1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_s2_m2', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s3_m1', source: 'spl_3', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308', curvature: 0.5 } },
      { id: 'e_s3_m2', source: 'spl_3', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_m1_o1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_o2', source: 'mrg_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 3:3 ────────────────────────────────────────────────────────────────────
  {
    id: '3to3',
    name: 'Балансировщик 3:3',
    ratio: '3 : 3',
    inputs: 3,
    outputs: 3,
    splitters: 3,
    mergers: 3,
    description: 'Полный 3x3 балансировщик лент. Равномерно смешивает потоки при любых колебаниях подачи.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 70 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 190 }, data: { label: 'Input 2', color: '#22c55e' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 310 }, data: { label: 'Input 3', color: '#eab308' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 60 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 180 }, data: {} },
      { id: 'spl_3', type: 'balancerSplitter', position: { x: 190, y: 300 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 400, y: 60 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 400, y: 180 }, data: {} },
      { id: 'mrg_3', type: 'balancerMerger', position: { x: 400, y: 300 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 580, y: 70 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 580, y: 190 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 580, y: 310 }, data: { label: 'Output 3', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_spl1_mrg1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_spl1_mrg2', source: 'spl_1', sourceHandle: 'out-1', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.4 } },
      { id: 'e_spl1_mrg3', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.6 } },

      { id: 'e_spl2_mrg1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.4 } },
      { id: 'e_spl2_mrg2', source: 'spl_2', sourceHandle: 'out-1', target: 'mrg_2', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_spl2_mrg3', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.4 } },

      { id: 'e_spl3_mrg1', source: 'spl_3', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308', curvature: 0.6 } },
      { id: 'e_spl3_mrg2', source: 'spl_3', sourceHandle: 'out-1', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308', curvature: 0.4 } },
      { id: 'e_spl3_mrg3', source: 'spl_3', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_out1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_out2', source: 'mrg_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_out3', source: 'mrg_3', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 3:4 ────────────────────────────────────────────────────────────────────
  {
    id: '3to4',
    name: 'Балансировщик 3:4',
    ratio: '3 : 4',
    inputs: 3,
    outputs: 4,
    splitters: 4,
    mergers: 3,
    description: 'Равномерное расширение 3 линий на 4 исходящих конвейера.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 70 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 190 }, data: { label: 'Input 2', color: '#22c55e' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 310 }, data: { label: 'Input 3', color: '#eab308' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 180, y: 60 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 180, y: 180 }, data: {} },
      { id: 'spl_3', type: 'balancerSplitter', position: { x: 180, y: 300 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 360, y: 60 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 360, y: 180 }, data: {} },
      { id: 'mrg_3', type: 'balancerMerger', position: { x: 360, y: 300 }, data: {} },

      { id: 'spl_out', type: 'balancerSplitter', position: { x: 520, y: 180 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 700, y: 50 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 700, y: 130 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 700, y: 220 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 700, y: 310 }, data: { label: 'Output 4', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_s1_m1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_s2_m1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_s2_m3', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s3_m2', source: 'spl_3', sourceHandle: 'out', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308' } },
      { id: 'e_s3_m3', source: 'spl_3', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_m1_o1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_sout', source: 'mrg_2', sourceHandle: 'out', target: 'spl_out', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_m3_o4', source: 'mrg_3', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },

      { id: 'e_sout_o2', source: 'spl_out', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_sout_o3', source: 'spl_out', sourceHandle: 'out-2', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 4 ВХОДА
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── 4:1 ────────────────────────────────────────────────────────────────────
  {
    id: '4to1',
    name: 'Балансировщик 4:1',
    ratio: '4 : 1',
    inputs: 4,
    outputs: 1,
    splitters: 0,
    mergers: 3,
    description: 'Слияние 4 лент в 1 магистраль через 2 ступени мерджеров.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 50 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 130 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 230 }, data: { label: 'Input 3', color: '#22c55e' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 50, y: 310 }, data: { label: 'Input 4', color: '#a855f7' } },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 220, y: 80 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 220, y: 260 }, data: {} },
      { id: 'mrg_root', type: 'balancerMerger', position: { x: 400, y: 170 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 590, y: 180 }, data: { label: 'Output 1', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_m1_root', source: 'mrg_1', sourceHandle: 'out', target: 'mrg_root', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_m2_root', source: 'mrg_2', sourceHandle: 'out', target: 'mrg_root', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_root_o', source: 'mrg_root', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 4:2 ────────────────────────────────────────────────────────────────────
  {
    id: '4to2',
    name: 'Балансировщик 4:2',
    ratio: '4 : 2',
    inputs: 4,
    outputs: 2,
    splitters: 4,
    mergers: 2,
    description: 'Компрессия 4 лент в 2 сбалансированных скоростных потока (50/50%).',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 50 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 150 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 250 }, data: { label: 'Input 3', color: '#22c55e' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 50, y: 350 }, data: { label: 'Input 4', color: '#a855f7' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 40 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 140 }, data: {} },
      { id: 'spl_3', type: 'balancerSplitter', position: { x: 190, y: 240 }, data: {} },
      { id: 'spl_4', type: 'balancerSplitter', position: { x: 190, y: 340 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 420, y: 90 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 420, y: 290 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 100 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 300 }, data: { label: 'Output 2', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 'spl_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_s1_m1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },

      { id: 'e_s2_m1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_s2_m2', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#f97316', curvature: 0.4 } },

      { id: 'e_s3_m1', source: 'spl_3', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.4 } },
      { id: 'e_s3_m2', source: 'spl_3', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s4_m1', source: 'spl_4', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7', curvature: 0.6 } },
      { id: 'e_s4_m2', source: 'spl_4', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_m1_o1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_o2', source: 'mrg_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 4:3 ────────────────────────────────────────────────────────────────────
  {
    id: '4to3',
    name: 'Балансировщик 4:3',
    ratio: '4 : 3',
    inputs: 4,
    outputs: 3,
    splitters: 4,
    mergers: 3,
    description: 'Равномерное сжатие 4 лент в 3 сбалансированных исходящих потока.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 60 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 160 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 260 }, data: { label: 'Input 3', color: '#22c55e' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 50, y: 360 }, data: { label: 'Input 4', color: '#a855f7' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 50 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 150 }, data: {} },
      { id: 'spl_3', type: 'balancerSplitter', position: { x: 190, y: 250 }, data: {} },
      { id: 'spl_4', type: 'balancerSplitter', position: { x: 190, y: 350 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 420, y: 80 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 420, y: 200 }, data: {} },
      { id: 'mrg_3', type: 'balancerMerger', position: { x: 420, y: 320 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 90 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 210 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 620, y: 330 }, data: { label: 'Output 3', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 'spl_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_s1_m1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_s2_m1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_s2_m3', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },

      { id: 'e_s3_m2', source: 'spl_3', sourceHandle: 'out', target: 'mrg_2', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_s3_m3', source: 'spl_3', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s4_m1', source: 'spl_4', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7', curvature: 0.6 } },
      { id: 'e_s4_m2', source: 'spl_4', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_m1_o1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_o2', source: 'mrg_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m3_o3', source: 'mrg_3', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 4:4 ────────────────────────────────────────────────────────────────────
  {
    id: '4to4',
    name: 'Балансировщик 4:4',
    ratio: '4 : 4',
    inputs: 4,
    outputs: 4,
    splitters: 4,
    mergers: 4,
    description: 'Магистральный балансировщик 4x4. Незаменим при разгрузке Ж/Д станций и крупных производств.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 50, y: 60 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 50, y: 160 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 50, y: 260 }, data: { label: 'Input 3', color: '#22c55e' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 50, y: 360 }, data: { label: 'Input 4', color: '#a855f7' } },

      { id: 'spl_1', type: 'balancerSplitter', position: { x: 190, y: 50 }, data: {} },
      { id: 'spl_2', type: 'balancerSplitter', position: { x: 190, y: 150 }, data: {} },
      { id: 'spl_3', type: 'balancerSplitter', position: { x: 190, y: 250 }, data: {} },
      { id: 'spl_4', type: 'balancerSplitter', position: { x: 190, y: 350 }, data: {} },

      { id: 'mrg_1', type: 'balancerMerger', position: { x: 420, y: 50 }, data: {} },
      { id: 'mrg_2', type: 'balancerMerger', position: { x: 420, y: 150 }, data: {} },
      { id: 'mrg_3', type: 'balancerMerger', position: { x: 420, y: 250 }, data: {} },
      { id: 'mrg_4', type: 'balancerMerger', position: { x: 420, y: 350 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 60 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 160 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 620, y: 260 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 620, y: 360 }, data: { label: 'Output 4', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 'spl_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 'spl_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 'spl_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 'spl_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_s1_m1', source: 'spl_1', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 'spl_1', sourceHandle: 'out-2', target: 'mrg_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.4 } },

      { id: 'e_s2_m1', source: 'spl_2', sourceHandle: 'out', target: 'mrg_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#f97316', curvature: 0.4 } },
      { id: 'e_s2_m3', source: 'spl_2', sourceHandle: 'out-2', target: 'mrg_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316', curvature: 0.5 } },

      { id: 'e_s3_m2', source: 'spl_3', sourceHandle: 'out', target: 'mrg_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.5 } },
      { id: 'e_s3_m4', source: 'spl_3', sourceHandle: 'out-2', target: 'mrg_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.4 } },

      { id: 'e_s4_m3', source: 'spl_4', sourceHandle: 'out', target: 'mrg_3', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7', curvature: 0.4 } },
      { id: 'e_s4_m4', source: 'spl_4', sourceHandle: 'out-2', target: 'mrg_4', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_m1_o1', source: 'mrg_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_o2', source: 'mrg_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m3_o3', source: 'mrg_3', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m4_o4', source: 'mrg_4', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ─── 4:8 ────────────────────────────────────────────────────────────────────
  {
    id: '4to8',
    name: 'Балансировщик 4:8',
    ratio: '4 : 8',
    inputs: 4,
    outputs: 8,
    splitters: 8,
    mergers: 4,
    description: 'Масштабный разгрузочный балансировщик 4 входящих лент на 8 производственных веток.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 40, y: 70 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 40, y: 170 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 40, y: 270 }, data: { label: 'Input 3', color: '#22c55e' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 40, y: 370 }, data: { label: 'Input 4', color: '#a855f7' } },

      // Первичная 4x4 матрица
      { id: 's_1', type: 'balancerSplitter', position: { x: 170, y: 60 }, data: {} },
      { id: 's_2', type: 'balancerSplitter', position: { x: 170, y: 160 }, data: {} },
      { id: 's_3', type: 'balancerSplitter', position: { x: 170, y: 260 }, data: {} },
      { id: 's_4', type: 'balancerSplitter', position: { x: 170, y: 360 }, data: {} },

      { id: 'm_1', type: 'balancerMerger', position: { x: 340, y: 60 }, data: {} },
      { id: 'm_2', type: 'balancerMerger', position: { x: 340, y: 160 }, data: {} },
      { id: 'm_3', type: 'balancerMerger', position: { x: 340, y: 260 }, data: {} },
      { id: 'm_4', type: 'balancerMerger', position: { x: 340, y: 360 }, data: {} },

      // Выходные разветвители на 8
      { id: 'so_1', type: 'balancerSplitter', position: { x: 500, y: 60 }, data: {} },
      { id: 'so_2', type: 'balancerSplitter', position: { x: 500, y: 160 }, data: {} },
      { id: 'so_3', type: 'balancerSplitter', position: { x: 500, y: 260 }, data: {} },
      { id: 'so_4', type: 'balancerSplitter', position: { x: 500, y: 360 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 680, y: 30 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 680, y: 90 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 680, y: 130 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 680, y: 190 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 680, y: 230 }, data: { label: 'Output 5', color: '#60a5fa' } },
      { id: 'out_6', type: 'balancerOutput', position: { x: 680, y: 290 }, data: { label: 'Output 6', color: '#60a5fa' } },
      { id: 'out_7', type: 'balancerOutput', position: { x: 680, y: 330 }, data: { label: 'Output 7', color: '#60a5fa' } },
      { id: 'out_8', type: 'balancerOutput', position: { x: 680, y: 390 }, data: { label: 'Output 8', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 's_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 's_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 's_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 's_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_s1_m1', source: 's_1', sourceHandle: 'out', target: 'm_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 's_1', sourceHandle: 'out-2', target: 'm_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_s2_m1', source: 's_2', sourceHandle: 'out', target: 'm_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_s2_m3', source: 's_2', sourceHandle: 'out-2', target: 'm_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },

      { id: 'e_s3_m2', source: 's_3', sourceHandle: 'out', target: 'm_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_s3_m4', source: 's_3', sourceHandle: 'out-2', target: 'm_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s4_m3', source: 's_4', sourceHandle: 'out', target: 'm_3', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },
      { id: 'e_s4_m4', source: 's_4', sourceHandle: 'out-2', target: 'm_4', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_m1_so1', source: 'm_1', sourceHandle: 'out', target: 'so_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_so2', source: 'm_2', sourceHandle: 'out', target: 'so_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m3_so3', source: 'm_3', sourceHandle: 'out', target: 'so_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m4_so4', source: 'm_4', sourceHandle: 'out', target: 'so_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },

      { id: 'e_so1_o1', source: 'so_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so1_o2', source: 'so_1', sourceHandle: 'out-2', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so2_o3', source: 'so_2', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so2_o4', source: 'so_2', sourceHandle: 'out-2', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so3_o5', source: 'so_3', sourceHandle: 'out', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so3_o6', source: 'so_3', sourceHandle: 'out-2', target: 'out_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so4_o7', source: 'so_4', sourceHandle: 'out', target: 'out_7', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_so4_o8', source: 'so_4', sourceHandle: 'out-2', target: 'out_8', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 5 ВХОДОВ
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── 5:5 ────────────────────────────────────────────────────────────────────
  {
    id: '5to5',
    name: 'Балансировщик 5:5',
    ratio: '5 : 5',
    inputs: 5,
    outputs: 5,
    splitters: 6,
    mergers: 6,
    description: 'Симметричный балансировщик для Ж/Д станций на 5 вагонов.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 40, y: 50 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 40, y: 130 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 40, y: 210 }, data: { label: 'Input 3', color: '#eab308' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 40, y: 290 }, data: { label: 'Input 4', color: '#22c55e' } },
      { id: 'in_5', type: 'balancerInput', position: { x: 40, y: 370 }, data: { label: 'Input 5', color: '#3b82f6' } },

      { id: 's_1', type: 'balancerSplitter', position: { x: 180, y: 40 }, data: {} },
      { id: 's_2', type: 'balancerSplitter', position: { x: 180, y: 120 }, data: {} },
      { id: 's_3', type: 'balancerSplitter', position: { x: 180, y: 200 }, data: {} },
      { id: 's_4', type: 'balancerSplitter', position: { x: 180, y: 280 }, data: {} },
      { id: 's_5', type: 'balancerSplitter', position: { x: 180, y: 360 }, data: {} },

      { id: 'm_1', type: 'balancerMerger', position: { x: 400, y: 40 }, data: {} },
      { id: 'm_2', type: 'balancerMerger', position: { x: 400, y: 120 }, data: {} },
      { id: 'm_3', type: 'balancerMerger', position: { x: 400, y: 200 }, data: {} },
      { id: 'm_4', type: 'balancerMerger', position: { x: 400, y: 280 }, data: {} },
      { id: 'm_5', type: 'balancerMerger', position: { x: 400, y: 360 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 50 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 130 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 620, y: 210 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 620, y: 290 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 620, y: 370 }, data: { label: 'Output 5', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 's_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 's_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 's_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 's_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in5', source: 'in_5', sourceHandle: 'out', target: 's_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },

      { id: 'e_s1_m1', source: 's_1', sourceHandle: 'out', target: 'm_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m2', source: 's_1', sourceHandle: 'out-2', target: 'm_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },

      { id: 'e_s2_m2', source: 's_2', sourceHandle: 'out', target: 'm_2', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_s2_m3', source: 's_2', sourceHandle: 'out-2', target: 'm_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },

      { id: 'e_s3_m3', source: 's_3', sourceHandle: 'out', target: 'm_3', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#eab308' } },
      { id: 'e_s3_m4', source: 's_3', sourceHandle: 'out-2', target: 'm_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },

      { id: 'e_s4_m4', source: 's_4', sourceHandle: 'out', target: 'm_4', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_s4_m5', source: 's_4', sourceHandle: 'out-2', target: 'm_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s5_m5', source: 's_5', sourceHandle: 'out', target: 'm_5', targetHandle: 'in-1', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_s5_m1', source: 's_5', sourceHandle: 'out-2', target: 'm_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#3b82f6', curvature: 0.6 } },

      { id: 'e_m1_o1', source: 'm_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_o2', source: 'm_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m3_o3', source: 'm_3', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m4_o4', source: 'm_4', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m5_o5', source: 'm_5', sourceHandle: 'out', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // 6 ВХОДОВ
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── 6:6 ────────────────────────────────────────────────────────────────────
  {
    id: '6to6',
    name: 'Балансировщик 6:6',
    ratio: '6 : 6',
    inputs: 6,
    outputs: 6,
    splitters: 6,
    mergers: 6,
    description: 'Магистральный балансировщик 6x6 для крупных перерабатывающих комплексов и длинных грузовых поездов.',
    nodes: [
      { id: 'in_1', type: 'balancerInput', position: { x: 40, y: 40 }, data: { label: 'Input 1', color: '#ef4444' } },
      { id: 'in_2', type: 'balancerInput', position: { x: 40, y: 110 }, data: { label: 'Input 2', color: '#f97316' } },
      { id: 'in_3', type: 'balancerInput', position: { x: 40, y: 180 }, data: { label: 'Input 3', color: '#eab308' } },
      { id: 'in_4', type: 'balancerInput', position: { x: 40, y: 260 }, data: { label: 'Input 4', color: '#22c55e' } },
      { id: 'in_5', type: 'balancerInput', position: { x: 40, y: 330 }, data: { label: 'Input 5', color: '#3b82f6' } },
      { id: 'in_6', type: 'balancerInput', position: { x: 40, y: 400 }, data: { label: 'Input 6', color: '#a855f7' } },

      { id: 's_1', type: 'balancerSplitter', position: { x: 180, y: 30 }, data: {} },
      { id: 's_2', type: 'balancerSplitter', position: { x: 180, y: 100 }, data: {} },
      { id: 's_3', type: 'balancerSplitter', position: { x: 180, y: 170 }, data: {} },
      { id: 's_4', type: 'balancerSplitter', position: { x: 180, y: 250 }, data: {} },
      { id: 's_5', type: 'balancerSplitter', position: { x: 180, y: 320 }, data: {} },
      { id: 's_6', type: 'balancerSplitter', position: { x: 180, y: 390 }, data: {} },

      { id: 'm_1', type: 'balancerMerger', position: { x: 400, y: 30 }, data: {} },
      { id: 'm_2', type: 'balancerMerger', position: { x: 400, y: 100 }, data: {} },
      { id: 'm_3', type: 'balancerMerger', position: { x: 400, y: 170 }, data: {} },
      { id: 'm_4', type: 'balancerMerger', position: { x: 400, y: 250 }, data: {} },
      { id: 'm_5', type: 'balancerMerger', position: { x: 400, y: 320 }, data: {} },
      { id: 'm_6', type: 'balancerMerger', position: { x: 400, y: 390 }, data: {} },

      { id: 'out_1', type: 'balancerOutput', position: { x: 620, y: 40 }, data: { label: 'Output 1', color: '#60a5fa' } },
      { id: 'out_2', type: 'balancerOutput', position: { x: 620, y: 110 }, data: { label: 'Output 2', color: '#60a5fa' } },
      { id: 'out_3', type: 'balancerOutput', position: { x: 620, y: 180 }, data: { label: 'Output 3', color: '#60a5fa' } },
      { id: 'out_4', type: 'balancerOutput', position: { x: 620, y: 260 }, data: { label: 'Output 4', color: '#60a5fa' } },
      { id: 'out_5', type: 'balancerOutput', position: { x: 620, y: 330 }, data: { label: 'Output 5', color: '#60a5fa' } },
      { id: 'out_6', type: 'balancerOutput', position: { x: 620, y: 400 }, data: { label: 'Output 6', color: '#60a5fa' } },
    ],
    edges: [
      { id: 'e_in1', source: 'in_1', sourceHandle: 'out', target: 's_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_in2', source: 'in_2', sourceHandle: 'out', target: 's_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_in3', source: 'in_3', sourceHandle: 'out', target: 's_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },
      { id: 'e_in4', source: 'in_4', sourceHandle: 'out', target: 's_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#22c55e' } },
      { id: 'e_in5', source: 'in_5', sourceHandle: 'out', target: 's_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#3b82f6' } },
      { id: 'e_in6', source: 'in_6', sourceHandle: 'out', target: 's_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#a855f7' } },

      // Первая группа (1..3) с перекрестной связью во вторую
      { id: 'e_s1_m1', source: 's_1', sourceHandle: 'out', target: 'm_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444' } },
      { id: 'e_s1_m4', source: 's_1', sourceHandle: 'out-2', target: 'm_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#ef4444', curvature: 0.5 } },

      { id: 'e_s2_m2', source: 's_2', sourceHandle: 'out', target: 'm_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316' } },
      { id: 'e_s2_m5', source: 's_2', sourceHandle: 'out-2', target: 'm_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#f97316', curvature: 0.5 } },

      { id: 'e_s3_m3', source: 's_3', sourceHandle: 'out', target: 'm_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308' } },
      { id: 'e_s3_m6', source: 's_3', sourceHandle: 'out-2', target: 'm_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#eab308', curvature: 0.5 } },

      // Вторая группа (4..6) с обратной связью в первую
      { id: 'e_s4_m1', source: 's_4', sourceHandle: 'out', target: 'm_1', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e', curvature: 0.5 } },
      { id: 'e_s4_m4', source: 's_4', sourceHandle: 'out-2', target: 'm_4', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#22c55e' } },

      { id: 'e_s5_m2', source: 's_5', sourceHandle: 'out', target: 'm_2', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#3b82f6', curvature: 0.5 } },
      { id: 'e_s5_m5', source: 's_5', sourceHandle: 'out-2', target: 'm_5', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#3b82f6' } },

      { id: 'e_s6_m3', source: 's_6', sourceHandle: 'out', target: 'm_3', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7', curvature: 0.5 } },
      { id: 'e_s6_m6', source: 's_6', sourceHandle: 'out-2', target: 'm_6', targetHandle: 'in-2', type: 'balancerCurved', data: { color: '#a855f7' } },

      { id: 'e_m1_o1', source: 'm_1', sourceHandle: 'out', target: 'out_1', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m2_o2', source: 'm_2', sourceHandle: 'out', target: 'out_2', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m3_o3', source: 'm_3', sourceHandle: 'out', target: 'out_3', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m4_o4', source: 'm_4', sourceHandle: 'out', target: 'out_4', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m5_o5', source: 'm_5', sourceHandle: 'out', target: 'out_5', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
      { id: 'e_m6_o6', source: 'm_6', sourceHandle: 'out', target: 'out_6', targetHandle: 'in', type: 'balancerCurved', data: { color: '#60a5fa' } },
    ]
  }
];
