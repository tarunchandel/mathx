/**
 * MathX - State Manager (Multi-Profile)
 *
 * Storage layout:
 *   mathx_meta            — { profiles: [...], activeProfileId, version }
 *   mathx_state_<id>      — per-profile state
 *
 * Legacy single-profile saves under "mathx_state" are auto-migrated on load.
 */

const META_KEY = 'mathx_meta';
const PROFILE_PREFIX = 'mathx_state_';
const LEGACY_KEY = 'mathx_state';

const DEFAULT_STATE = {
  // Player info
  playerName: 'Maverick',

  // Economy
  balance: 0,
  goldenPlectrums: 0,

  // Progress
  currentLevel: 1,
  highestLevel: 1,
  levelStars: {},

  practiceProgress: {},
  subLevelCompleted: {},

  // Streak
  streakCount: 0,
  lastPlayDate: null,
  streakRewardCollected: false,

  // Inventory
  inventory: {
    safetyPins: 0,
    timeWarps: 0,
    greatEscapes: 0,
    autoSolve: 0,
    fiftyFifty: 0,
    crystalBall: 0,
    hintMaster: 0,
    shieldWall: 0,
    doubleOrNothing: 0,
    phoneAFriend: 0,
    rewindTime: 0,
    mirrorMirror: 0,
    luckyClover: 0,
    goldRush: 0,
    coffeeBoosts: 0,
    streakFreezes: 0,
    weekendWarrior: 0,
    xpExtravaganza: 0,
    plectrumPower: 0,
    rocketFuel: 0,
    energyDrink: 0,
    morningSun: 0,
    doubleDip: 0,
    megaPhone: 0,
    turboTimer: 0,
    cloverChain: 0,
    comboCarnival: 0,
  },

  // Pre-quiz selected powerups (id -> 1 chosen for this run)
  selectedPowerups: {},

  // Themes
  unlockedThemes: ['midnights'],
  currentTheme: 'midnights',

  // Avatars (unlockedAvatars stores emoji keys)
  unlockedAvatars: [],
  currentAvatar: null,

  // Sounds
  enterSound: 'default',
  unlockedSounds: ['default'],

  // Status flags (legacy)
  holographicName: false,
  vipStatus: false,
  goldenAura: false,
  plectrumGod: false,

  // New status keys (statusKey-driven, see shop-data.js)
  rainbowAura: false,
  fireBadge: false,
  crownOfMath: false,
  starBurst: false,
  lightningTrail: false,
  roboBadge: false,
  unicornDust: false,
  galaxyName: false,
  piPin: false,
  midnightHalo: false,
  mastermindTitle: false,
  cosmicTrail: false,
  soundPackEpic: false,
  platinumFrame: false,
  diamondName: false,
  plectrum2xPerma: false,
  lifetimeCoffee: false,
  rockstarTitle: false,
  godModeBadge: false,
  activeStatusBadge: null,

  // Active boosts
  coffeeBoostExpiry: null,
  weekendWarriorExpiry: null,
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

// ---------- Profile Registry ----------

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return null;
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function ensureBootstrapped() {
  let meta = loadMeta();
  if (meta && Array.isArray(meta.profiles) && meta.profiles.length > 0) return meta;

  // Migrate legacy single-profile state, if present.
  let legacyState = null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) legacyState = JSON.parse(raw);
  } catch (_) { /* ignore */ }

  if (legacyState) {
    const id = 'profile_' + Date.now();
    const profile = {
      id,
      name: legacyState.playerName || 'Maverick',
      emoji: '🦸',
      createdAt: Date.now(),
    };
    localStorage.setItem(PROFILE_PREFIX + id, JSON.stringify(legacyState));
    meta = { profiles: [profile], activeProfileId: id, version: 2 };
    saveMeta(meta);
    // Keep legacy key as a backup (do not delete to be safe).
    return meta;
  }

  // Fresh install: no profiles yet — caller must show profile creation UI.
  meta = { profiles: [], activeProfileId: null, version: 2 };
  saveMeta(meta);
  return meta;
}

class StateManager {
  constructor() {
    this.meta = ensureBootstrapped();
    this.state = this._loadActive();
    this.listeners = new Map();
  }

  // ---------- Profile API ----------

  hasProfile() {
    return this.meta.profiles.length > 0 && !!this.meta.activeProfileId;
  }

  getProfiles() {
    return [...this.meta.profiles];
  }

  getActiveProfile() {
    return this.meta.profiles.find(p => p.id === this.meta.activeProfileId) || null;
  }

  createProfile(name, emoji = '🦸') {
    const id = 'profile_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const profile = { id, name: (name || 'New Player').slice(0, 20), emoji, createdAt: Date.now() };
    this.meta.profiles.push(profile);
    this.meta.activeProfileId = id;
    saveMeta(this.meta);

    const fresh = structuredClone(DEFAULT_STATE);
    fresh.playerName = profile.name;
    fresh.currentAvatar = emoji;
    localStorage.setItem(PROFILE_PREFIX + id, JSON.stringify(fresh));
    this.state = fresh;
    this._notifyAll();
    return profile;
  }

