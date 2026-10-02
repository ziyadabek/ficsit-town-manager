const fs = require('fs');

const itemsPath = './src/database/items.json';
const recipesPath = './src/database/recipes.json';

const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

// New Items
const newItems = {
  "caterium_ore": { "name": "Катериевая руда", "icon": "/icons/Items/CateriumOre.png", "type": "solid" },
  "caterium_ingot": { "name": "Катериевый слиток", "icon": "/icons/Items/CateriumIngot.png", "type": "solid" },
  "quickwire": { "name": "Катериевая проволока", "icon": "/icons/Items/Quickwire.png", "type": "solid" },
  "sam_ore": { "name": "SAM Ore", "icon": "/icons/Items/SameOre.png", "type": "solid" },
  "reanimated_sam": { "name": "Reanimated SAM", "icon": "/icons/Items/ReanimatedSam.png", "type": "solid" },
  "sulfur": { "name": "Сера", "icon": "/icons/Items/Sulfur.png", "type": "solid" },
  "sulfuric_acid": { "name": "Серная кислота", "icon": "/icons/Items/SulfuricAcid.png", "type": "fluid" },
  "nitrogen_gas": { "name": "Азотный газ", "icon": "/icons/Items/NitrogenGas.png", "type": "fluid" },
  "quartz_crystal": { "name": "Кварцевый кристалл", "icon": "/icons/Items/QuartzCrystal.png", "type": "solid" },
  "crystal_oscillator": { "name": "Кристаллический осциллятор", "icon": "/icons/Items/CrystalOscillator.png", "type": "solid" },
  "aluminum_casing": { "name": "Алюминиевый корпус", "icon": "/icons/Items/AluminiumCasing.png", "type": "solid" },
  "aluminum_sheet": { "name": "Алюминиевый лист", "icon": "/icons/Items/AluminiumSheet.png", "type": "solid" },
  "copper_powder": { "name": "Медная пыль", "icon": "/icons/Items/CopperDust.png", "type": "solid" },
  "petroleum_coke": { "name": "Нефтяной кокс", "icon": "/icons/Items/PetroleumCoke.png", "type": "solid" },
  
  "ai_limiter": { "name": "Ограничитель ИИ", "icon": "/icons/Items/AILimiter.png", "type": "solid" },
  "high_speed_connector": { "name": "Высокоскоростной коннектор", "icon": "/icons/Items/HighSpeedConnector.png", "type": "solid" },
  "supercomputer": { "name": "Суперкомпьютер", "icon": "/icons/Items/Computer.png", "type": "solid" },
  "radio_control_unit": { "name": "Блок радиоуправления", "icon": "/icons/Items/RadioControlUnit.png", "type": "solid" },
  
  "smart_plating": { "name": "Умная обшивка", "icon": "/icons/Items/SpelevatorPart_1.png", "type": "solid" },
  "versatile_framework": { "name": "Универсальный каркас", "icon": "/icons/Items/SpelevatorPart_2.png", "type": "solid" },
  "automated_wiring": { "name": "Автоматизированная проводка", "icon": "/icons/Items/SpelevatorPart_3.png", "type": "solid" },
  "modular_engine": { "name": "Модульный двигатель", "icon": "/icons/Items/Engine.png", "type": "solid" },
  "adaptive_control_unit": { "name": "Адаптивный блок управления", "icon": "/icons/Items/SpelevatorPart_4.png", "type": "solid" },
  
  "electromagnetic_control_rod": { "name": "ЭМ-Стержень", "icon": "/icons/Items/ElectromagneticControlRod.png", "type": "solid" },
  "battery": { "name": "Батарея", "icon": "/icons/Items/Battery.png", "type": "solid" },
  "heatsink": { "name": "Радиатор", "icon": "/icons/Items/Heatsink.png", "type": "solid" },
  "cooling_system": { "name": "Система охлаждения", "icon": "/icons/Items/CoolingSystem.png", "type": "solid" },
  "turbo_motor": { "name": "Турбомотор", "icon": "/icons/Items/TurboMotor.png", "type": "solid" },
  "fused_modular_frame": { "name": "Сплавленный модульный каркас", "icon": "/icons/Items/FusedModularFrame.png", "type": "solid" },
  "pressure_conversion_cube": { "name": "Куб преобразования давления", "icon": "/icons/Items/PressureTank.png", "type": "solid" },
  
  "nuclear_pasta": { "name": "Nuclear Pasta", "icon": "/icons/Items/NuclearPasta.png", "type": "solid" },
  "magnetic_field_generator": { "name": "Magnetic Field Generator", "icon": "/icons/Items/MagneticFieldGenerator.png", "type": "solid" },
  "thermal_propulsion_rocket": { "name": "Thermal Propulsion Rocket", "icon": "/icons/Items/ThermalPropulsionRocket.png", "type": "solid" },
  "assembly_director_system": { "name": "Assembly Director System", "icon": "/icons/Items/AssemblyDirectorSystem.png", "type": "solid" },
  
  "diamonds": { "name": "Алмазы", "icon": "/icons/Items/Diamonds.png", "type": "solid" },
  "time_crystal": { "name": "Кристалл Времени", "icon": "/icons/Items/TimeCrystal.png", "type": "solid" },
  "dark_energy": { "name": "Темная Энергия", "icon": "/icons/Items/DarkEnergy.png", "type": "solid" },
  "singularity_cell": { "name": "Ячейка Сингулярности", "icon": "/icons/Items/SingularityCell.png", "type": "solid" },
  "ficsonium": { "name": "Фиксоний", "icon": "/icons/Items/FicsoniumCell.png", "type": "solid" }
};

