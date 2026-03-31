/**
 * MathX - State Manager
 * Persistent state management using LocalStorage
 * Supports practice progress + sub-level (difficulty) completion tracking
 */

const STORAGE_KEY = 'mathx_state';

const DEFAULT_STATE = {
  // Player info
  playerName: 'Maverick',
  
  // Economy
  balance: 0,
  goldenPlectrums: 0,
  
  // Progress
  currentLevel: 1,
  highestLevel: 1,
  levelStars: {}, // { "1": 3, "2": 2, ... }
  
  /**
   * Practice progress per level per operation
   * { "1": { "+": 80, "-": 100, "×": 40, "÷": 0 }, ... }
   * Once all available ops reach 100, sub-levels for that level are unlocked
   */
  practiceProgress: {},
  
  /**
   * Sub-level completion tracking
   * { "1": { "chill": true, "vibe": false, "goat": false }, ... }
   * User must complete all 3 sub-levels to unlock next level
   */
  subLevelCompleted: {},
  
  // Streak
  streakCount: 0,
  lastPlayDate: null,
  streakRewardCollected: false,
  
  // Inventory (owned items)
  inventory: {
    safetyPins: 0,
    timeWarps: 0,
    greatEscapes: 0,
    coffeeBoosts: 0,
    streakFreezes: 0,
  },
  
  // Unlocked themes
  unlockedThemes: ['midnights'],
  currentTheme: 'midnights',
  
  // Unlocked status effects
  holographicName: false,
  
  // Sound settings
  enterSound: 'default',
  unlockedSounds: ['default'],
  
  // Active boosts
  coffeeBoostExpiry: null,
  streakFreezeActive: false,
  
  // Stats
  totalGamesPlayed: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  bestStreak: 0,
  totalCoinsEarned: 0,
  perfectSets: 0,
  lucky13Count: 0,
  
  // Daily Challenge
  dailyChallenge: {
    date: null,
    progress: 0,
    target: 3,
    rewardClaimed: false,
    rewardCoins: 1000,
    rewardPlectrums: 10
  },
  
  // Settings
  haptics: true,
  soundEffects: true,
};

class StateManager {
  constructor() {
    this.state = this._load();
    this.listeners = new Map();
  }

