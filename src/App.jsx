import React, { useState } from 'react'
import MainView from './components/canvas/MainView'
import RightPanel from './components/complexes/RightPanel'
import DeficitAlerts from './components/logistics/DeficitAlerts'
import presets from './database/campaignPresets.json'
import { useFactoryStore } from './store/useFactoryStore'
import PowerPlanner from './modules/power/PowerPlanner'
import MacroView from './components/canvas/MacroView'

function App() {
  const { switchAppView, loadPreset, selectedPresetType, campaignStagesState, activePresetId, toggleStage, setStageScale, frozenStages } = useFactoryStore();
  const [view, setView] = useState('calculator');
  const [campaignMode, setCampaignMode] = useState('detail');
  const handleSetView = (newView) => {
    setView(newView);
    if (newView === 'campaign' && !activePresetId && presets.length > 0) {
      loadPreset(presets[0]);
    } else if (newView === 'calculator' && activePresetId) {
      useFactoryStore.setState({ activePresetId: null });
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0d10] text-[#e1e1e6] overflow-hidden">
      <header className="px-4 py-2 border-b border-[#2a2e39] bg-[#14171d] flex items-center justify-between z-10 shrink-0">
        <h1 className="text-xl font-bold text-[#f97316]">FICSIT Architect & Production Calculator</h1>
        <div className="flex items-center gap-6">
          <div className="flex bg-[#0b0d10] p-1 rounded-lg border border-[#2a2e39] items-center">
            <button 
              onClick={() => handleSetView('calculator')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                view === 'calculator' 
                  ? 'bg-[#f97316] text-black shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ⚙️ Производство
            </button>
            <button 
              onClick={() => handleSetView('power')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                view === 'power' 
                  ? 'bg-[#3b82f6] text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ⚡ Электропитание
            </button>
          </div>

          <div className="w-px h-6 bg-[#2a2e39]"></div>

          <button 
            onClick={() => handleSetView('campaign')}
            className={`font-bold px-2 py-1 flex items-center gap-2 transition-all ${
              view === 'campaign' 
                ? 'text-[#f97316] border-b-2 border-[#f97316]' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🌍 План кампании
          </button>
        </div>
      </header>

      {/* Global Campaign Presets Toolbar - Only visible in Campaign mode */}
      {view === 'campaign' && (
        <div className="flex flex-col border-b border-[#2a2e39] bg-[#0b0d10] shrink-0">
          <div className="flex px-4 py-3 justify-between items-center w-full">
            <div className="flex overflow-x-auto gap-2 scrollbar-thin scrollbar-thumb-[#2a2e39] items-center flex-1">
            {presets.map((preset, index) => {
              const state = campaignStagesState[preset.id] || { enabled: true, scale: 1.0 };
              const isActive = activePresetId === preset.id;
              const isFrozen = !!frozenStages?.[preset.id]?.isFrozen;

              let borderClass = 'border-[#2a2e39] bg-[#14171d]';
              if (isActive && isFrozen) {
                borderClass = 'border-[#22c55e] bg-[#13231a] shadow-[0_0_10px_rgba(34,197,94,0.35)]';
              } else if (isActive) {
                borderClass = 'border-[#3b82f6] bg-[#1a2333] shadow-[0_0_10px_rgba(59,130,246,0.3)]';
              } else if (isFrozen) {
                borderClass = 'border-[#22c55e]/50 bg-[#0f1a14]';
              }
              
              return (
                <React.Fragment key={preset.id}>
                  {index > 0 && (
                    <div className="shrink-0 text-gray-600 font-bold px-1 text-xs">
                      →
                    </div>
                  )}
                  <div
                    className={`flex flex-col border ${borderClass} rounded-md transition-colors shrink-0 overflow-hidden relative`}
                  >
                    {!state.enabled && (
                      <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none" />
                    )}
                    
                    {/* Upper row: Type / Name / Select */}
                    <button
                      onClick={() => loadPreset(preset)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2e39] w-full text-left"
                    >
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${preset.type === 'power' ? 'bg-[#22c55e] text-black' : 'bg-[#f97316] text-black'}`}>
                        {preset.type === 'power' ? '⚡ ' + preset.tier : preset.tier}
                      </span>
                      <span className="text-xs font-bold text-[#e1e1e6]">{preset.name}</span>
                      {isFrozen && (
                        <span className="text-[10px] text-[#22c55e] font-bold ml-1 flex items-center" title="Завод построен">
                          🔒
                        </span>
                      )}
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          
          <div className="flex bg-[#14171d] p-1 rounded border border-[#2a2e39] shrink-0 ml-4">
            <button 
              onClick={() => setCampaignMode('detail')} 
              className={`px-3 py-1 text-xs font-bold rounded ${campaignMode === 'detail' ? 'bg-[#f97316] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🏭 ЦЕХА
            </button>
            <button 
              onClick={() => setCampaignMode('macro')} 
              className={`px-3 py-1 text-xs font-bold rounded ${campaignMode === 'macro' ? 'bg-[#3b82f6] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              🌍 КАРТА
            </button>
          </div>
          
        </div>
      </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {view === 'power' ? (
          <PowerPlanner />
        ) : view === 'campaign' && campaignMode === 'macro' ? (
          <MacroView />
        ) : (
          <>
            <MainView />
            <RightPanel />
          </>
        )}
      </main>
    </div>
  )
}

export default App
