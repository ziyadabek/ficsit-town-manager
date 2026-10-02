import React, { useState, useMemo, useEffect } from 'react';
import powerData from '../../database/powerData.json';
import { solvePower } from '../../engine/powerSolver';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function PowerPlanner({ isPresetMode }) {
  const [targetMW, setTargetMW] = useState(500);
  const [generatorId, setGeneratorId] = useState('coal');
  const [fuelId, setFuelId] = useState('coal');
  const [safetyBuffer, setSafetyBuffer] = useState(1.0);

  const { powerConfig, summary } = useFactoryStore();

  useEffect(() => {
    if (isPresetMode && powerConfig) {
      setTargetMW(powerConfig.targetMW);
      setGeneratorId(powerConfig.generatorId);
      setFuelId(powerConfig.fuelId);
    }
  }, [isPresetMode, powerConfig]);

  const selectedGen = powerData.find(g => g.id === generatorId);

  // Auto-select first fuel when generator changes
  const handleGenChange = (id) => {
    setGeneratorId(id);
    const g = powerData.find(gen => gen.id === id);
    if (g && g.fuels.length > 0) {
      setFuelId(g.fuels[0].id);
    }
  };

  const handleSync = () => {
    if (summary && summary.totalPower) {
      setTargetMW(Math.ceil(summary.totalPower * safetyBuffer));
    }
  };

  const result = useMemo(() => {
    return solvePower(targetMW, generatorId, fuelId);
  }, [targetMW, generatorId, fuelId]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0d10] text-[#e1e1e6] p-6 overflow-y-auto">
      {/* Панель управления */}
      <div className="bg-[#14171d] border border-[#2a2e39] rounded-lg p-6 mb-6 shadow-lg flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button onClick={() => { setTargetMW(500); handleGenChange('coal'); }} className="px-4 py-2 bg-[#2a2e39] rounded hover:bg-[#3f4452] font-bold">500 MW Coal</button>
            <button onClick={() => { setTargetMW(2500); handleGenChange('fuel'); }} className="px-4 py-2 bg-[#2a2e39] rounded hover:bg-[#3f4452] font-bold">2 500 MW Fuel</button>
            <button onClick={() => { setTargetMW(10000); handleGenChange('nuclear'); }} className="px-4 py-2 bg-[#2a2e39] rounded hover:bg-[#3f4452] font-bold">10 000 MW Nuclear</button>
          </div>

          {/* Synchronization Section */}
          <div className="flex items-center gap-3 bg-[#0b0d10] p-2 rounded border border-[#3b82f6]/30">
            <select 
              value={safetyBuffer} 
              onChange={e => setSafetyBuffer(parseFloat(e.target.value))}
              className="bg-[#14171d] border border-[#2a2e39] text-sm p-2 rounded text-[#e1e1e6] focus:outline-none"
            >
              <option value="1.0">Точно (1.0x)</option>
              <option value="1.15">+15% Резерв</option>
              <option value="1.25">+25% Пиковый буфер</option>
            </select>
            <button 
              onClick={handleSync}
              className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded flex items-center gap-2 transition-colors"
            >
              <span className="text-lg">↻</span> Синхронизировать с фабрикой
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-400">Целевая мощность (МВт)</label>
            <input 
              type="number" 
              value={targetMW} 
              onChange={(e) => setTargetMW(Number(e.target.value))}
              className="bg-[#0b0d10] border border-[#2a2e39] rounded px-4 py-2 text-xl font-bold text-[#f97316] w-48 focus:outline-none focus:border-[#f97316]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-400">Тип генератора</label>
            <div className="flex gap-2">
              {powerData.map(gen => (
                <button 
                  key={gen.id} 
                  onClick={() => handleGenChange(gen.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${generatorId === gen.id ? 'border-[#f97316] bg-[#2a2e39]' : 'border-[#2a2e39] bg-[#0b0d10] hover:border-gray-500'}`}
                >
                  <img src={gen.icon} alt={gen.name} className="w-6 h-6 object-contain" onError={(e) => e.target.style.display='none'} />
                  <span className="text-sm font-bold">{gen.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedGen && selectedGen.fuels.length > 1 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-400">Тип топлива</label>
            <div className="flex gap-2">
              {selectedGen.fuels.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setFuelId(f.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${fuelId === f.id ? 'border-yellow-500 bg-[#2a2e39]' : 'border-[#2a2e39] bg-[#0b0d10] hover:border-gray-500'}`}
                >
                  <img src={f.icon} alt={f.name} className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} />
                  <span className="text-sm">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Результаты расчета */}
      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Сводный баланс */}
          <div className="bg-[#14171d] border border-[#2a2e39] rounded-lg p-6 shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold border-b border-[#2a2e39] pb-2 text-[#e1e1e6]">Сводный энергобаланс</h3>
            <div className="flex justify-between items-center bg-[#0b0d10] px-3 py-2 rounded">
              <span className="text-gray-400">Валовая генерация:</span>
              <span className="font-bold text-yellow-500">{result.grossPower.toFixed(1)} МВт</span>
            </div>
            <div className="flex justify-between items-center bg-[#0b0d10] px-3 py-2 rounded">
              <span className="text-gray-400">Собственное потребление:</span>
              <span className="font-bold text-red-400">-{result.parasiticPower.toFixed(1)} МВт</span>
            </div>
            <div className="flex justify-between items-center bg-[#2a2e39] border border-[#f97316] px-3 py-3 rounded mt-2">
              <span className="font-bold text-[#e1e1e6]">Чистая в сеть (Net):</span>
              <span className="font-black text-[#22c55e] text-xl">{result.netPower.toFixed(1)} МВт</span>
            </div>
          </div>

          {/* Инфраструктура (Генераторы и Вода) */}
          <div className="bg-[#14171d] border border-[#2a2e39] rounded-lg p-6 shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold border-b border-[#2a2e39] pb-2 text-[#e1e1e6]">Инфраструктура</h3>
            
            <div className="flex items-center gap-4 bg-[#0b0d10] p-3 rounded border border-[#2a2e39]">
              <img src={result.generator.icon} alt={result.generator.name} className="w-10 h-10 object-contain" onError={(e) => e.target.style.display='none'} />
              <div>
                <div className="font-bold">{result.generator.name}</div>
                <div className="text-sm text-gray-400">{result.generators.count} шт. (Последний на {result.generators.lastClock.toFixed(1)}%)</div>
              </div>
            </div>

            {result.water.totalRate > 0 && (
              <div className="flex items-center gap-4 bg-[#0b0d10] p-3 rounded border border-blue-900/50">
                <img src="/icons/Buildings/Waterpump.png" alt="Водяная помпа" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display='none'} />
                <div className="w-full">
                  <div className="flex justify-between font-bold text-blue-300">
                    <span>Водяные помпы</span>
                    <span>{result.water.totalRate.toFixed(1)} м³/мин</span>
                  </div>
                  <div className="text-sm text-gray-400">{result.water.pumpsFull} шт. (Потребление: {result.water.power.toFixed(1)} МВт)</div>
                  <div className="text-xs text-blue-500 mt-1">Трубы: {result.water.totalRate > 300 ? 'Требуется Mk.2 (600 м³)' : 'Достаточно Mk.1 (300 м³)'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Логистика топлива и отходов */}
          <div className="bg-[#14171d] border border-[#2a2e39] rounded-lg p-6 shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold border-b border-[#2a2e39] pb-2 text-[#e1e1e6]">Логистика и Топливо</h3>
            
            {result.fuel ? (
              <div className="flex items-center gap-4 bg-[#0b0d10] p-3 rounded border border-[#2a2e39]">
                <img src={result.fuel.icon} alt={result.fuel.name} className="w-10 h-10 object-contain" onError={(e) => e.target.style.display='none'} />
                <div>
                  <div className="font-bold text-[#f97316]">{result.fuel.name}</div>
                  <div className="text-sm text-gray-300">Потребление: {result.fuelLogistics.rate.toFixed(1)} /мин</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 p-3">Топливо не требуется (Геотермальный генератор)</div>
            )}

            {result.waste && result.waste.rate > 0 && !result.recycling && (
              <div className="flex flex-col gap-2 mt-4 bg-red-950/20 p-4 rounded border border-red-900/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">☢️</span>
                  <div className="font-bold text-red-400">ВНИМАНИЕ: РАДИАЦИЯ!</div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Выброс отходов:</span>
                  <span className="font-bold text-red-400">{result.waste.rate.toFixed(1)} /мин</span>
                </div>
              </div>
            )}
          </div>

          {/* Zero-Waste Plutonium Loop */}
          {result.recycling && (
            <div className="xl:col-span-3 bg-[#0b1710] border border-[#22c55e]/50 rounded-lg p-6 shadow-[0_0_20px_rgba(34,197,94,0.1)] flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between border-b border-[#22c55e]/30 pb-3">
                <h3 className="text-xl font-bold text-[#22c55e] flex items-center gap-2">
                  🏭 Комплекс радиационной нейтрализации (Zero-Waste Plutonium Loop)
                </h3>
                <div className="flex items-center gap-2 bg-[#22c55e]/20 px-3 py-1.5 rounded-full border border-[#22c55e]/50">
                  <span className="text-xl">♻️</span>
                  <span className="text-sm font-bold text-[#22c55e]">100% Радиоактивная безопасность — Бессрочная утилизация</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-400 mb-3">Спецификация оборудования:</h4>
                  <div className="flex flex-col gap-2">
                    {result.recycling.machines.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#14171d] p-2 rounded border border-[#2a2e39]">
                        <span className="text-sm text-[#e1e1e6]">{m.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-yellow-500 mr-3">{Math.ceil(m.count)} шт. ({(m.count % 1 !== 0 ? (m.count % 1) * 100 : 100).toFixed(0)}%)</span>
                          <span className="text-xs text-gray-500">{m.power.toFixed(1)} MW</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-400 mb-3">Вспомогательное сырье:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {result.recycling.materials.map((mat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#14171d] p-2 rounded border border-[#2a2e39]">
                        <span className="text-xs text-[#e1e1e6]">{mat.name}</span>
                        <span className="text-xs font-bold text-[#f97316]">{mat.rate.toFixed(1)} /мин</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => alert('Утилизационный цех спроектирован. Добавление в основной граф будет доступно в следующем патче!')}
                      className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded flex items-center gap-2 transition-colors"
                    >
                      Экспортировать цех переработки в граф как подзадачу
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
