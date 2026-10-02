# 🏭 FICSIT Architect & Production Calculator (Satisfactory 1.0)

Welcome to **FICSIT Architect** — a specialized web-based CAD and planning tool designed for *Satisfactory 1.0*. 

Unlike standard "raw numbers" calculators, FICSIT Architect is built to feel like actual corporate software. It helps you visualize your world's logistics at a macro level, and design physical factories (manifolds, belts, and mergers) at a micro level.

🌐 **[Live Demo (Play Here)](https://ziyadabek.github.io/ficsit-town-manager/)**

## ✨ Core Features

### 🌍 Global Logistics Map (Main Bus Routing)
A zoomed-out view of your entire campaign. By utilizing advanced orthogonal routing, it organizes parallel inputs and outputs into a neat, massive **"Main Bus"** (just like a PCB circuit board). Track exactly where your resources are flowing globally without messy, overlapping lines!

### 🏭 Interactive Floor Planner
Plan your factories as actual DAG (Directed Acyclic Graph) blueprints. The built-in Linear Programming solver breaks down your target items and recipes into the exact physical machines you need (e.g. `10.4 Smelters`).

### ⚡ Smart Power Planner
Plan your power infrastructure end-to-end. Input your target Megawatts, and the solver calculates everything from the crude oil extractor straight to the fuel generator, presented in an industrial SCADA dashboard.

### 🔒 Freeze & Lock Stages *(In Development)*
Finished building a factory in-game? "Lock" the stage. The solver will cache its production and bypass it when you unlock new alternative recipes, ensuring your physical factories don't theoretically break when global math changes.

## 🛠️ Tech Stack
- **React 19** + **Vite**
- **TailwindCSS** (Industrial FICSIT styling)
- **Zustand** (Global state management)
- **@xyflow/react** (React Flow) + **Dagre** (Graph visualization & Auto-layout)
- **javascript-lp-solver** (Simplex algorithm for recipe optimization)

## 🤝 Contributing & Feedback

**First and foremost:** If you find a bug, please tell me first by opening an Issue!

Have a cool idea or suggestion? You have two options:
1. **Share your idea:** Open an Issue here and let's discuss it.
2. **Code it yourself:** Fork the repo, create a new branch, make your changes, and submit a Pull Request.

Whether you are a UI/UX designer, a React developer, or a math wizard who loves optimization algorithms, your contributions are highly welcome.

### Getting Started Locally:
1. Clone the repository: `git clone https://github.com/ziyadabek/ficsit-town-manager.git`
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`

## 📜 Roadmap
Check out our [ROADMAP.md](./ROADMAP.md) for planned features including:
- Drill-down Micro Layouts (generating 2D manifold blueprints)
- AWESOME Sink Economy tracker
- 3D Blueprint `.sbp` viewer

---
*FICSIT Inc. does not endorse spaghetti factories. Stay Effective.*