  switchProfile(id) {
    if (!this.meta.profiles.find(p => p.id === id)) return false;
    // persist current state first
    this._save();
    this.meta.activeProfileId = id;
    saveMeta(this.meta);
    this.state = this._loadActive();
    this._notifyAll();
    return true;
  }

  deleteProfile(id) {
    if (this.meta.profiles.length <= 1) return false; // never leave zero profiles
    this.meta.profiles = this.meta.profiles.filter(p => p.id !== id);
    localStorage.removeItem(PROFILE_PREFIX + id);
    if (this.meta.activeProfileId === id) {
      this.meta.activeProfileId = this.meta.profiles[0].id;
      this.state = this._loadActive();
      this._notifyAll();
    }
    saveMeta(this.meta);
    return true;
  }

  renameProfile(id, name, emoji) {
    const p = this.meta.profiles.find(x => x.id === id);
    if (!p) return false;
    if (name) p.name = name.slice(0, 20);
    if (emoji) p.emoji = emoji;
    saveMeta(this.meta);
    if (id === this.meta.activeProfileId) {
      if (name) { this.state.playerName = p.name; }
      if (emoji) { this.state.currentAvatar = emoji; }
      this._save();
      this._notify('playerName', this.state.playerName);
      this._notify('currentAvatar', this.state.currentAvatar);
    }
    return true;
  }

  // ---------- Internal storage ----------

  _activeKey() {
    return PROFILE_PREFIX + this.meta.activeProfileId;
  }

