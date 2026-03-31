# MathX: The Mastermind Eras Tour 🎸🧠

A high-performance, premium mental math application designed for Gen Z and Gen Alpha. Features vibrant aesthetics, deep gamification, and a production-grade mobile experience built with Capacitor.

## ✨ Features

- **The Eras Tour Themes:** Multiple immersive themes including *Midnights*, *Barbie*, *Oppenheimer*, *Hacker*, and *Lover*—each with custom CSS animations and unique visual styles.
- **Deep Economy:** Earn **Coins** and exclusive **Golden Plectrums** to unlock prestigious shop items and status effects.
- **Gamified Progression:** 10 levels of mental math difficulty. Progress through practice drills to unlock competitive "Sub-Level" quizzes (Chill, Vibe, GOAT).
- **Daily Challenges:** Complete set goals every day to earn massive rewards and maintain your streak.
- **Power-ups & Boosts:** Strategize with *Safety Pins*, *Time Warps*, *Auto-Solves*, and *Coffee Boosts*.
- **Data Portability:** Local-first state management with the ability to export and import your save file directly from the profile.

## 🛠 Tech Stack

- **Core:** HTML5, Vanilla JavaScript (ES Modules).
- **Styling:** Custom CSS Design System (no frameworks) with dynamic themes.
- **Bridge:** [Capacitor](https://capacitorjs.com/) for native Android/iOS integration.
- **Build Tool:** [Vite](https://vitejs.dev/) for lightning-fast development and optimized production builds.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Android Studio](https://developer.android.com/studio) (for mobile builds)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tarunchandel/mathx.git
   cd mathx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

### Building for Android

1. Build the web assets:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

## 📜 License

Created for the TopGun Math Mission. All rights reserved.
