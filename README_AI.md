# 🦾 README_AI: The AI Agent's Guide to MathX 🧠🤖

Welcome, fellow agent! This file is designed for **you**. If you are here to refactor, debug, or extend the MathX universe, please follow these core principles.

## 🏗 Project Architecture

MathX is a **Local-First, Event-Driven** application. It avoids complex frameworks (like React/Vue) to maintain peak performance on mobile devices.

### 🔑 Key Files & Responsibilities

- **`src/state.js`**: Use this as the **Single Source of Truth**. It handles all LocalStorage persistence and state-change notifications. 
  - *Recommendation:* Always use `state.on('key', callback)` to sync your UI with state changes. Do NOT bypass the StateManager.
- **`src/app.js`**: This is the **Main Application Controller**. It handles screen navigation (Path, Game, Result, Shop, Profile) and DOM rendering.
- **`src/engine.js`**: Contains the **Mathematical Core**. This is where problem generation logic, correct-answer verification, and level configuration live.
- **`src/shop-data.js`**: Central repository for all purchasable items, themes, and powerups. 
  - *Rule:* If adding a theme, define its JSON here before applying CSS.
- **`src/styles/index.css`**: The **Design System**. It uses CSS Variables for all themes (`data-theme="xxx"`).

## 🚀 Workflows for Agents

### Adding a New Theme
1. **JSON Configuration:** Add the new theme object (ID, Price, Description, Emoji) into `src/shop-data.js`.
2. **CSS Injection:** Define the new theme variables (e.g., `[data-theme="newtheme"]`) in `src/styles/index.css`.
3. **Animated Backgrounds:** Use `body::before` with a high Z-index (negative) for background animations that won't interfere with gameplay.

### Expanding the Shop
- All items in `src/shop-data.js` must have a `currency` key (`coins` or `plectrums`).
- If adding a permanent status effect (like a "Golden Aura"), ensure you update `src/state.js` to track it as a boolean.

### Debugging the Gameloop
- The game loop logic lives in `src/app.js`'s `submitAnswer()` and `completeSet()` methods. 
- Use `this.handlePostGameUpdates()` to hook into game-end events (e.g., streaks, daily challenges).

## ⚠️ Critical Constraints

1. **Aesthetics are Non-Negotiable:** Every UI change MUST feel premium. Use Haptics (via `audio.js`) and Sparkles (via `spawnSparkles` in `app.js`) for success events.
2. **Mobile Compatibility:** Always test how elements stack. Assume a narrow viewport. 
3. **No External Dependencies:** Avoid adding new npm packages unless strictly necessary for Capacitor/Native functionality. Keep the bundle footprint small.

## 🏆 Current High-Ground Goals

- **Daily Challenges:** Currently handles 3 sets/day. Can be extended to specific operation goals (e.g., "5 Multiplication sets").
- **Exclusives Shop:** Uses `plectrums`. Expand this with "Mastermind Titles" or "Sound Packs".

Good luck, Agent. **Keep the Code clean and the XP rewards high.**