  _loadActive() {
    if (!this.meta.activeProfileId) return structuredClone(DEFAULT_STATE);
    try {
      const raw = localStorage.getItem(this._activeKey());
      if (raw) {
        return this._deepMerge(structuredClone(DEFAULT_STATE), JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to load profile state:', e);
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
    if (!this.meta.activeProfileId) return;
    try {
      localStorage.setItem(this._activeKey(), JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  _notifyAll() {
    for (const key of Object.keys(this.state)) this._notify(key, this.state[key]);
  }

  // ---------- Generic getters/setters ----------

  get(key) { return this.state[key]; }

  set(key, value) {
    this.state[key] = value;
    this._save();
    this._notify(key, value);
  }

  update(updates) {
    Object.assign(this.state, updates);
    this._save();
    for (const key of Object.keys(updates)) this._notify(key, updates[key]);
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
    if (!this.state.inventory) this.state.inventory = {};
    if (this.state.inventory[itemKey] === undefined) this.state.inventory[itemKey] = 0;
    this.state.inventory[itemKey] += count;
    this._save();
    this._notify('inventory', this.state.inventory);
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

  // Practice progress
  getPracticePoints(level, op) {
    const prog = this.state.practiceProgress[String(level)];
    if (!prog) return 0;
    return prog[op] || 0;
  }

  addPracticePoints(level, op, points) {
    if (!this.state.practiceProgress[String(level)]) this.state.practiceProgress[String(level)] = {};
    const current = this.state.practiceProgress[String(level)][op] || 0;
    this.state.practiceProgress[String(level)][op] = Math.min(current + points, 100);
    this._save();
    this._notify('practiceProgress', this.state.practiceProgress);
  }

  isPracticeComplete(level, availableOps) {
    const prog = this.state.practiceProgress[String(level)];
    if (!prog) return false;
    return availableOps.every(op => (prog[op] || 0) >= 100);
  }

  areSubLevelsUnlocked(level, availableOps) { return this.isPracticeComplete(level, availableOps); }

  completeSubLevel(level, difficulty) {
    if (!this.state.subLevelCompleted[String(level)]) this.state.subLevelCompleted[String(level)] = {};
    this.state.subLevelCompleted[String(level)][difficulty] = true;
    this._save();
    this._notify('subLevelCompleted', this.state.subLevelCompleted);
  }

  isSubLevelCompleted(level, difficulty) {
    const sub = this.state.subLevelCompleted[String(level)];
    return sub ? !!sub[difficulty] : false;
  }

  areAllSubLevelsCompleted(level) {
    const sub = this.state.subLevelCompleted[String(level)];
    if (!sub) return false;
    return !!sub.chill && !!sub.vibe && !!sub.goat;
  }

  canAccessLevel(level) {
    if (level === 1) return true;
    return this.areAllSubLevelsCompleted(level - 1);
  }

  recalculateCurrentLevel() {
    let maxLevel = 1;
    for (let lvl = 1; lvl <= 10; lvl++) {
      if (this.canAccessLevel(lvl)) maxLevel = lvl; else break;
    }
    if (maxLevel !== this.state.currentLevel) {
      this.state.currentLevel = maxLevel;
      this.state.highestLevel = Math.max(this.state.highestLevel, maxLevel);
      this._save();
      this._notify('currentLevel', maxLevel);
    }
    return maxLevel;
  }

  getStatusTitle() {
    if (this.state.mastermindTitle && this.state.activeStatusBadge === 'mastermindTitle') return 'Mastermind';
    if (this.state.rockstarTitle && this.state.activeStatusBadge === 'rockstarTitle') return 'Rockstar';
    if (this.state.plectrumGod) return 'Plectrum God';
    const level = this.state.currentLevel;
    if (level <= 2) return 'The Penny';
    if (level <= 5) return 'Intern';
    if (level <= 7) return 'The Eras Tour';
    if (level <= 9) return 'Legend';
    return 'Mastermind';
  }

  getStatusEmoji() {
    if (this.state.currentAvatar) return this.state.currentAvatar;
    const level = this.state.currentLevel;
    if (level <= 2) return '🪙';
    if (level <= 5) return '💼';
    if (level <= 7) return '🌟';
    if (level <= 9) return '👑';
    return '🧠';
  }

  on(key, callback) {
    if (!this.listeners.has(key)) this.listeners.set(key, []);
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
    if (this.listeners.has(key)) this.listeners.get(key).forEach(cb => cb(value));
  }

  // Streak
  checkStreak() {
    const today = new Date().toDateString();
    const lastPlay = this.state.lastPlayDate;
    if (!lastPlay) {
      this.update({ streakCount: 1, lastPlayDate: today, streakRewardCollected: false });
      return;
    }
    if (lastPlay === today) return;
    const diffDays = Math.round((new Date(today) - new Date(lastPlay)) / 86400000);
    if (diffDays > 1) {
      if (this.state.streakFreezeActive) this.update({ streakFreezeActive: false });
      else this.update({ streakCount: 0, streakRewardCollected: false });
    }
  }

  incrementStreak() {
    const today = new Date().toDateString();
    let { streakCount, lastPlayDate, bestStreak } = this.state;
    if (lastPlayDate === today && streakCount > 0) return false;
    const newStreak = streakCount + 1;
    this.update({
      streakCount: newStreak,
      lastPlayDate: today,
      streakRewardCollected: false,
      bestStreak: Math.max(newStreak, bestStreak),
    });
    return true;
  }

  // Daily Challenge
  checkDailyChallenge() {
    const today = new Date().toDateString();
    if (this.state.dailyChallenge.date !== today) {
      this.state.dailyChallenge = {
        date: today, progress: 0, target: 3,
        rewardClaimed: false, rewardCoins: 1000, rewardPlectrums: 10
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
    return Math.min(Math.pow(2, streak), 10000);
  }

  collectStreakReward() {
    if (this.state.streakRewardCollected) return 0;
    const reward = this.getStreakReward();
    this.addCoins(reward);
    this.set('streakRewardCollected', true);
    return reward;
  }

  isCoffeeBoostActive() {
    if (this.state.lifetimeCoffee) return true;
    if (!this.state.coffeeBoostExpiry) return false;
    return Date.now() < this.state.coffeeBoostExpiry;
  }

  activateCoffeeBoost() {
    const expiry = Date.now() + 30 * 60 * 1000;
    this.set('coffeeBoostExpiry', expiry);
  }

  isWeekendWarriorActive() {
    if (!this.state.weekendWarriorExpiry) return false;
    return Date.now() < this.state.weekendWarriorExpiry;
  }

  activateWeekendWarrior() {
    this.set('weekendWarriorExpiry', Date.now() + 60 * 60 * 1000);
  }

  resetState() {
    const fresh = structuredClone(DEFAULT_STATE);
    if (this.meta.activeProfileId) {
      const active = this.getActiveProfile();
      if (active) {
        fresh.playerName = active.name;
        fresh.currentAvatar = active.emoji;
      }
    }
    this.state = fresh;
    this._save();
    this._notifyAll();
  }

  // ---------- Multi-profile export/import ----------

  exportAll() {
    const out = { meta: this.meta, profiles: {} };
    for (const p of this.meta.profiles) {
      const raw = localStorage.getItem(PROFILE_PREFIX + p.id);
      out.profiles[p.id] = raw ? JSON.parse(raw) : null;
    }
    return out;
  }

  importAll(payload) {
    if (!payload || !payload.meta || !payload.profiles) {
      // Treat as legacy single-profile blob.
      if (payload && typeof payload === 'object') {
        this.update(payload);
        return true;
      }
      return false;
    }
    // Wipe existing profiles
    for (const p of this.meta.profiles) {
      localStorage.removeItem(PROFILE_PREFIX + p.id);
    }
    this.meta = payload.meta;
    saveMeta(this.meta);
    for (const id of Object.keys(payload.profiles)) {
      localStorage.setItem(PROFILE_PREFIX + id, JSON.stringify(payload.profiles[id]));
    }
    this.state = this._loadActive();
    this._notifyAll();
    return true;
  }
}

export const state = new StateManager();