  _load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this._deepMerge(structuredClone(DEFAULT_STATE), parsed);
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    return structuredClone(DEFAULT_STATE);
  }

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && key in target && typeof target[key] === 'object') {
        target[key] = this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this._save();
    this._notify(key, value);
  }

  update(updates) {
    Object.assign(this.state, updates);
    this._save();
    for (const key of Object.keys(updates)) {
      this._notify(key, updates[key]);
    }
  }

  addCoins(amount) {
    this.state.balance += amount;
    this.state.totalCoinsEarned += amount;
    this._save();
    this._notify('balance', this.state.balance);
  }

  spendCoins(amount) {
    if (this.state.balance < amount) return false;
    this.state.balance -= amount;
    this._save();
    this._notify('balance', this.state.balance);
    return true;
  }

  spendPlectrums(amount) {
    if (this.state.goldenPlectrums < amount) return false;
    this.state.goldenPlectrums -= amount;
    this._save();
    this._notify('goldenPlectrums', this.state.goldenPlectrums);
    return true;
  }

  addItem(itemKey, count = 1) {
    if (this.state.inventory[itemKey] !== undefined) {
      this.state.inventory[itemKey] += count;
      this._save();
      this._notify('inventory', this.state.inventory);
    }
  }

  useItem(itemKey) {
    if (this.state.inventory[itemKey] > 0) {
      this.state.inventory[itemKey]--;
      this._save();
      this._notify('inventory', this.state.inventory);
      return true;
    }
    return false;
  }

  // ==============================
  // PRACTICE PROGRESS
  // ==============================

  /**
   * Get practice points for a level + operation
   */
  getPracticePoints(level, op) {
    const prog = this.state.practiceProgress[String(level)];
    if (!prog) return 0;
    return prog[op] || 0;
  }

  /**
   * Add practice points for a level + operation
   */
  addPracticePoints(level, op, points) {
    if (!this.state.practiceProgress[String(level)]) {
      this.state.practiceProgress[String(level)] = {};
    }
    const current = this.state.practiceProgress[String(level)][op] || 0;
    this.state.practiceProgress[String(level)][op] = Math.min(current + points, 100);
    this._save();
    this._notify('practiceProgress', this.state.practiceProgress);
  }

  /**
   * Check if practice is complete for all operations at a level
   * (all available ops have >= 100 points)
   */
  isPracticeComplete(level, availableOps) {
    const prog = this.state.practiceProgress[String(level)];
    if (!prog) return false;
    return availableOps.every(op => (prog[op] || 0) >= 100);
  }

  /**
   * Are sub-levels (quizzes) unlocked for this level?
   */
  areSubLevelsUnlocked(level, availableOps) {
    return this.isPracticeComplete(level, availableOps);
  }

  // ==============================
  // SUB-LEVEL COMPLETION
  // ==============================

  /**
   * Mark a sub-level as completed
   */
  completeSubLevel(level, difficulty) {
    if (!this.state.subLevelCompleted[String(level)]) {
      this.state.subLevelCompleted[String(level)] = {};
    }
    this.state.subLevelCompleted[String(level)][difficulty] = true;
    this._save();
    this._notify('subLevelCompleted', this.state.subLevelCompleted);
  }

  /**
   * Check if a specific sub-level is completed
   */
  isSubLevelCompleted(level, difficulty) {
    const sub = this.state.subLevelCompleted[String(level)];
    if (!sub) return false;
    return !!sub[difficulty];
  }

  /**
   * Check if all 3 sub-levels are completed for a level
   */
  areAllSubLevelsCompleted(level) {
    const sub = this.state.subLevelCompleted[String(level)];
    if (!sub) return false;
    return !!sub['chill'] && !!sub['vibe'] && !!sub['goat'];
  }

  /**
   * Can the user access the next level?
   * They must have all 3 sub-levels completed at the current level
   */
  canAccessLevel(level) {
    if (level === 1) return true;
    return this.areAllSubLevelsCompleted(level - 1);
  }

  /**
   * Recalculate the current level based on sub-level completions
   * This updates currentLevel to the highest accessible level
   */
  recalculateCurrentLevel() {
    let maxLevel = 1;
    for (let lvl = 1; lvl <= 10; lvl++) {
      if (this.canAccessLevel(lvl)) {
        maxLevel = lvl;
      } else {
        break;
      }
    }
    if (maxLevel !== this.state.currentLevel) {
      this.state.currentLevel = maxLevel;
      this.state.highestLevel = Math.max(this.state.highestLevel, maxLevel);
      this._save();
      this._notify('currentLevel', maxLevel);
    }
    return maxLevel;
  }

  // ==============================
  // STATUS / TITLES
  // ==============================

  getStatusTitle() {
    const level = this.state.currentLevel;
    if (level <= 2) return 'The Penny';
    if (level <= 5) return 'Intern';
    if (level <= 7) return 'The Eras Tour';
    if (level <= 9) return 'Legend';
    return 'Mastermind';
  }

  getStatusEmoji() {
    const level = this.state.currentLevel;
    if (level <= 2) return '🪙';
    if (level <= 5) return '💼';
    if (level <= 7) return '🌟';
    if (level <= 9) return '👑';
    return '🧠';
  }

  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  off(key, callback) {
    if (this.listeners.has(key)) {
      const cbs = this.listeners.get(key);
      const idx = cbs.indexOf(callback);
      if (idx !== -1) cbs.splice(idx, 1);
    }
  }

  _notify(key, value) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => cb(value));
    }
  }

  // Check and update daily streak
  checkStreak() {
    const today = new Date().toDateString();
    const lastPlay = this.state.lastPlayDate;
    
    if (!lastPlay) {
      this.update({ streakCount: 1, lastPlayDate: today, streakRewardCollected: false });
      return;
    }
    
    if (lastPlay === today) {
      return;
    }
    
    const lastDate = new Date(lastPlay);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      if (this.state.streakCount > 0 && lastPlay === today) {
         // Should not trigger as we checked if lastPlay === today above, but just in case
      }
    } else if (diffDays > 1) {
      if (this.state.streakFreezeActive) {
        this.update({
          streakFreezeActive: false,
        });
      } else {
        this.update({
          streakCount: 0,
          streakRewardCollected: false,
        });
      }
    }
  }

  // We increase the streak explicitly via playing a game, not just by opening app.
  incrementStreak() {
    const today = new Date().toDateString();
    let { streakCount, lastPlayDate, bestStreak } = this.state;
    
    // If they already increased today, do nothing.
    if (lastPlayDate === today && streakCount > 0) return false;

    // Otherwise, increment it.
    const newStreak = streakCount + 1;
    this.update({
      streakCount: newStreak,
      lastPlayDate: today,
      streakRewardCollected: false,
      bestStreak: Math.max(newStreak, bestStreak),
    });
    return true;
  }
  
  // --- Daily Challenge ---
  checkDailyChallenge() {
    const today = new Date().toDateString();
    if (this.state.dailyChallenge.date !== today) {
      this.state.dailyChallenge = {
        date: today,
        progress: 0,
        target: 3, // Complete 3 sets
        rewardClaimed: false,
        rewardCoins: 1000,
        rewardPlectrums: 10
      };
      this._save();
      this._notify('dailyChallenge', this.state.dailyChallenge);
    }
  }

  addChallengeProgress() {
    this.checkDailyChallenge();
    if (this.state.dailyChallenge.progress < this.state.dailyChallenge.target) {
      this.state.dailyChallenge.progress += 1;
      this._save();
      this._notify('dailyChallenge', this.state.dailyChallenge);
    }
  }

  claimChallengeReward() {
    const dc = this.state.dailyChallenge;
    if (dc.progress >= dc.target && !dc.rewardClaimed) {
      dc.rewardClaimed = true;
      this.addCoins(dc.rewardCoins);
      this.state.goldenPlectrums += dc.rewardPlectrums;
      this._save();
      this._notify('dailyChallenge', dc);
      this._notify('goldenPlectrums', this.state.goldenPlectrums);
      return { coins: dc.rewardCoins, plectrums: dc.rewardPlectrums };
    }
    return null;
  }

  getStreakReward() {
    const streak = this.state.streakCount;
    const reward = Math.min(Math.pow(2, streak), 10000);
    return reward;
  }

  collectStreakReward() {
    if (this.state.streakRewardCollected) return 0;
    const reward = this.getStreakReward();
    this.addCoins(reward);
    this.set('streakRewardCollected', true);
    return reward;
  }

  isCoffeeBoostActive() {
    if (!this.state.coffeeBoostExpiry) return false;
    return Date.now() < this.state.coffeeBoostExpiry;
  }

  activateCoffeeBoost() {
    const expiry = Date.now() + 30 * 60 * 1000; // 30 minutes
    this.set('coffeeBoostExpiry', expiry);
  }

  resetState() {
    this.state = structuredClone(DEFAULT_STATE);
    this._save();
  }
}

export const state = new StateManager();
