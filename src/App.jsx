import React, { useState, useEffect, useRef, Suspense, lazy } from 'react'
import MainView from './components/canvas/MainView'
import RightPanel from './components/complexes/RightPanel'
import DeficitAlerts from './components/logistics/DeficitAlerts'
import presets from './database/campaignPresets.json'
import { useFactoryStore } from './store/useFactoryStore'

const PowerPlanner = lazy(() => import('./modules/power/PowerPlanner'))
const MacroView = lazy(() => import('./components/canvas/MacroView'))
const BalancerViewer = lazy(() => import('./modules/balancer/BalancerViewer'))

function App() {
  const { loadPreset, resetToFreeMode, campaignStagesState, activePresetId, frozenStages, initStorage } = useFactoryStore();
  const [view, setView] = useState('calculator');
  const [campaignMode, setCampaignMode] = useState('detail');
  const [plannersOpen, setPlannersOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const plannersRef = useRef(null);
  const campaignRef = useRef(null);
  const workbenchRef = useRef(null);

  useEffect(() => {
    initStorage();
  }, [initStorage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plannersRef.current && !plannersRef.current.contains(event.target)) {
        setPlannersOpen(false);
      }
      if (campaignRef.current && !campaignRef.current.contains(event.target)) {
        setCampaignOpen(false);
      }
      if (workbenchRef.current && !workbenchRef.current.contains(event.target)) {
        setWorkbenchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSetView = (newView) => {
    setView(newView);
    setPlannersOpen(false);
    setCampaignOpen(false);
    setWorkbenchOpen(false);
    if (newView === 'campaign' && !activePresetId && presets.length > 0) {
      loadPreset(presets[0]);
    } else if (newView === 'calculator' && activePresetId) {
      resetToFreeMode();
    }
  };

  const isPlannerActive = ['calculator', 'power'].includes(view);
  const isWorkbenchActive = view === 'balancer';

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0d10] text-[#e1e1e6] overflow-hidden">
      {/* Верхняя навигационная панель в стиле Satisfactory Calculator (SCIM) */}
      <header className="px-4 py-2 border-b border-[#2a2e39] bg-[#14171d] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-6">
          {/* SCIM Логотип */}
          <div 
            className="flex items-center gap-2 select-none cursor-pointer group" 
            onClick={() => {
              resetToFreeMode();
              handleSetView('calculator');
            }}
            title="Satisfactory Calculator - На главную (Свободный режим)"
          >
            <div className="flex flex-col leading-none">
              <div className="flex items-center tracking-tight">
                <span className="text-base font-black text-white group-hover:text-[#f97316] transition-colors uppercase font-sans tracking-wide">
                  SATISFACTORY
                </span>
                <span className="ml-1 text-[9px] font-black bg-[#f97316] text-black px-1 py-0.5 rounded-sm transform skew-x-[-12deg]">
                  1.0
                </span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 tracking-[0.25em] uppercase">
                CALCULATOR
              </span>
            </div>
          </div>

          {/* Горизонтальное меню SCIM */}
          <nav className="flex items-center gap-1.5">
            {/* Дропдаун PLANNERS (Производство, Электропитание) */}
            <div 
              ref={plannersRef}
              className="relative"
              onMouseEnter={() => setPlannersOpen(true)}
              onMouseLeave={() => setPlannersOpen(false)}
            >
              <button
                onClick={() => setPlannersOpen(!plannersOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  isPlannerActive
                    ? 'text-[#f97316] bg-[#1e232e]' 
                    : 'text-gray-300 hover:text-white hover:bg-[#1a1e27]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>ПЛАНИРОВЩИКИ</span>
                <span className="text-[10px] ml-0.5 opacity-70">▾</span>
              </button>

              {plannersOpen && (
                <div className="absolute left-0 mt-0.5 w-60 bg-[#161920] border border-[#2a2e39] rounded-md shadow-2xl py-1.5 z-50">
                  <button
                    onClick={() => {
                      if (activePresetId) {
                        resetToFreeMode();
                      }
                      handleSetView('calculator');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      view === 'calculator' && !activePresetId ? 'bg-[#242b38] text-[#f97316] font-bold' : 'text-gray-200 hover:bg-[#1f242f]'
                    }`}
                  >
                    <svg className="w-4 h-4 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="text-xs font-bold">Производство</div>
                      <div className="text-[10px] text-gray-400 font-normal">Production planner</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSetView('power')}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      view === 'power' ? 'bg-[#242b38] text-[#3b82f6] font-bold' : 'text-gray-200 hover:bg-[#1f242f]'
                    }`}
                  >
                    <svg className="w-4 h-4 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <div className="text-xs font-bold">Электропитание</div>
                      <div className="text-[10px] text-gray-400 font-normal">Power planner</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Дропдаун ПЛАН КАМПАНИИ (Цеха, Карта) */}
            <div 
              ref={campaignRef}
              className="relative"
              onMouseEnter={() => setCampaignOpen(true)}
              onMouseLeave={() => setCampaignOpen(false)}
            >
              <button
                onClick={() => setCampaignOpen(!campaignOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  view === 'campaign'
                    ? 'text-[#f97316] bg-[#1e232e]' 
                    : 'text-gray-300 hover:text-white hover:bg-[#1a1e27]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>ПЛАН КАМПАНИИ</span>
                <span className="text-[10px] ml-0.5 opacity-70">▾</span>
              </button>

              {campaignOpen && (
                <div className="absolute left-0 mt-0.5 w-56 bg-[#161920] border border-[#2a2e39] rounded-md shadow-2xl py-1.5 z-50">
                  <button
                    onClick={() => {
                      handleSetView('campaign');
                      setCampaignMode('detail');
                      setCampaignOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      view === 'campaign' && campaignMode === 'detail' ? 'bg-[#242b38] text-[#f97316] font-bold' : 'text-gray-200 hover:bg-[#1f242f]'
                    }`}
                  >
                    <svg className="w-4 h-4 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="text-xs font-bold">Цеха</div>
                      <div className="text-[10px] text-gray-400 font-normal">Детальные фабрики этапов</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleSetView('campaign');
                      setCampaignMode('macro');
                      setCampaignOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      view === 'campaign' && campaignMode === 'macro' ? 'bg-[#242b38] text-[#3b82f6] font-bold' : 'text-gray-200 hover:bg-[#1f242f]'
                    }`}
                  >
                    <svg className="w-4 h-4 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <div>
                      <div className="text-xs font-bold">Карта</div>
                      <div className="text-[10px] text-gray-400 font-normal">Макро-карта кампании</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Дропдаун ВЕРСТАК (Балансировщики) */}
            <div 
              ref={workbenchRef}
              className="relative"
              onMouseEnter={() => setWorkbenchOpen(true)}
              onMouseLeave={() => setWorkbenchOpen(false)}
            >
              <button
                onClick={() => setWorkbenchOpen(!workbenchOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  isWorkbenchActive
                    ? 'text-[#f97316] bg-[#1e232e]' 
                    : 'text-gray-300 hover:text-white hover:bg-[#1a1e27]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                </svg>
                <span>ВЕРСТАК</span>
                <span className="text-[10px] ml-0.5 opacity-70">▾</span>
              </button>

              {workbenchOpen && (
                <div className="absolute left-0 mt-0.5 w-56 bg-[#161920] border border-[#2a2e39] rounded-md shadow-2xl py-1.5 z-50">
                  <button
                    onClick={() => handleSetView('balancer')}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      view === 'balancer' ? 'bg-[#242b38] text-[#f97316] font-bold' : 'text-gray-200 hover:bg-[#1f242f]'
                    }`}
                  >
                    <svg className="w-4 h-4 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <div>
                      <div className="text-xs font-bold">Балансировщики</div>
                      <div className="text-[10px] text-gray-400 font-normal">Conveyor Balancers</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Global Campaign Presets Toolbar - Only visible in Campaign mode */}
      {view === 'campaign' && (
        <div className="flex flex-col border-b border-[#2a2e39] bg-[#0b0d10] shrink-0">
          <div className="flex px-4 py-3 justify-between items-center w-full">
            <div className="flex overflow-x-auto gap-2 scrollbar-thin scrollbar-thumb-[#2a2e39] items-center flex-1 pr-3">
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
                    <div className="shrink-0 text-amber-500/80 font-bold px-1 text-sm select-none">
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
                      className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2e39] w-full text-left cursor-pointer"
                    >
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${preset.type === 'power' ? 'bg-[#22c55e] text-black' : 'bg-[#f97316] text-black'}`}>
                        {preset.tier}
                      </span>
                      <span className="text-xs font-bold text-[#e1e1e6]">{preset.name}</span>
                      {isFrozen && (
                        <span className="text-[10px] text-[#22c55e] font-bold ml-1 flex items-center gap-1" title="Завод построен">
                          <svg className="w-3 h-3 text-[#22c55e]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#0b0d10] text-gray-400 font-mono text-sm">
            Загрузка модуля...
          </div>
        }>
          {view === 'power' ? (
            <PowerPlanner />
          ) : view === 'balancer' ? (
            <BalancerViewer />
          ) : view === 'campaign' && campaignMode === 'macro' ? (
            <MacroView />
          ) : (
            <>
              <MainView />
              <RightPanel />
            </>
          )}
        </Suspense>
      </main>
    </div>
  )
}

export default App
