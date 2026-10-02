import fs from 'fs';

let content = fs.readFileSync('src/components/canvas/MainView.jsx', 'utf8');

const search = `function LogisticsTable({ summary }) {
  if (!summary || !summary.items) return <div className="p-8 text-gray-500">Нет данных для отображения.</div>;`;

const replace = `function LogisticsTable({ summary }) {
  const { inputsLimit } = useFactoryStore();
  if (!summary || !summary.items) return <div className="p-8 text-gray-500">Нет данных для отображения.</div>;`;

content = content.replace(search, replace);

const search2 = `            return (
              <tr key={item.id} className="border-b border-[#2a2e39] hover:bg-[#14171d]">
                <td className="p-2 flex items-center gap-2">
                  {dbItem && <img src={dbItem.icon} alt={dbItem.name} className="w-6 h-6" />}
                  <span>{dbItem?.name || item.id}</span>
                </td>
                <td className="p-2 font-bold text-[#e1e1e6]">{maxFlow.toFixed(2)}</td>
                <td className={\`p-2 flex items-center gap-2 \${alertColor}\`}>
                  <img src={recIcon} alt={recText} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display='none'} />
                  <span>{recText}</span>
                </td>
              </tr>
            );`;

const replace2 = `            const isImported = inputsLimit.some(limit => limit.itemId === item.id);
            return (
              <tr key={item.id} className="border-b border-[#2a2e39] hover:bg-[#14171d]">
                <td className="p-2 flex items-center gap-2">
                  {dbItem && <img src={dbItem.icon} alt={dbItem.name} className="w-6 h-6" />}
                  <span className="flex items-center gap-2">
                    {dbItem?.name || item.id}
                    {isImported && <span className="text-[10px] bg-[#3b82f6] text-white px-1 py-0.5 rounded ml-2 uppercase font-bold">[Импортная линия]</span>}
                  </span>
                </td>
                <td className="p-2 font-bold text-[#e1e1e6]">{maxFlow.toFixed(2)}</td>
                <td className={\`p-2 flex items-center gap-2 \${alertColor}\`}>
                  <img src={recIcon} alt={recText} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display='none'} />
                  <span>{isImported ? recText + ' (Разгрузка Ж/Д)' : recText}</span>
                </td>
              </tr>
            );`;

content = content.replace(search2, replace2);
fs.writeFileSync('src/components/canvas/MainView.jsx', content, 'utf8');
