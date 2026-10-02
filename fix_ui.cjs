const fs = require('fs');
let code = fs.readFileSync('src/components/canvas/MachineNode.jsx', 'utf8');

// The generator block
const genStart = code.indexOf('<div className="flex items-center justify-between p-2 border-b border-[#facc15]/30 bg-[#facc15]/10">');
if (genStart > -1) {
  const genEnd = code.indexOf('⚡ ЭЛЕКТРОСТАНЦИЯ</div>', genStart);
  if (genEnd > -1) {
    const endTag = '</div>';
    const finalEnd = code.indexOf(endTag, genEnd) + endTag.length;
    const oldBlock = code.substring(genStart, finalEnd);
    
    const newGen = `<div className="flex items-center justify-between p-2 border-b border-[#facc15]/30 bg-[#facc15]/10 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {building && <img src={building.icon} alt={building.name} className="w-8 h-8 object-contain shrink-0 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />}
            <span className="font-bold text-[#facc15] truncate" title={building?.name}>{building?.name || 'Генератор'}</span>
          </div>
          <div className="text-[10px] bg-[#facc15] text-black px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap">⚡ ЭЛЕКТРОСТАНЦИЯ</div>
        </div>`;
    code = code.replace(oldBlock, newGen);
  }
}

// The standard block
const stdSearch = `<div className={\`flex items-center justify-between p-2 border-b rounded-t-md \${isAmplified ? 'bg-[#a855f7]/20 border-[#a855f7]/50' : 'bg-[#0b0d10] border-[#2a2e39]'}\`}>`;
const stdStart = code.indexOf(stdSearch);
if (stdStart > -1) {
  const stdEndToken = `<span className="font-semibold">{building?.name || 'Станок'}</span>\r\n          </div>`;
  const stdEndToken2 = `<span className="font-semibold">{building?.name || 'Станок'}</span>\n          </div>`;
  
  let endIdx = code.indexOf(stdEndToken, stdStart);
  let len = stdEndToken.length;
  if (endIdx === -1) {
    endIdx = code.indexOf(stdEndToken2, stdStart);
    len = stdEndToken2.length;
  }
  
  if (endIdx > -1) {
    const oldBlock = code.substring(stdStart, endIdx + len);
    
    const newStd = `<div className={\`flex items-center justify-between p-2 border-b rounded-t-md \${isAmplified ? 'bg-[#a855f7]/20 border-[#a855f7]/50' : 'bg-[#0b0d10] border-[#2a2e39]'}\` gap-2}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {building && <img src={building.icon} alt={building.name} className="w-8 h-8 rounded bg-gray-800 shrink-0" />}
            <span className="font-bold truncate" title={building?.name}>{building?.name || 'Станок'}</span>
          </div>`;
    code = code.replace(oldBlock, newStd);
  }
}

fs.writeFileSync('src/components/canvas/MachineNode.jsx', code);
console.log('Fixed with index search');