Object.assign(items, newItems);

const newRecipes = [
  { "id": "petroleum_coke", "name": "Petroleum Coke", "buildingId": "refinery", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "heavy_oil_residue", "rate": 40 }], "outputs": [{ "itemId": "petroleum_coke", "rate": 120 }] },
  { "id": "aluminum_casing", "name": "Aluminum Casing", "buildingId": "constructor", "isAlternate": false, "duration": 2, "inputs": [{ "itemId": "aluminum_ingot", "rate": 90 }], "outputs": [{ "itemId": "aluminum_casing", "rate": 60 }] },
  { "id": "aluminum_sheet", "name": "Aluminum Sheet", "buildingId": "assembler", "isAlternate": false, "duration": 2, "inputs": [{ "itemId": "aluminum_ingot", "rate": 30 }, { "itemId": "copper_ingot", "rate": 10 }], "outputs": [{ "itemId": "aluminum_sheet", "rate": 30 }] },
  { "id": "copper_powder", "name": "Copper Powder", "buildingId": "constructor", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "copper_ingot", "rate": 300 }], "outputs": [{ "itemId": "copper_powder", "rate": 50 }] },
  
  { "id": "caterium_ingot", "name": "Caterium Ingot", "buildingId": "smelter", "isAlternate": false, "duration": 4, "inputs": [{ "itemId": "caterium_ore", "rate": 45 }], "outputs": [{ "itemId": "caterium_ingot", "rate": 15 }] },
  { "id": "quickwire", "name": "Quickwire", "buildingId": "constructor", "isAlternate": false, "duration": 5, "inputs": [{ "itemId": "caterium_ingot", "rate": 12 }], "outputs": [{ "itemId": "quickwire", "rate": 60 }] },
  
  { "id": "quartz_crystal", "name": "Quartz Crystal", "buildingId": "constructor", "isAlternate": false, "duration": 8, "inputs": [{ "itemId": "raw_quartz", "rate": 37.5 }], "outputs": [{ "itemId": "quartz_crystal", "rate": 22.5 }] },
  { "id": "crystal_oscillator", "name": "Crystal Oscillator", "buildingId": "manufacturer", "isAlternate": false, "duration": 120, "inputs": [{ "itemId": "quartz_crystal", "rate": 18 }, { "itemId": "cable", "rate": 14 }, { "itemId": "reinforced_iron_plate", "rate": 2.5 }], "outputs": [{ "itemId": "crystal_oscillator", "rate": 1 }] },
  
  { "id": "sulfuric_acid", "name": "Sulfuric Acid", "buildingId": "refinery", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "sulfur", "rate": 50 }, { "itemId": "water", "rate": 50 }], "outputs": [{ "itemId": "sulfuric_acid", "rate": 50 }] },
  { "id": "battery", "name": "Battery", "buildingId": "blender", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "sulfuric_acid", "rate": 50 }, { "itemId": "alumina_solution", "rate": 40 }, { "itemId": "aluminum_casing", "rate": 20 }], "outputs": [{ "itemId": "battery", "rate": 20 }, { "itemId": "water", "rate": 30 }] },
  
  { "id": "ai_limiter", "name": "AI Limiter", "buildingId": "assembler", "isAlternate": false, "duration": 12, "inputs": [{ "itemId": "copper_sheet", "rate": 25 }, { "itemId": "quickwire", "rate": 100 }], "outputs": [{ "itemId": "ai_limiter", "rate": 5 }] },
  { "id": "electromagnetic_control_rod", "name": "EM Control Rod", "buildingId": "assembler", "isAlternate": false, "duration": 30, "inputs": [{ "itemId": "stator", "rate": 1.5 }, { "itemId": "ai_limiter", "rate": 1 }], "outputs": [{ "itemId": "electromagnetic_control_rod", "rate": 1 }] },
  { "id": "high_speed_connector", "name": "High-Speed Connector", "buildingId": "manufacturer", "isAlternate": false, "duration": 16, "inputs": [{ "itemId": "quickwire", "rate": 210 }, { "itemId": "cable", "rate": 37.5 }, { "itemId": "circuit_board", "rate": 3.75 }], "outputs": [{ "itemId": "high_speed_connector", "rate": 3.75 }] },
  { "id": "supercomputer", "name": "Supercomputer", "buildingId": "manufacturer", "isAlternate": false, "duration": 32, "inputs": [{ "itemId": "computer", "rate": 3.75 }, { "itemId": "ai_limiter", "rate": 3.75 }, { "itemId": "high_speed_connector", "rate": 5.625 }, { "itemId": "plastic", "rate": 52.5 }], "outputs": [{ "itemId": "supercomputer", "rate": 1.875 }] },
  { "id": "radio_control_unit", "name": "Radio Control Unit", "buildingId": "manufacturer", "isAlternate": false, "duration": 48, "inputs": [{ "itemId": "aluminum_casing", "rate": 40 }, { "itemId": "crystal_oscillator", "rate": 1 }, { "itemId": "computer", "rate": 1 }], "outputs": [{ "itemId": "radio_control_unit", "rate": 2 }] },
  
  { "id": "heatsink", "name": "Heat Sink", "buildingId": "assembler", "isAlternate": false, "duration": 8, "inputs": [{ "itemId": "aluminum_sheet", "rate": 37.5 }, { "itemId": "copper_sheet", "rate": 22.5 }], "outputs": [{ "itemId": "heatsink", "rate": 7.5 }] },
  { "id": "cooling_system", "name": "Cooling System", "buildingId": "blender", "isAlternate": false, "duration": 10, "inputs": [{ "itemId": "heatsink", "rate": 12 }, { "itemId": "rubber", "rate": 12 }, { "itemId": "water", "rate": 30 }, { "itemId": "nitrogen_gas", "rate": 150 }], "outputs": [{ "itemId": "cooling_system", "rate": 6 }] },
  { "id": "fused_modular_frame", "name": "Fused Modular Frame", "buildingId": "blender", "isAlternate": false, "duration": 60, "inputs": [{ "itemId": "heavy_modular_frame", "rate": 1 }, { "itemId": "aluminum_casing", "rate": 50 }, { "itemId": "nitrogen_gas", "rate": 25 }], "outputs": [{ "itemId": "fused_modular_frame", "rate": 1 }] },
  { "id": "turbo_motor", "name": "Turbo Motor", "buildingId": "manufacturer", "isAlternate": false, "duration": 32, "inputs": [{ "itemId": "cooling_system", "rate": 3.75 }, { "itemId": "radio_control_unit", "rate": 1.875 }, { "itemId": "motor", "rate": 3.75 }, { "itemId": "rubber", "rate": 45 }], "outputs": [{ "itemId": "turbo_motor", "rate": 1.875 }] },
  { "id": "pressure_conversion_cube", "name": "Pressure Conversion Cube", "buildingId": "assembler", "isAlternate": false, "duration": 60, "inputs": [{ "itemId": "fused_modular_frame", "rate": 1 }, { "itemId": "radio_control_unit", "rate": 2 }], "outputs": [{ "itemId": "pressure_conversion_cube", "rate": 1 }] },

  { "id": "smart_plating", "name": "Smart Plating", "buildingId": "assembler", "isAlternate": false, "duration": 30, "inputs": [{ "itemId": "reinforced_iron_plate", "rate": 2 }, { "itemId": "rotor", "rate": 2 }], "outputs": [{ "itemId": "smart_plating", "rate": 2 }] },
  { "id": "versatile_framework", "name": "Versatile Framework", "buildingId": "assembler", "isAlternate": false, "duration": 24, "inputs": [{ "itemId": "modular_frame", "rate": 1 }, { "itemId": "steel_beam", "rate": 12 }], "outputs": [{ "itemId": "versatile_framework", "rate": 2.5 }] },
  { "id": "automated_wiring", "name": "Automated Wiring", "buildingId": "assembler", "isAlternate": false, "duration": 24, "inputs": [{ "itemId": "stator", "rate": 2.5 }, { "itemId": "cable", "rate": 50 }], "outputs": [{ "itemId": "automated_wiring", "rate": 2.5 }] },
  { "id": "modular_engine", "name": "Modular Engine", "buildingId": "manufacturer", "isAlternate": false, "duration": 60, "inputs": [{ "itemId": "motor", "rate": 2 }, { "itemId": "rubber", "rate": 15 }, { "itemId": "smart_plating", "rate": 2 }], "outputs": [{ "itemId": "modular_engine", "rate": 1 }] },
  { "id": "adaptive_control_unit", "name": "Adaptive Control Unit", "buildingId": "manufacturer", "isAlternate": false, "duration": 60, "inputs": [{ "itemId": "automated_wiring", "rate": 7.5 }, { "itemId": "circuit_board", "rate": 5 }, { "itemId": "heavy_modular_frame", "rate": 1 }, { "itemId": "computer", "rate": 1 }], "outputs": [{ "itemId": "adaptive_control_unit", "rate": 1 }] },
  
  { "id": "nuclear_pasta", "name": "Nuclear Pasta", "buildingId": "particle_accelerator", "isAlternate": false, "duration": 120, "inputs": [{ "itemId": "copper_powder", "rate": 100 }, { "itemId": "pressure_conversion_cube", "rate": 0.5 }], "outputs": [{ "itemId": "nuclear_pasta", "rate": 0.5 }] },
  { "id": "magnetic_field_generator", "name": "Magnetic Field Generator", "buildingId": "manufacturer", "isAlternate": false, "duration": 120, "inputs": [{ "itemId": "versatile_framework", "rate": 2.5 }, { "itemId": "electromagnetic_control_rod", "rate": 1 }, { "itemId": "battery", "rate": 5 }], "outputs": [{ "itemId": "magnetic_field_generator", "rate": 1 }] },
  { "id": "thermal_propulsion_rocket", "name": "Thermal Propulsion Rocket", "buildingId": "manufacturer", "isAlternate": false, "duration": 120, "inputs": [{ "itemId": "modular_engine", "rate": 2.5 }, { "itemId": "turbo_motor", "rate": 1 }, { "itemId": "cooling_system", "rate": 3 }, { "itemId": "fused_modular_frame", "rate": 1 }], "outputs": [{ "itemId": "thermal_propulsion_rocket", "rate": 1 }] },
  { "id": "assembly_director_system", "name": "Assembly Director System", "buildingId": "assembler", "isAlternate": false, "duration": 80, "inputs": [{ "itemId": "adaptive_control_unit", "rate": 1.5 }, { "itemId": "supercomputer", "rate": 0.75 }], "outputs": [{ "itemId": "assembly_director_system", "rate": 0.75 }] },
  
  { "id": "reanimated_sam", "name": "Reanimated SAM", "buildingId": "constructor", "isAlternate": false, "duration": 2, "inputs": [{ "itemId": "sam_ore", "rate": 30 }], "outputs": [{ "itemId": "reanimated_sam", "rate": 30 }] },
  { "id": "diamonds", "name": "Diamonds", "buildingId": "constructor", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "coal", "rate": 600 }], "outputs": [{ "itemId": "diamonds", "rate": 10 }] },
  { "id": "dark_energy", "name": "Dark Energy", "buildingId": "blender", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "reanimated_sam", "rate": 20 }, { "itemId": "water", "rate": 20 }], "outputs": [{ "itemId": "dark_energy", "rate": 10 }] },
  { "id": "time_crystal", "name": "Time Crystal", "buildingId": "manufacturer", "isAlternate": false, "duration": 6, "inputs": [{ "itemId": "diamonds", "rate": 10 }, { "itemId": "dark_energy", "rate": 10 }], "outputs": [{ "itemId": "time_crystal", "rate": 10 }] },
  { "id": "singularity_cell", "name": "Singularity Cell", "buildingId": "quantum_encoder", "isAlternate": false, "duration": 60, "inputs": [{ "itemId": "nuclear_pasta", "rate": 1 }, { "itemId": "dark_energy", "rate": 5 }, { "itemId": "iron_plate", "rate": 100 }, { "itemId": "concrete", "rate": 200 }], "outputs": [{ "itemId": "singularity_cell", "rate": 1 }] },
  { "id": "ficsonium", "name": "Ficsonium", "buildingId": "particle_accelerator", "isAlternate": false, "duration": 60, "inputs": [{ "itemId": "nuclear_pasta", "rate": 1 }, { "itemId": "dark_energy", "rate": 10 }], "outputs": [{ "itemId": "ficsonium", "rate": 1 }] }
];

const existingIds = new Set(recipes.map(r => r.id));
newRecipes.forEach(nr => {
  if (!existingIds.has(nr.id)) recipes.push(nr);
});

fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2));
fs.writeFileSync(recipesPath, JSON.stringify(recipes, null, 2));
