import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');
const search = `      {/* Global Campaign Presets Toolbar - Only visible in Campaign mode */}
      {view === 'campaign' && (
        <div className="flex overflow-x-auto border-b border-[#2a2e39] bg-[#0b0d10] px-4 py-2 gap-3 shrink-0 scrollbar-thin scrollbar-thumb-[#2a2e39]">
          <div className="flex items-center text-sm font-bold text-gray-400 mr-2 uppercase tracking-wider">
            ПЛАН КАМПАНИИ:
          </div>
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#2a2e39] bg-[#14171d] hover:border-[#f97316] rounded-md transition-colors whitespace-nowrap"
            >
              <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${preset.id === 'complex_8' ? 'bg-yellow-500 text-black' : 'bg-[#f97316] text-black'}\`}>
                {preset.id === 'complex_8' ? 'ФИНАЛ' : preset.tier}
              </span>
              <span className="text-sm font-bold text-[#e1e1e6]">{preset.name}</span>
            </button>
          ))}
        </div>
      )}`;

const replacement = `      {/* Global Campaign Presets Toolbar - Only visible in Campaign mode */}
      {view === 'campaign' && (
        <div className="flex flex-col border-b border-[#2a2e39] bg-[#0b0d10] shrink-0">
          <div className="flex items-center justify-between px-4 py-2 bg-[#14171d] border-b border-[#2a2e39] text-xs">
            <div className="flex items-center gap-4 text-gray-300">
              <span className="font-bold text-[#22c55e]">⚡ Валовая генерация: +13 700 МВт</span>
              <span className="text-gray-500">(Уголь 1200 + Нефть 2500 + АЭС 10000)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#ef4444]">Пиковое потребление: ~8 200 МВт</span>
              <span className="font-bold text-[#3b82f6]">Профицит сети: ~+5 500 МВт (100% стабильность)</span>
            </div>
          </div>
          
          <div className="flex overflow-x-auto px-4 py-2 gap-3 scrollbar-thin scrollbar-thumb-[#2a2e39]">
            <div className="flex items-center text-sm font-bold text-gray-400 mr-2 uppercase tracking-wider">
              ЭТАПЫ:
            </div>
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#2a2e39] bg-[#14171d] hover:border-[#f97316] rounded-md transition-colors whitespace-nowrap"
              >
                <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${preset.type === 'power' ? 'bg-[#22c55e] text-black' : 'bg-[#f97316] text-black'}\`}>
                  {preset.type === 'power' ? '⚡ ' + preset.tier : preset.tier}
                </span>
                <span className="text-sm font-bold text-[#e1e1e6]">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}`;

content = content.substring(0, content.indexOf('{/* Global Campaign Presets')) + replacement + content.substring(content.indexOf('      <main className="flex-1 flex overflow-hidden">'));
fs.writeFileSync('src/App.jsx', content, 'utf8');
