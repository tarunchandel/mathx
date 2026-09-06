/**
 * MathX - The Mastermind Eras Tour
 * Main Application Controller
 */

import { state } from './state.js';
import { 
  generateQuestionSet, checkAnswer, getLevelConfig, getDifficultyConfig, calculateCoins, LEVEL_CONFIG,
  generatePracticeSet, getAvailableOps, SKILL_CONFIG, PRACTICE_POINTS_REQUIRED, PRACTICE_POINTS_PER_CORRECT,
  getPrePracticeLesson
} from './engine.js';
import { getSmartTip, generateStepByStepMentalSolution } from './tips.js';
import { SHOP_CATEGORIES, getShopItems, getShopCategories, getItemStatus } from './shop-data.js';
import { SFX, Haptics } from './audio.js';

export class App {
  constructor() {
    this.currentScreen = 'path';
    this.gameState = null;
    this.timerInterval = null;
    this.questionStartTime = null;
  }

  init() {
    this._attachGlobalKeyHandler();
    // First-run gate: if no profile exists, show profile creation flow.
    if (!state.hasProfile()) {
      this.renderProfileGate({ firstRun: true });
      return;
    }

    document.documentElement.setAttribute('data-theme', state.get('currentTheme') || 'midnights');
    state.checkStreak();
    state.recalculateCurrentLevel();
    this.showSplash();
  }

  _attachGlobalKeyHandler() {
    if (this._globalKeyAttached) return;
    this._globalKeyAttached = true;
    document.addEventListener('keydown', (e) => {
      if (this.currentScreen !== 'game') return;
      const gs = this.gameState;
      if (!gs) return;

      // When explanation is showing, allow Enter, Space, or ArrowRight to advance
      if (gs.isShowingExplanation) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          const nextBtn = document.getElementById('nextPracticeQBtn');
          if (nextBtn) nextBtn.click();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.handleKeyPress(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        this.handleKeyPress('.');
      } else if (e.key === '-') {
        e.preventDefault();
        this.handleKeyPress('-');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.handleKeyPress('backspace');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.handleKeyPress('submit');
      }
    });
  }

  // === PROFILE GATE (Netflix-style) ===
  renderProfileGate({ firstRun = false } = {}) {
    document.documentElement.setAttribute('data-theme', 'midnights');
    const app = document.getElementById('app');
    const profiles = state.getProfiles();
    const max = 5;

    const profileCards = profiles.map(p => `
      <button class="profile-pick-card" data-profile-id="${p.id}">
        <div class="profile-pick-avatar">${p.emoji || '🦸'}</div>
        <div class="profile-pick-name">${this.escapeHtml(p.name)}</div>
        <button class="profile-pick-delete" data-delete-id="${p.id}" title="Delete profile">✕</button>
      </button>
    `).join('');

    const canAdd = profiles.length < max;
    const addCardHTML = canAdd ? `
      <button class="profile-pick-card profile-pick-add" id="profileAdd">
        <div class="profile-pick-avatar">＋</div>
        <div class="profile-pick-name">Add Profile</div>
      </button>` : '';

    app.innerHTML = `
      <div class="profile-gate">
        <div class="profile-gate-title">${firstRun ? 'Welcome to MathX' : "Who's playing?"}</div>
        <div class="profile-gate-sub">${firstRun ? 'Create your first profile to begin.' : 'Pick a profile to continue.'}</div>
        <div class="profile-pick-grid">
          ${profileCards}
          ${addCardHTML}
        </div>
        <div id="profileCreateForm" class="profile-create-form" style="display:${profiles.length === 0 ? 'flex' : 'none'};">
          <div class="profile-create-title">Create profile</div>
          <div class="profile-create-emojis" id="profileEmojiPicker">
            ${['🦸','🦄','🐉','🥷','👽','😺','🐼','🦊','🐙','🧙','👨‍🚀','🤖'].map((e,i)=>`<button class="emoji-pick ${i===0?'selected':''}" data-emoji="${e}">${e}</button>`).join('')}
          </div>
          <input type="text" maxlength="20" placeholder="Player name" id="profileNameInput" class="profile-name-input" />
          <div style="display:flex; gap:var(--space-md); width:100%;">
            ${profiles.length > 0 ? '<button class="btn btn-secondary btn-full" id="profileCancelBtn">Cancel</button>' : ''}
            <button class="btn btn-primary btn-full" id="profileCreateBtn">Create</button>
          </div>
        </div>
      </div>
    `;

    // Bind profile picks
    app.querySelectorAll('[data-profile-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.matches('[data-delete-id]')) return;
        const pid = card.dataset.profileId;
        state.switchProfile(pid);
        document.documentElement.setAttribute('data-theme', state.get('currentTheme') || 'midnights');
        state.checkStreak();
        state.recalculateCurrentLevel();
        this.showSplash();
      });
    });

    app.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (state.getProfiles().length <= 1) {
          alert('You must keep at least one profile.');
          return;
        }
        if (confirm('Delete this profile? This wipes all its progress.')) {
          state.deleteProfile(id);
          this.renderProfileGate({ firstRun: false });
        }
      });
    });

    const addBtn = document.getElementById('profileAdd');
    const form = document.getElementById('profileCreateForm');
    if (addBtn) addBtn.onclick = () => { form.style.display = 'flex'; };
    const cancelBtn = document.getElementById('profileCancelBtn');
    if (cancelBtn) cancelBtn.onclick = () => { form.style.display = 'none'; };

    // Emoji picker
    let pickedEmoji = '🦸';
    document.querySelectorAll('.emoji-pick').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.emoji-pick').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        pickedEmoji = b.dataset.emoji;
      });
    });

    const createBtn = document.getElementById('profileCreateBtn');
    if (createBtn) {
      createBtn.onclick = () => {
        const nameInput = document.getElementById('profileNameInput');
        const name = (nameInput.value || '').trim() || 'Maverick';
        state.createProfile(name, pickedEmoji);
        document.documentElement.setAttribute('data-theme', state.get('currentTheme') || 'midnights');
        state.checkStreak();
        state.recalculateCurrentLevel();
        this.showSplash();
      };
    }
  }

  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // === Shared header bar with profile bubble (top-right quick switcher) ===
  renderHeaderBar(title, coinSpanId = 'coinDisplay') {
    const ap = state.getActiveProfile();
    const avatar = (ap && ap.emoji) || state.getStatusEmoji() || '🦸';
    return `
      <div class="header-bar">
        <div class="header-title">${this.escapeHtml(title)}</div>
        <div class="header-right">
          <div class="header-coins">
            <span class="coin-icon">🪙</span>
            <span id="${coinSpanId}">${this.formatNumber(state.get('balance'))}</span>
          </div>
          <button class="profile-bubble" id="profileBubble-${coinSpanId}" data-bubble="1" aria-label="Switch profile">
            <span class="profile-bubble-emoji">${avatar}</span>
          </button>
        </div>
      </div>
    `;
  }

  // === Profile quick-switch popover ===
  renderProfilePopover() {
    return `
      <div class="profile-popover" id="profilePopover" aria-hidden="true">
        <div class="profile-popover-bg" id="profilePopoverBg"></div>
        <div class="profile-popover-card">
          <div class="profile-popover-title">Switch Profile</div>
          <div class="profile-popover-list" id="profilePopoverList"></div>
          <div class="profile-popover-actions">
            <button class="btn btn-secondary btn-sm btn-full" id="profilePopoverManage">Manage Profiles</button>
          </div>
        </div>
      </div>
    `;
  }

  bindProfileBubble() {
    document.querySelectorAll('[data-bubble="1"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openProfilePopover();
      });
    });
  }

  openProfilePopover() {
    const pop = document.getElementById('profilePopover');
    if (!pop) return;
    const list = document.getElementById('profilePopoverList');
    const profiles = state.getProfiles();
    const activeId = state.getActiveProfile()?.id;
    list.innerHTML = profiles.map(p => `
      <button class="profile-popover-item ${p.id === activeId ? 'active' : ''}" data-pid="${p.id}">
        <span class="profile-popover-emoji">${p.emoji || '🦸'}</span>
        <span class="profile-popover-name">${this.escapeHtml(p.name)}</span>
        ${p.id === activeId ? '<span class="profile-popover-tick">✓</span>' : ''}
      </button>
    `).join('');

    pop.classList.add('show');
    pop.setAttribute('aria-hidden', 'false');

    const close = () => {
      pop.classList.remove('show');
      pop.setAttribute('aria-hidden', 'true');
    };

    document.getElementById('profilePopoverBg').onclick = close;

    list.querySelectorAll('[data-pid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pid;
        if (pid === activeId) { close(); return; }
        state.switchProfile(pid);
        document.documentElement.setAttribute('data-theme', state.get('currentTheme') || 'midnights');
        state.checkStreak();
        state.recalculateCurrentLevel();
        close();
        this.render(); // full re-render with new profile context
        this.showToast(`👋 Welcome back, ${state.get('playerName')}!`, 'success');
      });
    });

    document.getElementById('profilePopoverManage').onclick = () => {
      close();
      this.renderProfileGate({ firstRun: false });
    };
  }

  showSplash() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="splash-screen" id="splash">
        <div class="splash-logo">MathX</div>
        <div class="splash-sub">The Mastermind Eras Tour</div>
      </div>
    `;
    
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) splash.classList.add('fade-out');
      setTimeout(() => {
        this.render();
        this.showStreakRewardIfNeeded();
      }, 500);
    }, 1500);
  }

  showStreakRewardIfNeeded() {
    if (!state.get('streakRewardCollected') && state.get('streakCount') > 0) {
      const reward = state.collectStreakReward();
      if (reward > 0) {
        this.showToast(`🔥 Day ${state.get('streakCount')} streak! +${reward} coins`, 'gold');
      }
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      ${this.renderScreen('path', this.renderPathScreen())}
      ${this.renderScreen('game', '')}
      ${this.renderScreen('results', '')}
      ${this.renderScreen('shop', this.renderShopScreen())}
      ${this.renderScreen('profile', this.renderProfileScreen())}
      ${this.renderTabBar()}
      ${this.renderLevelModal()}
      ${this.renderPurchaseModal()}
      ${this.renderProfilePopover()}
      <div class="toast-container" id="toastContainer"></div>
      <div class="great-reset-overlay" id="greatResetOverlay">
        <div class="great-reset-bg"></div>
        <div class="great-reset-content">
          <div class="great-reset-title">THE GREAT RESET</div>
          <div class="great-reset-sub">Set coins voided. Try again!</div>
        </div>
      </div>
      <div class="lucky13-overlay" id="lucky13Overlay">
        <div class="lucky13-text">⚡ LUCKY 13 ⚡</div>
      </div>
    `;

    this.bindTabEvents();
    this.bindPathEvents();
    this.bindShopEvents();
    this.bindProfileEvents();
    this.bindProfileBubble();
    this.navigateTo('path');
  }

  renderScreen(id, content) {
    return `<div class="screen" id="screen-${id}" data-screen="${id}">${content}</div>`;
  }

  // === PATH SCREEN ===
  renderPathScreen() {
    const currentLevel = state.get('currentLevel');
    const levelStars = state.get('levelStars') || {};
    const statusTitle = state.getStatusTitle();
    const statusEmoji = state.getStatusEmoji();

    let nodesHTML = '';
    for (let lvl = 1; lvl <= 10; lvl++) {
      const config = getLevelConfig(lvl);
      const stars = levelStars[String(lvl)] || 0;
      const isCompleted = lvl < currentLevel;
      const isCurrent = lvl === currentLevel;
      const isLocked = lvl > currentLevel;
      
      let statusClass = 'locked';
      if (isCompleted) statusClass = 'completed';
      else if (isCurrent) statusClass = 'current';

      const starsHTML = [1, 2, 3].map(s => 
        `<span class="node-star ${s <= stars ? 'filled' : ''}">⭐</span>`
      ).join('');

      // Add connector (except before first node)
      if (lvl > 1) {
        let connClass = '';
        if (isCompleted || isCurrent) connClass = lvl <= currentLevel ? 'completed' : '';
        if (isCurrent) connClass = 'current';
        nodesHTML += `<div class="node-connector ${connClass}"></div>`;
      }

      nodesHTML += `
        <div class="node-item ${statusClass}" data-level="${lvl}" id="node-${lvl}">
          <div class="node-badge">${isCompleted ? '✓' : lvl}</div>
          <div class="node-info">
            <div class="node-level">${config.label}</div>
            <div class="node-status">${config.tier}</div>
            ${isCompleted ? `<div class="node-stars">${starsHTML}</div>` : ''}
          </div>
        </div>
      `;
    }

    return `
      ${this.renderHeaderBar('MathX', 'coinDisplay')}
      <div class="screen-content" id="pathScrollArea">
        <div style="text-align:center; margin-bottom: var(--space-lg);">
          <div style="font-size: var(--fs-3xl);">${statusEmoji}</div>
          <div style="font-family: var(--font-display); font-weight: 800; font-size: var(--fs-xl); margin-top: var(--space-sm);">${statusTitle}</div>
          <div style="font-size: var(--fs-xs); color: var(--text-secondary);">Level ${currentLevel} of 10</div>
        </div>
        <div class="node-map">
          ${nodesHTML}
        </div>
      </div>
    `;
  }

  bindPathEvents() {
    document.querySelectorAll('.node-item:not(.locked)').forEach(node => {
      node.addEventListener('click', () => {
        const level = parseInt(node.dataset.level);
        this.selectedLevel = level;
        this.showLevelModal(level);
      });
    });
  }

  // === LEVEL MODAL ===
  renderLevelModal() {
    return `
      <div class="difficulty-modal" id="levelModal">
        <div class="difficulty-overlay" id="lvlOverlay"></div>
        <div class="difficulty-sheet" style="max-height: 85vh; overflow-y: auto;">
          <div class="sheet-handle"></div>
          <div class="difficulty-title" id="lvlTitle">Level Details</div>
          
          <div style="margin-bottom: var(--space-md); font-family: var(--font-display); font-weight: 700;">Practice Drills (100 pts to Unlock Quizzes)</div>
          <div class="difficulty-options" id="practiceOptions" style="margin-bottom: var(--space-xl);">
            <!-- Generated dynamically -->
          </div>

          <div style="margin-bottom: var(--space-md); font-family: var(--font-display); font-weight: 700;">Level Quizzes</div>
          <div class="difficulty-options" id="quizOptions">
            <!-- Generated dynamically -->
          </div>
        </div>
      </div>
    `;
  }

  showLevelModal(level) {
    const modal = document.getElementById('levelModal');
    const title = document.getElementById('lvlTitle');
    const config = getLevelConfig(level);
    title.textContent = `Level ${level}: ${config.label}`;
    
    const availableOps = getAvailableOps(level);
    const practiceOptionsEl = document.getElementById('practiceOptions');
    const quizOptionsEl = document.getElementById('quizOptions');
    
    // Practice Options
    let practiceHTML = '';
    availableOps.forEach(op => {
      const pts = state.getPracticePoints(level, op);
      const isComplete = pts >= PRACTICE_POINTS_REQUIRED;
      const skill = SKILL_CONFIG[op];
      practiceHTML += `
        <div class="difficulty-option practice-opt" data-op="${op}" style="border: 1px solid ${isComplete ? 'var(--success)' : 'var(--border)'}">
          <div class="diff-icon">${skill.emoji}</div>
          <div class="diff-info">
            <div class="diff-name">${skill.label}</div>
            <div class="diff-desc" style="width: 100%; background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 6px; border: var(--border-subtle);">
               <div style="width: ${Math.min(pts, 100)}%; background: ${isComplete ? 'var(--success)' : skill.color}; height: 100%; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px; font-family: var(--font-mono);">${pts} / ${PRACTICE_POINTS_REQUIRED} Pts</div>
          </div>
          ${isComplete ? '<div style="color:var(--success); font-size: 20px;">✓</div>' : ''}
        </div>
      `;
    });
    practiceOptionsEl.innerHTML = practiceHTML;

    // Sub levels (Quizzes)
    const isUnlocked = state.areSubLevelsUnlocked(level, availableOps);
    let quizHTML = '';
    
    ['chill', 'vibe', 'goat'].forEach(diffKey => {
      const diffConfig = getDifficultyConfig(diffKey, level);
      const isSubComplete = state.isSubLevelCompleted(level, diffKey);
      
      if (!isUnlocked) {
        quizHTML += `
          <div class="difficulty-option locked" style="opacity: 0.4;">
            <div class="diff-icon">🔒</div>
            <div class="diff-info">
              <div class="diff-name">${diffConfig.label}</div>
              <div class="diff-desc">Unlock by finishing Practice</div>
            </div>
          </div>
        `;
      } else {
        quizHTML += `
          <div class="difficulty-option quiz-opt" data-diff="${diffKey}" style="border: 1px solid ${isSubComplete ? 'var(--success)' : 'var(--border)'}">
            <div class="diff-icon">${diffConfig.emoji}</div>
            <div class="diff-info">
              <div class="diff-name">${diffConfig.label}</div>
              <div class="diff-desc">${diffConfig.desc}</div>
            </div>
            <div class="diff-mult">${isSubComplete ? '<span style="color:var(--success); font-size: 20px;">✓</span>' : diffConfig.multiplier + '×'}</div>
          </div>
        `;
      }
    });

    quizOptionsEl.innerHTML = quizHTML;
    
    modal.classList.add('show');
    const overlay = document.getElementById('lvlOverlay');
    overlay.onclick = () => this.hideLevelModal();

    // Bindings
    document.querySelectorAll('.practice-opt').forEach(opt => {
      opt.onclick = () => {
        const op = opt.dataset.op;
        this.hideLevelModal();
        setTimeout(() => this.showPracticeLessonModal(level, op), 300);
      };
    });

    document.querySelectorAll('.quiz-opt').forEach(opt => {
      opt.onclick = () => {
        this.hideLevelModal();
        setTimeout(() => this.startGame(level, opt.dataset.diff), 300);
      };
    });
  }

  showPracticeLessonModal(level, op) {
    const lesson = getPrePracticeLesson(level, op);
    const skill = SKILL_CONFIG[op] || { label: 'Practice Drill', emoji: '🧠' };

    let modal = document.getElementById('lessonModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lessonModal';
      modal.className = 'lesson-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="purchase-modal-bg" id="lessonModalBg"></div>
      <div class="lesson-card">
        <div class="lesson-header">
          <div class="lesson-icon">${skill.emoji}</div>
          <div class="lesson-title-area">
            <div class="lesson-tag">Level ${level} Concept Drill</div>
            <div class="lesson-title">${lesson.title}</div>
          </div>
        </div>
        <div class="lesson-body">
          <div class="lesson-rule">💡 ${lesson.rule}</div>
          <div class="lesson-example">${lesson.example}</div>
          <div class="lesson-tip">⭐ Pro Tip: ${lesson.tip}</div>
        </div>
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn-secondary btn-full" id="lessonCloseBtn">Cancel</button>
          <button class="btn btn-primary btn-full btn-lg" id="lessonStartBtn">Start Practice Drill ›</button>
        </div>
      </div>
    `;

    modal.classList.add('show');

    const closeLesson = () => modal.classList.remove('show');
    document.getElementById('lessonModalBg').onclick = closeLesson;
    document.getElementById('lessonCloseBtn').onclick = closeLesson;
    document.getElementById('lessonStartBtn').onclick = () => {
      closeLesson();
      this.startPractice(level, op);
    };
  }

  hideLevelModal() {
    document.getElementById('levelModal').classList.remove('show');
  }

  // === PRACTICE SCREEN ===
  startPractice(level, op) {
    const questions = generatePracticeSet(level, op);
    const diffConfig = getDifficultyConfig('chill'); // practice is chill mode

    this.gameState = {
      isPractice: true,
      practiceOp: op,
      level,
      difficulty: 'chill',
      diffConfig,
      questions,
      currentQuestion: 0,
      correctCount: 0,
      userAnswer: '',
      setCoins: 0,
      questionTimes: [],
      totalStartTime: Date.now(),
      timerValue: null,
      isTimerFrozen: false,
      safetyPinUsed: false,
      greatEscapeActive: false,
      timeWarpUsed: false,
    };

    this.renderGameScreen();
    this.navigateTo('game');
    this.hideTabBar();
    this.questionStartTime = Date.now();
  }

  // === GAME SCREEN ===
  // Public entry: shows pre-quiz powerup picker, then starts the quiz.
  startGame(level, difficulty) {
    this._pendingGame = { level, difficulty };
    this.showPowerupPicker(level, difficulty);
  }

  showPowerupPicker(level, difficulty) {
    const diffConfig = getDifficultyConfig(difficulty, level);
    const inv = state.get('inventory') || {};
    // All 14 Shop Powerups + armable boosts
    const armable = [
      { key: 'safetyPins',      name: 'Safety Pin',        emoji: '🧷', desc: 'Absorbs 1 wrong answer.' },
      { key: 'timeWarps',       name: 'Time Warp',         emoji: '⏳', desc: '+5s on every timed question.', timedOnly: true },
      { key: 'greatEscapes',    name: 'Great Escape',      emoji: '🪂', desc: 'Keep coins on Great Reset.' },
      { key: 'shieldWall',      name: 'Shield Wall',       emoji: '🛡️', desc: 'Auto-absorbs first wrong answer.' },
      { key: 'luckyClover',     name: 'Lucky Clover',      emoji: '🍀', desc: '+15% Lucky 13 chance this set.' },
      { key: 'goldRush',        name: 'Gold Rush',         emoji: '💰', desc: 'Triples one correct answer reward.' },
      { key: 'rocketFuel',      name: 'Rocket Fuel',       emoji: '🚀', desc: '3× coins for this entire set.' },
      { key: 'cloverChain',     name: 'Clover Chain',      emoji: '☘️', desc: 'Streak bonus stacks per correct.' },
      { key: 'crystalBall',     name: 'Crystal Ball',      emoji: '🔮', desc: 'Reveals first digit of Q1.' },
      { key: 'fiftyFifty',      name: '50/50',             emoji: '🎯', desc: 'Eliminates distraction digits.' },
      { key: 'mirrorMirror',    name: 'Mirror Mirror',     emoji: '🪞', desc: 'Swaps questions to easier sibling forms.' },
      { key: 'autoSolve',       name: 'Auto-Solve',        emoji: '🤖', desc: 'Auto-solves the first question.' },
      { key: 'hintMaster',      name: 'Hint Master',       emoji: '💡', desc: 'Shows Arthur Benjamin mental math hints.' },
      { key: 'phoneAFriend',    name: 'Phone a Friend',    emoji: '📞', desc: 'Skips 1 problem without penalty.' },
      { key: 'rewindTime',      name: 'Rewind Time',       emoji: '⏪', desc: 'Gives a second chance on timeout/mistake.' },
      { key: 'doubleOrNothing', name: 'Double or Nothing', emoji: '🎲', desc: '2× set coin payout if 100% correct.' },
    ].filter(p => (inv[p.key] || 0) > 0 && (!p.timedOnly || diffConfig.timer));

    const screen = document.getElementById('screen-game');
    const itemsHTML = armable.length === 0
      ? `<div class="powerup-picker-empty">No powerups available. Visit the shop to stock up!</div>`
      : armable.map(p => `
          <label class="powerup-pick" data-key="${p.key}">
            <input type="checkbox" data-key="${p.key}">
            <div class="powerup-pick-icon">${p.emoji}</div>
            <div class="powerup-pick-info">
              <div class="powerup-pick-name">${p.name} <span class="powerup-pick-count">×${inv[p.key]}</span></div>
              <div class="powerup-pick-desc">${p.desc}</div>
            </div>
          </label>
        `).join('');

    screen.innerHTML = `
      <div class="header-bar">
        <button class="game-close-btn" id="ppCloseBtn">✕</button>
        <div class="header-title">Pre-Quiz</div>
        <div></div>
      </div>
      <div class="screen-content">
        <div class="powerup-picker-card">
          <div class="powerup-picker-title">Level ${level} · ${diffConfig.label}</div>
          <div class="powerup-picker-sub">Pick power-ups to arm for this run. They'll be consumed automatically.</div>
          <div class="powerup-picker-list">${itemsHTML}</div>
          <button class="btn btn-primary btn-full btn-lg" id="ppStartBtn">Start Quiz ›</button>
        </div>
      </div>
    `;

    this.navigateTo('game');
    this.hideTabBar();

    document.getElementById('ppCloseBtn').onclick = () => {
      this._pendingGame = null;
      this.exitGame();
    };
    document.getElementById('ppStartBtn').onclick = () => {
      const selected = {};
      screen.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        selected[cb.dataset.key] = true;
        state.useItem(cb.dataset.key); // consume now
      });
      this._actuallyStartGame(level, difficulty, selected);
    };
  }

  _actuallyStartGame(level, difficulty, armed = {}) {
    let questions = generateQuestionSet(level);
    const diffConfig = getDifficultyConfig(difficulty, level);

    // Mirror Mirror effect: simplifies questions in the set
    if (armed.mirrorMirror) {
      questions = questions.map(q => {
        if (q.operator === '+' && q.b > 20) {
          const simplifiedB = Math.round(q.b / 10) * 10;
          const newAns = Math.round((q.a + simplifiedB) * 100) / 100;
          return { ...q, b: simplifiedB, answer: newAns, display: `${q.a} + ${simplifiedB}` };
        }
        if (q.operator === '×' && q.b > 9 && q.b % 5 !== 0) {
          const simplifiedB = 5;
          const newAns = Math.round((q.a * simplifiedB) * 100) / 100;
          return { ...q, b: simplifiedB, answer: newAns, display: `${q.a} × ${simplifiedB}` };
        }
        return q;
      });
    }

    this.gameState = {
      level,
      difficulty,
      diffConfig,
      questions,
      currentQuestion: 0,
      correctCount: 0,
      userAnswer: '',
      setCoins: 0,
      questionTimes: [],
      totalStartTime: Date.now(),
      timerValue: diffConfig.timer,
      isTimerFrozen: false,

      // Armed powerup flags
      armed: armed,
      safetyHitsRemaining: (armed.safetyPins ? 1 : 0) + (armed.shieldWall ? 1 : 0) + (armed.rewindTime ? 1 : 0),
      safetyArmed: !!(armed.safetyPins || armed.shieldWall || armed.rewindTime),
      greatEscapeActive: !!armed.greatEscapes,
      luckyCloverActive: !!armed.luckyClover,
      goldRushAvailable: !!armed.goldRush,
      rocketFuelActive: !!armed.rocketFuel,
      cloverChainActive: !!armed.cloverChain,
      consecutiveCorrect: 0,
      timeWarpActive: !!armed.timeWarps,
      crystalBallActive: !!armed.crystalBall,
      fiftyFiftyActive: !!armed.fiftyFifty,
      mirrorMirrorActive: !!armed.mirrorMirror,
      autoSolveActive: !!armed.autoSolve,
      hintMasterActive: !!armed.hintMaster,
      phoneAFriendAvailable: !!armed.phoneAFriend,
      doubleOrNothingActive: !!armed.doubleOrNothing,
      isShowingExplanation: false,
    };

    this.renderGameScreen();
    this.navigateTo('game');
    this.hideTabBar();

    if (diffConfig.timer) this.startTimer();
    this.questionStartTime = Date.now();

    // Surface armed powerups via toast
    const armedList = Object.keys(armed);
    if (armedList.length) {
      this.showToast(`✨ Armed: ${armedList.length} power-up${armedList.length === 1 ? '' : 's'}`, 'success');
    }
  }

  renderGameScreen() {
    const gs = this.gameState;
    const q = gs.questions[gs.currentQuestion];
    const diffConfig = gs.diffConfig;

    // Show ARMED powerup chips for all 16 items
    let armedChips = [];
    if (gs.safetyHitsRemaining > 0) armedChips.push(`🧷${gs.safetyHitsRemaining > 1 ? `×${gs.safetyHitsRemaining}` : ''}`);
    if (gs.greatEscapeActive) armedChips.push('🪂');
    if (gs.timeWarpActive) armedChips.push('⏳');
    if (gs.rocketFuelActive) armedChips.push('🚀');
    if (gs.luckyCloverActive) armedChips.push('🍀');
    if (gs.goldRushAvailable) armedChips.push('💰');
    if (gs.cloverChainActive) armedChips.push('☘️');
    if (gs.fiftyFiftyActive) armedChips.push('🎯');
    if (gs.crystalBallActive) armedChips.push('🔮');
    if (gs.hintMasterActive) armedChips.push('💡');
    if (gs.autoSolveActive && !gs.autoSolveUsed) armedChips.push('🤖');
    if (gs.phoneAFriendAvailable && !gs.phoneFriendUsed) armedChips.push('📞');
    if (gs.doubleOrNothingActive) armedChips.push('🎲');
    if (gs.mirrorMirrorActive) armedChips.push('🪞');

    const armedHTML = armedChips.length
      ? `<div class="armed-row">${armedChips.map(e => `<span class="armed-chip">${e}</span>`).join('')}</div>`
      : '';

    // Crystal Ball: reveal first digit on first question only
    let crystalHint = '';
    if (gs.crystalBallActive && gs.currentQuestion === 0) {
      const ans = String(q.answer).replace('-', '');
      crystalHint = `<div class="crystal-hint">🔮 First digit: <b>${ans[0]}</b></div>`;
    }

    // Hint Master powerup: show hint immediately if armed
    let hintMasterCard = '';
    if (gs.hintMasterActive) {
      const sol = generateStepByStepMentalSolution(q);
      hintMasterCard = `
        <div class="mental-math-card" style="margin-bottom: var(--space-sm);">
          <div class="mental-math-badge">💡 Hint Master Active</div>
          <div class="mental-math-strategy">${sol.strategy}</div>
          <div class="mental-math-tip">⭐ Pro Tip: ${sol.tip}</div>
        </div>
      `;
    }

    // 50/50 powerup: interactive buttons for two candidate answers
    let fiftyFiftyChip = '';
    if (gs.fiftyFiftyActive) {
      if (!gs.fiftyFiftyCandidates || gs.fiftyFiftyQ !== gs.currentQuestion) {
        const delta = (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
        const distractor = q.answer + delta;
        gs.fiftyFiftyCandidates = Math.random() < 0.5 ? [q.answer, distractor] : [distractor, q.answer];
        gs.fiftyFiftyQ = gs.currentQuestion;
      }
      const [c1, c2] = gs.fiftyFiftyCandidates;
      fiftyFiftyChip = `
        <div class="crystal-hint" style="background: rgba(245, 158, 11, 0.15); border: 1px solid var(--accent-gold); display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
          <span>🎯 50/50:</span>
          <button class="btn btn-secondary btn-sm fifty-option" data-val="${c1}">${c1}</button>
          <button class="btn btn-secondary btn-sm fifty-option" data-val="${c2}">${c2}</button>
        </div>
      `;
    }

    // Auto-solve button if active and not yet used
    let autoSolveBtn = '';
    if (gs.autoSolveActive && !gs.autoSolveUsed) {
      autoSolveBtn = `<button class="btn btn-secondary btn-sm" id="btnAutoSolve" style="margin-top: 6px; font-size: var(--fs-xs);">🤖 Use Auto-Solve</button>`;
    }

    // Phone a Friend skip button if available
    let phoneFriendBtn = '';
    if (gs.phoneAFriendAvailable && !gs.phoneFriendUsed) {
      phoneFriendBtn = `<button class="btn btn-secondary btn-sm" id="btnPhoneFriend" style="margin-top: 6px; font-size: var(--fs-xs);">📞 Phone a Friend (Skip)</button>`;
    }

    // Practice Mental Math toggle button
    const mentalMathActive = this.sessionMentalMath !== undefined 
      ? this.sessionMentalMath 
      : state.get('showMentalMath');
    const mentalMathToggleHTML = gs.isPractice ? `
      <div style="display: flex; justify-content: center; margin-bottom: var(--space-xs);">
        <button class="mental-math-toggle-btn ${mentalMathActive ? 'active' : ''}" id="togglePracticeMentalMath">
          💡 Mental Math: <b>${mentalMathActive ? 'ON' : 'OFF'}</b>
        </button>
      </div>
    ` : '';

    const screen = document.getElementById('screen-game');
    screen.innerHTML = `
      <div class="game-header">
        <div class="game-top-bar">
          <button class="game-close-btn" id="gameCloseBtn">✕</button>
          <div class="game-level-badge">LVL ${gs.level} · ${gs.diffConfig.label}</div>
          ${diffConfig.timer ? `<div class="game-timer" id="gameTimer">${gs.timerValue}s</div>` : '<div></div>'}
        </div>
        <div class="game-progress">
          <div class="game-progress-fill" style="width: ${(gs.currentQuestion / 10) * 100}%"></div>
        </div>
        ${armedHTML}
      </div>

      <div class="game-question-area">
        ${mentalMathToggleHTML}
        <div class="question-number">Question ${gs.currentQuestion + 1} of 10</div>
        <div class="question-text" id="questionText">${q.display}</div>
        ${crystalHint}
        ${fiftyFiftyChip}
        ${hintMasterCard}
        <div style="display: flex; gap: var(--space-xs); justify-content: center;">
          ${autoSolveBtn}
          ${phoneFriendBtn}
        </div>
        <div class="answer-display" id="answerDisplay">
          <span id="answerText">${gs.userAnswer}</span><span class="cursor-blink"></span>
        </div>
        <div id="mentalMathCardArea"></div>
        <div class="game-coins" id="gameCoins">
          🪙 <span id="setCoins">${gs.setCoins}</span>
          ${state.hasHabitPower() ? '<span class="habit-power-badge" style="margin-left: 6px;">🔥 5× Habit Power</span>' : ''}
        </div>
      </div>
      
      <div class="numpad">
        <div class="numpad-grid">
          <button class="numpad-key" data-key="1">1</button>
          <button class="numpad-key" data-key="2">2</button>
          <button class="numpad-key" data-key="3">3</button>
          <button class="numpad-key" data-key="4">4</button>
          <button class="numpad-key" data-key="5">5</button>
          <button class="numpad-key" data-key="6">6</button>
          <button class="numpad-key" data-key="7">7</button>
          <button class="numpad-key" data-key="8">8</button>
          <button class="numpad-key" data-key="9">9</button>
          <button class="numpad-key key-negative" data-key="-">−</button>
          <button class="numpad-key" data-key="0">0</button>
          <button class="numpad-key key-decimal" data-key=".">.</button>
          <button class="numpad-key key-action" data-key="backspace">⌫</button>
          <button class="numpad-key key-submit" data-key="submit" style="grid-column: span 2;">ENTER</button>
        </div>
      </div>
    `;

    this.bindGameEvents();
  }

  bindGameEvents() {
    // Numpad keys
    document.querySelectorAll('.numpad-key').forEach(key => {
      key.addEventListener('click', (e) => {
        e.preventDefault();
        const keyVal = key.dataset.key;
        this.handleKeyPress(keyVal);
      });
    });

    // 50/50 option buttons
    document.querySelectorAll('.fifty-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const gs = this.gameState;
        if (!gs || gs.isShowingExplanation) return;
        gs.userAnswer = String(btn.dataset.val);
        const answerText = document.getElementById('answerText');
        if (answerText) answerText.textContent = gs.userAnswer;
        this.submitAnswer();
      });
    });

    // Close button
    const closeBtn = document.getElementById('gameCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.exitGame());
    }

    // Auto-solve action
    const autoSolveBtn = document.getElementById('btnAutoSolve');
    if (autoSolveBtn) {
      autoSolveBtn.addEventListener('click', () => {
        const gs = this.gameState;
        if (!gs || gs.isShowingExplanation) return;
        const q = gs.questions[gs.currentQuestion];
        gs.userAnswer = String(q.answer);
        gs.autoSolveUsed = true;
        const answerText = document.getElementById('answerText');
        if (answerText) answerText.textContent = gs.userAnswer;
        this.submitAnswer();
      });
    }

    // Phone a Friend action (skips question without penalty)
    const phoneFriendBtn = document.getElementById('btnPhoneFriend');
    if (phoneFriendBtn) {
      phoneFriendBtn.addEventListener('click', () => {
        const gs = this.gameState;
        if (!gs || gs.isShowingExplanation) return;
        gs.phoneFriendUsed = true;
        this.showToast('📞 Friend called: question skipped!', 'success');
        this.stopTimer();
        gs.currentQuestion++;
        gs.userAnswer = '';
        if (gs.currentQuestion >= 10) {
          this.completeSet();
        } else {
          this.renderGameScreen();
          if (gs.diffConfig.timer) this.startTimer();
          this.questionStartTime = Date.now();
        }
      });
    }

    // Mental Math toggle in Practice mode
    const togglePracticeMentalMath = document.getElementById('togglePracticeMentalMath');
    if (togglePracticeMentalMath) {
      togglePracticeMentalMath.addEventListener('click', () => {
        const current = this.sessionMentalMath !== undefined 
          ? this.sessionMentalMath 
          : state.get('showMentalMath');
        this.sessionMentalMath = !current;
        this.renderGameScreen();
      });
    }
  }

  handleKeyPress(key) {
    const gs = this.gameState;
    if (!gs) return;

    if (state.get('soundEffects')) SFX.keyPress();
    if (state.get('haptics')) Haptics.light();

    if (key === 'backspace') {
      gs.userAnswer = gs.userAnswer.slice(0, -1);
    } else if (key === 'submit') {
      this.submitAnswer();
      return;
    } else if (key === '-') {
      if (gs.userAnswer === '') {
        gs.userAnswer = '-';
      }
    } else if (key === '.') {
      if (!gs.userAnswer.includes('.')) {
        gs.userAnswer += '.';
      }
    } else {
      if (gs.userAnswer.length < 10) {
        gs.userAnswer += key;
      }
    }

    const answerText = document.getElementById('answerText');
    if (answerText) answerText.textContent = gs.userAnswer;
  }

  submitAnswer() {
    const gs = this.gameState;
    if (!gs || gs.isShowingExplanation || gs.userAnswer === '' || gs.userAnswer === '-') return;

    const q = gs.questions[gs.currentQuestion];
    const answerTime = Date.now() - this.questionStartTime;
    gs.questionTimes.push(answerTime);
    const isCorrect = checkAnswer(q, gs.userAnswer);
    
    // Lucky 13 check (answered in ~1.3s; clover widens the window)
    const timeSec = answerTime / 1000;
    const lucky13Window = gs.luckyCloverActive ? 0.30 : 0.15;
    const isLucky13 = isCorrect && Math.abs(timeSec - 1.3) < lucky13Window;

    const answerDisplay = document.getElementById('answerDisplay');

    if (isCorrect) {
      answerDisplay.classList.add('correct');
      if (state.get('soundEffects')) {
        // Check custom enter sound
        const enterSound = state.get('enterSound');
        if (enterSound === 'guitar') SFX.guitarStrum();
        else if (enterSound === 'cash') SFX.cashRegister();
        else SFX.correct();
      }
      if (state.get('haptics')) Haptics.success();

      // Calculate coins for this question
      let qCoins = 0;
      if (gs.isPractice) {
        // Practice mode: calibrated coins per correct answer + habit power
        qCoins = Math.max(5, (Number(gs.level) || 1) * 10);
        if (state.hasHabitPower()) qCoins *= 5;
        if (gs.correctCount === 9) {
          // 10th correct answer triggers the perfect drill bonus
          qCoins += (Number(gs.level) || 1) * 50 * (state.hasHabitPower() ? 5 : 1);
        }
      } else {
        qCoins = gs.level * gs.diffConfig.multiplier;

        if (state.isCoffeeBoostActive()) qCoins = Math.floor(qCoins * 1.5);
        if (state.get('lifetimeCoffee')) qCoins = Math.floor(qCoins * 1.25);
        if (state.isWeekendWarriorActive && state.isWeekendWarriorActive()) qCoins *= 2;

        // Pre-armed boosts
        if (gs.rocketFuelActive) qCoins *= 3;
        if (gs.cloverChainActive) {
          gs.consecutiveCorrect = (gs.consecutiveCorrect || 0) + 1;
          const bonusPct = Math.min(gs.consecutiveCorrect * 0.01, 0.30);
          qCoins = Math.floor(qCoins * (1 + bonusPct));
        }
        if (gs.goldRushAvailable) {
          qCoins *= 3;
          gs.goldRushAvailable = false; // one-shot
          this.showToast('💰 Gold Rush! 3× this answer', 'gold');
        }

        // Lucky 13 (13x)
        if (isLucky13) {
          qCoins *= 13;
          this.triggerLucky13();
          state.set('lucky13Count', (state.get('lucky13Count') || 0) + 1);
        }

        // 21-Day Habit Power (5x multiplier on all coins earned, effectively 65x if Lucky 13 triggered!)
        if (state.hasHabitPower()) {
          qCoins *= 5;
        }
      }

      gs.setCoins += qCoins;
      gs.correctCount++;

      const setCoinsEl = document.getElementById('setCoins');
      if (setCoinsEl) setCoinsEl.textContent = gs.setCoins;

      // Practice mode mental math explanation check
      const showMental = gs.isPractice && (this.sessionMentalMath !== undefined ? this.sessionMentalMath : state.get('showMentalMath'));
      if (showMental) {
        this.stopTimer();
        this.renderMentalMathExplanation(q, true, () => {
          gs.currentQuestion++;
          gs.userAnswer = '';
          if (gs.currentQuestion >= 10) {
            this.completeSet();
          } else {
            this.renderGameScreen();
            this.questionStartTime = Date.now();
          }
        });
        return;
      }

      // Move to next question automatically in normal quiz mode
      setTimeout(() => {
        this.stopTimer();
        gs.currentQuestion++;
        gs.userAnswer = '';

        if (gs.currentQuestion >= 10) {
          this.completeSet();
        } else {
          this.renderGameScreen();
          if (gs.diffConfig.timer) this.startTimer();
          this.questionStartTime = Date.now();
        }
      }, 400);
    } else {
      // WRONG ANSWER
      answerDisplay.classList.add('wrong');
      gs.consecutiveCorrect = 0;

      // In practice mode, show mental math explanation even on wrong answer to teach the user!
      const showMental = gs.isPractice && (this.sessionMentalMath !== undefined ? this.sessionMentalMath : state.get('showMentalMath'));
      if (showMental) {
        if (state.get('soundEffects')) SFX.wrong();
        if (state.get('haptics')) Haptics.medium();
        this.stopTimer();
        this.renderMentalMathExplanation(q, false, () => {
          gs.currentQuestion++;
          gs.userAnswer = '';
          if (gs.currentQuestion >= 10) {
            this.completeSet();
          } else {
            this.renderGameScreen();
            this.questionStartTime = Date.now();
          }
        });
        return;
      }

      // Multi-defense check: safety pins, shield wall, rewind time
      if (gs.safetyHitsRemaining > 0) {
        gs.safetyHitsRemaining--;
        gs.safetyArmed = gs.safetyHitsRemaining > 0;
        if (state.get('soundEffects')) SFX.wrong();
        if (state.get('haptics')) Haptics.medium();
        this.showToast(gs.safetyHitsRemaining > 0 ? `🛡️ Defense absorbed hit! (${gs.safetyHitsRemaining} shield left)` : '🧷 Safety protection used!', 'success');
        
        setTimeout(() => {
          gs.userAnswer = '';
          this.renderGameScreen();
          if (gs.diffConfig.timer) this.startTimer();
          this.questionStartTime = Date.now();
        }, 600);
        return;
      }

      // THE GREAT RESET
      this.triggerGreatReset();
    }
  }

  renderMentalMathExplanation(q, isCorrect, onNext) {
    const gs = this.gameState;
    if (gs) gs.isShowingExplanation = true;
    const cardArea = document.getElementById('mentalMathCardArea');
    if (!cardArea) {
      if (gs) gs.isShowingExplanation = false;
      if (onNext) onNext();
      return;
    }

    const sol = generateStepByStepMentalSolution(q);
    const stepsHTML = sol.steps.map(s => `<li class="mental-math-step">${s}</li>`).join('');
    const statusHeader = isCorrect 
      ? `<div class="mental-math-badge success">✓ Correct · Mental Math Shortcut</div>`
      : `<div class="mental-math-badge wrong">✗ Not Quite · Correct Answer: <strong>${q.answer}</strong></div>`;

    cardArea.innerHTML = `
      <div class="mental-math-card ${isCorrect ? 'is-correct' : 'is-wrong'}">
        ${statusHeader}
        <div class="mental-math-strategy">${sol.strategy}</div>
        <ul class="mental-math-steps">
          ${stepsHTML}
        </ul>
        <div class="mental-math-tip">⭐ Pro Tip: ${sol.tip}</div>
        <button class="btn btn-primary btn-full btn-sm" id="nextPracticeQBtn" style="margin-top: var(--space-sm);">
          Next Question ›
        </button>
      </div>
    `;

    // Disable numpad during explanation to prevent accidental inputs
    document.querySelectorAll('.numpad-key').forEach(k => { k.disabled = true; k.style.opacity = '0.5'; });

    const btnNext = document.getElementById('nextPracticeQBtn');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (gs) gs.isShowingExplanation = false;
        if (onNext) onNext();
      });
    }
  }

  triggerGreatReset() {
    const gs = this.gameState;
    this.stopTimer();
    
    if (state.get('soundEffects')) SFX.reset();
    if (state.get('haptics')) Haptics.reset();

    const overlay = document.getElementById('greatResetOverlay');
    overlay.classList.add('active');

    // Keep coins if Great Escape is active
    const keptCoins = gs.greatEscapeActive ? gs.setCoins : 0;
    
    if (gs.greatEscapeActive && gs.setCoins > 0) {
      state.addCoins(gs.setCoins);
      this.showToast(`🪂 Great Escape! Kept ${gs.setCoins} coins`, 'gold');
    }

    // Update stats
    state.update({
      totalGamesPlayed: state.get('totalGamesPlayed') + 1,
      totalCorrect: state.get('totalCorrect') + gs.correctCount,
      totalQuestions: state.get('totalQuestions') + gs.currentQuestion + 1,
    });

    setTimeout(() => {
      overlay.classList.remove('active');
      // Reset set - go back to path
      this.exitGame();
    }, 2000);
  }

  triggerLucky13() {
    if (state.get('soundEffects')) SFX.lucky13();
    
    const overlay = document.getElementById('lucky13Overlay');
    overlay.classList.add('active');
    
    // Spawn sparkle particles
    this.spawnSparkles(15);
    
    this.showToast('⚡ LUCKY 13! 13× Coin Multiplier!', 'gold');
    
    setTimeout(() => {
      overlay.classList.remove('active');
    }, 1500);
  }

  spawnSparkles(count) {
    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${20 + Math.random() * 60}%`;
      sparkle.style.top = `${30 + Math.random() * 40}%`;
      sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
      sparkle.style.background = ['#f59e0b', '#fbbf24', '#e040fb', '#7c3aed', '#22c55e'][Math.floor(Math.random() * 5)];
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1200);
    }
  }

  completeSet() {
    const gs = this.gameState;
    this.stopTimer();

    if (state.get('soundEffects')) SFX.levelComplete();
    if (state.get('haptics')) Haptics.success();

    if (gs.isPractice) {
      // Award practice points
      const pointsEarned = gs.correctCount * PRACTICE_POINTS_PER_CORRECT;
      state.addPracticePoints(gs.level, gs.practiceOp, pointsEarned);
      
      // Award practice coins directly from gs.setCoins
      state.addCoins(gs.setCoins);

      state.update({
        totalGamesPlayed: state.get('totalGamesPlayed') + 1,
        totalCorrect: state.get('totalCorrect') + gs.correctCount,
        totalQuestions: state.get('totalQuestions') + 10,
      });

      this.handlePostGameUpdates();
      this.showResults(gs, gs.setCoins, 0, null, pointsEarned);
      return;
    }

    // --- NORMAL QUIZ LOGIC ---
    let totalCoins = gs.setCoins;
    // Double or Nothing powerup: 2x payout if perfect 10/10, otherwise 0
    if (gs.doubleOrNothingActive) {
      if (gs.correctCount === 10) {
        totalCoins *= 2;
        this.showToast('🎲 Double or Nothing Won! 2× Payout!', 'gold');
      } else {
        totalCoins = 0;
        this.showToast('🎲 Double or Nothing: Did not achieve 10/10.', 'error');
      }
    }
    state.addCoins(totalCoins);

    if (gs.difficulty === 'goat') {
      const plectrums = Math.floor(gs.correctCount / 2);
      state.set('goldenPlectrums', state.get('goldenPlectrums') + plectrums);
    }

    let stars = 0;
    if (gs.correctCount >= 7) stars = 1;
    if (gs.correctCount >= 9) stars = 2;
    if (gs.correctCount === 10) stars = 3;

    const levelStars = { ...state.get('levelStars') };
    const prevStars = levelStars[String(gs.level)] || 0;
    levelStars[String(gs.level)] = Math.max(prevStars, stars);
    state.set('levelStars', levelStars);

    // Complete sub-level if they get 8 or more correct
    if (gs.correctCount >= 8) {
      state.completeSubLevel(gs.level, gs.difficulty);
    }

    // Check level progression based on sub-levels completed
    state.recalculateCurrentLevel();

    if (gs.correctCount === 10) {
      state.set('perfectSets', state.get('perfectSets') + 1);
    }

    state.update({
      totalGamesPlayed: state.get('totalGamesPlayed') + 1,
      totalCorrect: state.get('totalCorrect') + gs.correctCount,
      totalQuestions: state.get('totalQuestions') + 10,
    });

    const tip = getSmartTip(gs.questions);
    this.handlePostGameUpdates();
    this.showResults(gs, totalCoins, stars, tip, 0);
  }

  handlePostGameUpdates() {
    // Streak logic
    const streakIncreased = state.incrementStreak();
    if (streakIncreased) {
      const s = state.get('streakCount');
      const reward = state.collectStreakReward();
      if (s > 1) {
        setTimeout(() => {
           this.triggerStreakCelebration(s);
        }, 800);
      }
      if (reward > 0) {
        setTimeout(() => {
          this.showToast(`🔥 Streak Reward Collected! +${this.formatNumber(reward)}🪙`, 'gold');
        }, 1500);
      }
      // Check 50-day milestone bonus
      const milestone = state.getMilestoneBonus(s);
      if (milestone) {
        setTimeout(() => {
          this.showToast(`🎉 ${milestone.label}! +${this.formatNumber(milestone.coins)}🪙 +${milestone.plectrums}🎸`, 'gold');
          this.spawnSparkles(35);
          if (state.get('soundEffects')) SFX.lucky13();
        }, 2200);
      }
    }

    // Daily Challenge logic
    state.addChallengeProgress();
    const reward = state.claimChallengeReward();
    if (reward) {
      setTimeout(() => {
        this.showToast(`🏆 Daily Challenge Complete! +${this.formatNumber(reward.coins)}🪙 +${reward.plectrums}🎸`, 'gold');
        this.spawnSparkles(20);
        if (state.get('soundEffects')) SFX.levelComplete();
      }, 1500);
    }
  }

  triggerStreakCelebration(streakCount) {
    if (state.get('soundEffects')) SFX.lucky13(); // Reusing a hype sound
    const overlay = document.createElement('div');
    overlay.className = 'streak-celebration-overlay active';
    const habitBonusText = streakCount >= 21 ? '<div style="color: #ff8c00; font-size: 16px; margin-top: 8px;">🔥 5× Habit Multiplier Power Active!</div>' : '';
    overlay.innerHTML = `
      <div class="streak-anim-content">
        <div style="font-size: 80px;">🔥</div>
        <div class="streak-anim-text">${streakCount} DAY STREAK!</div>
        ${habitBonusText}
      </div>
    `;
    document.getElementById('app').appendChild(overlay);
    this.spawnSparkles(30);

    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 400);
    }, 2000);
  }

  showResults(gs, totalCoins, stars, tip, pointsEarned = 0) {
    const totalTime = Date.now() - gs.totalStartTime;
    const avgTime = gs.questionTimes.length > 0 
      ? (gs.questionTimes.reduce((a, b) => a + b, 0) / gs.questionTimes.length / 1000).toFixed(1) 
      : '—';

    let gradeEmoji = '🎯';
    if (gs.correctCount === 10) gradeEmoji = '🏆';
    else if (gs.correctCount >= 8) gradeEmoji = '🌟';
    else if (gs.correctCount >= 5) gradeEmoji = '💪';
    
    // For Practice mode
    if (gs.isPractice) {
      const skill = SKILL_CONFIG[gs.practiceOp];
      const screen = document.getElementById('screen-results');
      screen.innerHTML = `
        <div class="screen-content">
          <div class="results-container">
            <div style="font-size: var(--fs-5xl);">${gradeEmoji}</div>
            <div style="font-family: var(--font-display); font-size: var(--fs-2xl); font-weight: 900;">
              Practice Drill Complete!
            </div>
            
            <div class="coin-win-anim" style="margin: var(--space-md) 0;">
              🪙 +${totalCoins}
            </div>

            <div class="results-coins" style="color: var(--success); font-size: var(--fs-lg); margin-bottom: var(--space-md);">
              <span>${skill.emoji}</span>
              <span>+${pointsEarned} Practice Points</span>
            </div>
            
            <div style="display: flex; gap: var(--space-md); width: 100%; max-width: 300px; margin-top: var(--space-lg);">
              <button class="btn btn-secondary btn-full" id="resultsHome">Home</button>
              <button class="btn btn-primary btn-full" id="resultsRetry">Practice Again</button>
            </div>
          </div>
        </div>
      `;
      this.navigateTo('results');
      this.spawnSparkles(15);
      document.getElementById('resultsHome').addEventListener('click', () => this.exitGame());
      document.getElementById('resultsRetry').addEventListener('click', () => {
        this.startPractice(gs.level, gs.practiceOp);
      });
      return;
    }

    // Normal quiz mode results
    const starsHTML = [1, 2, 3].map(s => 
      `<span class="star-earned" style="font-size: var(--fs-3xl);">${s <= stars ? '⭐' : '☆'}</span>`
    ).join('');

    const screen = document.getElementById('screen-results');
    screen.innerHTML = `
      <div class="screen-content">
        <div class="results-container">
          <div style="font-size: var(--fs-5xl);">${gradeEmoji}</div>
          <div>${starsHTML}</div>
          <div style="font-family: var(--font-display); font-size: var(--fs-2xl); font-weight: 900;">
            ${gs.correctCount === 10 ? 'Perfect Set!' : gs.correctCount >= 8 ? 'Great Job!' : gs.correctCount >= 5 ? 'Good Effort!' : 'Keep Practicing!'}
          </div>
          
          <div class="results-coins">
            <span>🪙</span>
            <span>+${totalCoins}</span>
          </div>
          
          ${gs.difficulty === 'goat' ? `
            <div style="font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--accent-secondary);">
              🎸 +${Math.floor(gs.correctCount / 2)} Golden Plectrums
            </div>
          ` : ''}
          
          <div class="results-stats">
            <div class="stat-card">
              <div class="stat-value">${gs.correctCount}/10</div>
              <div class="stat-label">Correct</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${avgTime}s</div>
              <div class="stat-label">Avg Time</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${gs.diffConfig.label}</div>
              <div class="stat-label">Difficulty</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">Lvl ${gs.level}</div>
              <div class="stat-label">Level</div>
            </div>
          </div>
          
          ${tip ? `
            <div class="tip-card">
              <div class="tip-header">
                <span>🧠</span>
                <span>Mastermind Tip: ${tip.title}</span>
              </div>
              <div class="tip-content">${tip.content}</div>
              <div class="tip-example">${tip.example}</div>
            </div>
          ` : ''}
          
          <div style="display: flex; gap: var(--space-md); width: 100%; max-width: 300px; margin-top: var(--space-lg);">
            <button class="btn btn-secondary btn-full" id="resultsHome">Home</button>
            <button class="btn btn-primary btn-full" id="resultsRetry">Play Again</button>
          </div>
        </div>
      </div>
    `;

    this.navigateTo('results');

    document.getElementById('resultsHome').addEventListener('click', () => this.exitGame());
    document.getElementById('resultsRetry').addEventListener('click', () => {
      this.startGame(this.gameState.level, this.gameState.difficulty);
    });
  }

  exitGame() {
    this.stopTimer();
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    this.gameState = null;
    this.sessionMentalMath = undefined;
    
    // Re-render path and profile with updated data
    document.getElementById('screen-path').innerHTML = this.renderPathScreen();
    this.bindPathEvents();
    document.getElementById('screen-profile').innerHTML = this.renderProfileScreen();
    this.bindProfileEvents();
    this.bindProfileBubble();
    this.updateCoinDisplays();

    this.navigateTo('path');
    this.showTabBar();
  }

  // === TIMER ===
  startTimer() {
    const gs = this.gameState;
    if (!gs || !gs.diffConfig.timer) return;

    let base = gs.diffConfig.timer;
    if (gs.timeWarpActive) base += 5; // armed Time Warp gives +5s every question
    gs.timerValue = base;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (gs.isTimerFrozen) return;
      
      gs.timerValue = Math.max(0, gs.timerValue - 0.1);
      this.updateTimerDisplay();
      
      if (gs.timerValue <= 0) {
        // Time's up - same as wrong answer
        this.stopTimer();
        
        // Check armed safety
        if (gs.safetyArmed) {
          gs.safetyArmed = false;
          this.showToast('🧷 Safety Pin saved you from timeout!', 'success');
          gs.currentQuestion++;
          gs.userAnswer = '';
          if (gs.currentQuestion >= 10) {
            this.completeSet();
          } else {
            this.renderGameScreen();
            this.startTimer();
            this.questionStartTime = Date.now();
          }
          return;
        }
        
        this.triggerGreatReset();
      }
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('gameTimer');
    if (!timerEl || !this.gameState) return;
    
    const val = this.gameState.timerValue;
    timerEl.textContent = `${val.toFixed(1)}s`;
    
    if (val <= 2) {
      timerEl.classList.add('danger');
    } else {
      timerEl.classList.remove('danger');
    }
  }

  // === SHOP SCREEN ===
  renderShopScreen() {
    const categories = getShopCategories();
    const activeCategory = this._shopCategory || 'powerups';
    
    const tabsHTML = categories.map(cat => {
      const isActive = cat.id === activeCategory;
      const cls = `shop-tab${isActive ? ' active is-active' : ''}`;
      const aria = isActive ? ' aria-selected="true"' : '';
      return `<button class="${cls}" data-category="${cat.id}"${aria}>${cat.emoji} ${cat.label}</button>`;
    }).join('');

    const items = getShopItems(activeCategory);
    const stateData = {
      unlockedThemes: state.get('unlockedThemes'),
      currentTheme: state.get('currentTheme'),
      unlockedSounds: state.get('unlockedSounds'),
      enterSound: state.get('enterSound'),
      unlockedAvatars: state.get('unlockedAvatars') || [],
      currentAvatar: state.get('currentAvatar'),
      holographicName: state.get('holographicName'),
      vipStatus: state.get('vipStatus'),
      goldenAura: state.get('goldenAura'),
      plectrumGod: state.get('plectrumGod'),
      inventory: state.get('inventory'),
      ...state.state,
    };

    const itemsHTML = items.map(item => {
      const status = getItemStatus(item.id, stateData);
      let priceHTML = '';
      let statusClass = '';
      
      let currencyIcon = item.currency === 'plectrums' ? '🎸' : '🪙';
      if (status === 'equipped') {
        priceHTML = `<div class="shop-item-equipped">✓ Equipped</div>`;
        statusClass = 'equipped';
      } else if (status === 'owned') {
        priceHTML = `<div class="shop-item-owned">✓ Owned</div>`;
        statusClass = 'owned';
      } else if (status.startsWith('owned:')) {
        const count = status.split(':')[1];
        priceHTML = `<div class="shop-item-owned">Owned: ${count}</div>`;
        statusClass = 'owned';
      } else {
        priceHTML = `<div class="shop-item-price">${currencyIcon} ${this.formatNumber(item.price)}</div>`;
      }

      return `
        <div class="shop-item ${statusClass}" data-item-id="${item.id}" data-category="${activeCategory}">
          <div class="shop-item-icon">${item.emoji}</div>
          <div class="shop-item-name">${item.name}</div>
          ${priceHTML}
        </div>
      `;
    }).join('');

    return `
      ${this.renderHeaderBar('Shop', 'shopCoinDisplay')}
      <div class="screen-content">
        <div class="shop-tabs">${tabsHTML}</div>
        <div class="shop-grid">${itemsHTML}</div>
      </div>
    `;
  }

  bindShopEvents() {
    // Scope queries to the shop screen so we never collide with other tab classes elsewhere.
    const root = document.getElementById('screen-shop');
    if (!root) return;

    root.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._shopCategory = tab.dataset.category;
        root.innerHTML = this.renderShopScreen();
        this.bindShopEvents();
        this.bindProfileBubble(); // header bubble re-renders too
        // Scroll the now-active tab into view so user sees their selection
        const active = root.querySelector('.shop-tab.is-active');
        if (active && active.scrollIntoView) {
          active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });

    root.querySelectorAll('.shop-item').forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.dataset.itemId;
        const category = item.dataset.category;
        this.handleShopItemClick(itemId, category);
      });
    });
  }

  handleShopItemClick(itemId, category) {
    const items = getShopItems(category);
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const stateData = {
      unlockedThemes: state.get('unlockedThemes'),
      currentTheme: state.get('currentTheme'),
      unlockedSounds: state.get('unlockedSounds'),
      enterSound: state.get('enterSound'),
      unlockedAvatars: state.get('unlockedAvatars') || [],
      currentAvatar: state.get('currentAvatar'),
      holographicName: state.get('holographicName'),
      vipStatus: state.get('vipStatus'),
      goldenAura: state.get('goldenAura'),
      plectrumGod: state.get('plectrumGod'),
      inventory: state.get('inventory'),
      ...state.state,
    };

    const status = getItemStatus(itemId, stateData);

    if (status === 'equipped') {
      // Already equipped
      this.showToast(`${item.emoji} Already equipped!`, 'success');
      return;
    }

    if (status === 'owned' && item.themeId) {
      // Equip theme
      state.set('currentTheme', item.themeId);
      document.documentElement.setAttribute('data-theme', item.themeId);
      this.showToast(`${item.emoji} ${item.name} theme equipped!`, 'success');
      if (state.get('soundEffects')) SFX.shopBuy();
      this.refreshShop();
      return;
    }

    if (status === 'owned' && item.soundId) {
      // Equip sound
      state.set('enterSound', item.soundId);
      this.showToast(`${item.emoji} ${item.name} sound equipped!`, 'success');
      if (state.get('soundEffects')) SFX.shopBuy();
      this.refreshShop();
      return;
    }

    if (status === 'owned' && item.avatarKey) {
      // Equip avatar
      state.set('currentAvatar', item.avatarKey);
      const ap = state.getActiveProfile();
      if (ap) state.renameProfile(ap.id, null, item.avatarKey);
      this.showToast(`${item.emoji} ${item.name} avatar equipped!`, 'success');
      if (state.get('soundEffects')) SFX.shopBuy();
      this.refreshShop();
      return;
    }

    if (status === 'owned' && item.unique) {
      this.showToast(`${item.emoji} Already owned!`, 'success');
      return;
    }

    // Show purchase modal
    this.showPurchaseModal(item, category);
  }

  refreshShop() {
    document.getElementById('screen-shop').innerHTML = this.renderShopScreen();
    this.bindShopEvents();
    this.bindProfileBubble();
  }

  // === PURCHASE MODAL ===
  renderPurchaseModal() {
    return `
      <div class="purchase-modal" id="purchaseModal">
        <div class="purchase-modal-bg" id="purchaseModalBg"></div>
        <div class="purchase-modal-content">
          <div class="purchase-modal-icon" id="purchaseIcon"></div>
          <div class="purchase-modal-title" id="purchaseTitle"></div>
          <div class="purchase-modal-desc" id="purchaseDesc"></div>
          <div class="purchase-modal-actions">
            <button class="btn btn-secondary" id="purchaseCancel">Cancel</button>
            <button class="btn btn-gold" id="purchaseConfirm">Buy</button>
          </div>
        </div>
      </div>
    `;
  }

  showPurchaseModal(item, category) {
    const modal = document.getElementById('purchaseModal');
    document.getElementById('purchaseIcon').textContent = item.emoji;
    document.getElementById('purchaseTitle').textContent = item.name;
    const currencyIcon = item.currency === 'plectrums' ? '🎸' : '🪙';
    document.getElementById('purchaseDesc').textContent = `${item.description}\n\nCost: ${currencyIcon} ${this.formatNumber(item.price)}`;
    
    modal.classList.add('show');

    document.getElementById('purchaseModalBg').onclick = () => modal.classList.remove('show');
    document.getElementById('purchaseCancel').onclick = () => modal.classList.remove('show');
    document.getElementById('purchaseConfirm').onclick = () => {
      this.purchaseItem(item, category);
      modal.classList.remove('show');
    };
  }

  purchaseItem(item, category) {
    let paymentSuccess = false;
    if (item.currency === 'plectrums') {
      paymentSuccess = state.spendPlectrums(item.price);
      if (!paymentSuccess) {
        this.showToast('Not enough Golden Plectrums!', 'error');
        if (state.get('haptics')) Haptics.failure();
        return;
      }
    } else {
      paymentSuccess = state.spendCoins(item.price);
      if (!paymentSuccess) {
        this.showToast('Not enough coins! Keep playing to earn more.', 'error');
        if (state.get('haptics')) Haptics.failure();
        return;
      }
    }

    if (state.get('soundEffects')) SFX.shopBuy();
    if (state.get('haptics')) Haptics.success();

    // Apply item
    if (item.themeId) {
      const themes = [...new Set([...state.get('unlockedThemes'), item.themeId])];
      state.set('unlockedThemes', themes);
      state.set('currentTheme', item.themeId);
      document.documentElement.setAttribute('data-theme', item.themeId);
    } else if (item.soundId) {
      const sounds = [...new Set([...state.get('unlockedSounds'), item.soundId])];
      state.set('unlockedSounds', sounds);
      state.set('enterSound', item.soundId);
    } else if (item.avatarKey) {
      const avs = [...new Set([...(state.get('unlockedAvatars') || []), item.avatarKey])];
      state.set('unlockedAvatars', avs);
      state.set('currentAvatar', item.avatarKey);
      // Sync into active profile metadata
      const ap = state.getActiveProfile();
      if (ap) state.renameProfile(ap.id, null, item.avatarKey);
    } else if (item.bundle) {
      // Apply each bundle component to inventory
      for (const [k, count] of Object.entries(item.bundle)) {
        state.addItem(k, count);
      }
    } else if (item.statusKey) {
      state.set(item.statusKey, true);
      // Auto-equip exclusive titles/badges
      if (['mastermindTitle', 'rockstarTitle', 'plectrumGod', 'godModeBadge', 'crownOfMath', 'fireBadge', 'roboBadge', 'piPin', 'starBurst'].includes(item.statusKey)) {
        state.set('activeStatusBadge', item.statusKey);
      }
    } else if (item.unique) {
      if (item.id === 'holographicName') state.set('holographicName', true);
      else if (item.id === 'vipStatus') state.set('vipStatus', true);
      else if (item.id === 'goldenAura') state.set('goldenAura', true);
      else if (item.id === 'plectrumGod') state.set('plectrumGod', true);
    } else if (item.stackable) {
      state.addItem(item.id, 1);
    } else if (item.id === 'coffeeBoosts') {
      state.addItem('coffeeBoosts', 1);
    } else if (item.id === 'streakFreezes') {
      state.addItem('streakFreezes', 1);
    }

    this.showToast(`${item.emoji} ${item.name} purchased!`, 'gold');
    this.updateCoinDisplays();
    this.refreshShop();
  }

  // === PROFILE SCREEN ===
  renderProfileScreen() {
    let name = state.get('playerName');
    if (state.get('vipStatus')) name += ' 💎';
    const isHolo = state.get('holographicName');
    const isPlectrumGod = state.get('plectrumGod');
    const statusTitle = isPlectrumGod ? 'Plectrum God' : state.getStatusTitle();
    const statusEmoji = state.getStatusEmoji();
    const balance = state.get('balance');
    const goldenPlectrums = state.get('goldenPlectrums');
    const streakCount = state.get('streakCount');
    const totalGames = state.get('totalGamesPlayed');
    const totalCorrect = state.get('totalCorrect');
    const totalQ = state.get('totalQuestions');
    const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
    const perfectSets = state.get('perfectSets');
    const lucky13s = state.get('lucky13Count') || 0;
    const bestStreak = state.get('bestStreak');
    const currentLevel = state.get('currentLevel');

    // Streak days display
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay(); // 0=Sun, 1=Mon...
    const adjustedToday = today === 0 ? 6 : today - 1; // 0=Mon

    const streakDaysHTML = dayLabels.map((label, i) => {
      let circleClass = '';
      if (i === adjustedToday) circleClass = 'today';
      else if (i < adjustedToday && streakCount > (adjustedToday - i)) circleClass = 'active';
      return `
        <div class="streak-day">
          <div class="streak-day-circle ${circleClass}">${circleClass === 'today' ? '✓' : circleClass === 'active' ? '🔥' : ''}</div>
          <div class="streak-day-label">${label}</div>
        </div>
      `;
    }).join('');

    const streakReward = state.getStreakReward();

    // Settings
    const hapticsOn = state.get('haptics');
    const soundOn = state.get('soundEffects');
    const mentalMathOn = state.get('showMentalMath');
    const hasHabit = state.hasHabitPower();

    return `
      ${this.renderHeaderBar('Profile', 'profileCoinDisplay')}
      <div class="screen-content">
        <div class="profile-header-card ${state.get('goldenAura') ? 'golden-aura' : ''}">
          <div class="profile-avatar" id="editAvatarBtn" style="position: relative; cursor: pointer;" title="Change Avatar">
            ${statusEmoji}
            <div class="avatar-edit-trigger">✏️</div>
          </div>
          <div class="profile-name ${isHolo ? 'holographic' : ''}">${name}</div>
          <div class="profile-status-title">
            ${statusTitle}
            ${hasHabit ? '<br><span class="habit-power-badge" style="margin-top: 6px;">🔥 5× Habit Power Active</span>' : ''}
          </div>
        </div>

        <div class="daily-challenge-card mb-lg">
          <div class="dc-header">
            <span class="dc-title">🎯 Daily Challenge</span>
            <span class="dc-progress">${state.get('dailyChallenge').progress}/${state.get('dailyChallenge').target}</span>
          </div>
          <div class="dc-desc">Complete ${state.get('dailyChallenge').target} logic or math sets today.</div>
          <div class="game-progress" style="margin-top: var(--space-sm); background: rgba(0,0,0,0.2);">
            <div class="game-progress-fill dc-fill" style="width: ${(state.get('dailyChallenge').progress / state.get('dailyChallenge').target) * 100}%; background: var(--gradient-success);"></div>
          </div>
          <div class="dc-reward">
            Reward: 🪙 ${state.get('dailyChallenge').rewardCoins} &nbsp;&nbsp; 🎸 ${state.get('dailyChallenge').rewardPlectrums}
            ${state.get('dailyChallenge').rewardClaimed ? '<span style="color:var(--success); float:right;">✓ Claimed</span>' : ''}
          </div>
        </div>
        
        <div class="profile-stats-grid">
          <div class="profile-stat">
            <div class="profile-stat-value">${currentLevel}</div>
            <div class="profile-stat-label">Level</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${accuracy}%</div>
            <div class="profile-stat-label">Accuracy</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${totalGames}</div>
            <div class="profile-stat-label">Games</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${perfectSets}</div>
            <div class="profile-stat-label">Perfect</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${lucky13s}</div>
            <div class="profile-stat-label">Lucky 13s</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${this.formatNumber(state.get('totalCoinsEarned'))}</div>
            <div class="profile-stat-label">Total 🪙</div>
          </div>
        </div>
        
        <div class="streak-card">
          <div class="streak-title">
            🔥 Daily Streak: ${streakCount} days
            ${hasHabit ? '<span class="habit-power-badge" style="float: right;">5× Habit Power</span>' : ''}
          </div>
          <div class="streak-days">${streakDaysHTML}</div>
          <div class="streak-reward">
            Today's reward: 🪙 ${this.formatNumber(streakReward)} 
            ${Math.min(streakCount + 1, 10) < 10 ? `→ Tomorrow: 🪙 ${this.formatNumber(Math.min(Math.pow(2, streakCount + 1), 10000))}` : '(Max!)'}
          </div>
        </div>
        
        ${goldenPlectrums > 0 ? `
          <div class="card mb-lg" style="text-align: center;">
            <div style="font-size: var(--fs-xl);">🎸</div>
            <div style="font-family: var(--font-display); font-weight: 700; margin-top: var(--space-sm);">Golden Plectrums</div>
            <div style="font-family: var(--font-mono); font-size: var(--fs-xl); color: var(--accent-gold); margin-top: var(--space-xs);">${goldenPlectrums}</div>
            <div style="font-size: var(--fs-xs); color: var(--text-secondary); margin-top: var(--space-xs);">Earned from Pro difficulty</div>
          </div>
        ` : ''}
        
        <div class="settings-section">
          <div class="settings-title">Settings</div>
          
          <div class="settings-row">
            <div class="settings-row-label">Sound Effects</div>
            <button class="toggle ${soundOn ? 'active' : ''}" id="toggleSound">
              <div class="toggle-knob"></div>
            </button>
          </div>
          
          <div class="settings-row">
            <div class="settings-row-label">Haptic Feedback</div>
            <button class="toggle ${hapticsOn ? 'active' : ''}" id="toggleHaptics">
              <div class="toggle-knob"></div>
            </button>
          </div>

          <div class="settings-row">
            <div class="settings-row-label">Practice Mental Math Walkthrough</div>
            <button class="toggle ${mentalMathOn ? 'active' : ''}" id="toggleMentalMath">
              <div class="toggle-knob"></div>
            </button>
          </div>
          
          <div class="settings-row">
            <div class="settings-row-label">Current Theme</div>
            <div class="settings-row-value">${state.get('currentTheme')}</div>
          </div>
          
          <div class="settings-row">
            <div class="settings-row-label">Enter Sound</div>
            <div class="settings-row-value">${state.get('enterSound')}</div>
          </div>
        </div>
        
        <div class="settings-section">
          <div class="settings-title">Inventory</div>
          ${this.renderInventoryRows()}
        </div>

        <div class="settings-section">
          <div class="settings-title">Profiles</div>
          <div class="settings-row" style="justify-content: center; gap: var(--space-md); flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" id="switchProfileBtn">Switch Profile</button>
            <button class="btn btn-secondary btn-sm" id="renameProfileBtn">Rename</button>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-title">Data Management</div>
          <div class="settings-row" style="justify-content: center; gap: var(--space-md); flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" id="exportProgress">Export All Profiles</button>
            <button class="btn btn-secondary btn-sm" id="importProgress">Import Save</button>
            <input type="file" id="importFile" style="display:none;" accept=".json">
          </div>
          <div style="font-size: var(--fs-xs); color: var(--text-tertiary); text-align:center; margin-top: var(--space-sm);">
            Exports include all profiles and their progress.
          </div>
        </div>

        <div style="text-align: center; margin-top: var(--space-xl); padding-bottom: var(--space-xl);">
          <button class="btn btn-danger btn-sm" id="resetProgress">Reset This Profile's Progress</button>
        </div>
      </div>
    `;
  }

  renderInventoryRows() {
    const inv = state.get('inventory') || {};
    const items = [
      { key: 'safetyPins', name: 'Safety Pins', emoji: '🧷' },
      { key: 'timeWarps', name: 'Time Warps', emoji: '⏳' },
      { key: 'greatEscapes', name: 'Great Escapes', emoji: '🪂' },
      { key: 'autoSolve', name: 'Auto-Solve', emoji: '🤖' },
      { key: 'fiftyFifty', name: '50/50', emoji: '🎯' },
      { key: 'crystalBall', name: 'Crystal Ball', emoji: '🔮' },
      { key: 'hintMaster', name: 'Hint Master', emoji: '💡' },
      { key: 'shieldWall', name: 'Shield Wall', emoji: '🛡️' },
      { key: 'doubleOrNothing', name: 'Double or Nothing', emoji: '🎲' },
      { key: 'phoneAFriend', name: 'Phone a Friend', emoji: '📞' },
      { key: 'rewindTime', name: 'Rewind Time', emoji: '⏪' },
      { key: 'mirrorMirror', name: 'Mirror Mirror', emoji: '🪞' },
      { key: 'luckyClover', name: 'Lucky Clover', emoji: '🍀' },
      { key: 'goldRush', name: 'Gold Rush', emoji: '💰' },
      { key: 'coffeeBoosts', name: 'Coffee Boosts', emoji: '☕' },
      { key: 'streakFreezes', name: 'Streak Freezes', emoji: '🧊' },
      { key: 'weekendWarrior', name: 'Weekend Warrior', emoji: '🎉' },
      { key: 'xpExtravaganza', name: 'XP Extravaganza', emoji: '📈' },
      { key: 'plectrumPower', name: 'Plectrum Power', emoji: '🎼' },
      { key: 'rocketFuel', name: 'Rocket Fuel', emoji: '🚀' },
      { key: 'energyDrink', name: 'Energy Drink', emoji: '⚡' },
      { key: 'morningSun', name: 'Morning Sun', emoji: '🌅' },
      { key: 'doubleDip', name: 'Double Dip', emoji: '🍦' },
      { key: 'megaPhone', name: 'Mega Phone', emoji: '📣' },
      { key: 'turboTimer', name: 'Turbo Timer', emoji: '⏱️' },
      { key: 'cloverChain', name: 'Clover Chain', emoji: '☘️' },
      { key: 'comboCarnival', name: 'Combo Carnival', emoji: '🎪' },
    ].filter(it => (inv[it.key] || 0) > 0);

    if (items.length === 0) {
      return `<div class="settings-row"><div class="settings-row-label" style="text-align:center; width:100%; color: var(--text-tertiary);">No items yet — visit the Shop!</div></div>`;
    }

    return items.map(item => `
      <div class="settings-row">
        <div class="settings-row-label">${item.emoji} ${item.name}</div>
        <div class="settings-row-value">${inv[item.key] || 0}</div>
      </div>
    `).join('');
  }

  bindProfileEvents() {
    const toggleSound = document.getElementById('toggleSound');
    if (toggleSound) {
      toggleSound.addEventListener('click', () => {
        const current = state.get('soundEffects');
        state.set('soundEffects', !current);
        toggleSound.classList.toggle('active');
      });
    }

    const toggleHaptics = document.getElementById('toggleHaptics');
    if (toggleHaptics) {
      toggleHaptics.addEventListener('click', () => {
        const current = state.get('haptics');
        state.set('haptics', !current);
        toggleHaptics.classList.toggle('active');
      });
    }

    const toggleMentalMath = document.getElementById('toggleMentalMath');
    if (toggleMentalMath) {
      toggleMentalMath.addEventListener('click', () => {
        const current = state.get('showMentalMath');
        state.set('showMentalMath', !current);
        toggleMentalMath.classList.toggle('active');
        this.showToast(`Mental Math walkthroughs ${!current ? 'Enabled' : 'Disabled'}`);
      });
    }

    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
      editAvatarBtn.addEventListener('click', () => {
        this.showAvatarPickerModal();
      });
    }

    const resetBtn = document.getElementById('resetProgress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.showResetConfirmModal();
      });
    }

    const exportBtn = document.getElementById('exportProgress');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.showExportModal();
      });
    }

    const importBtn = document.getElementById('importProgress');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.showImportModal();
      });
    }

    const switchBtn = document.getElementById('switchProfileBtn');
    if (switchBtn) switchBtn.addEventListener('click', () => this.renderProfileGate({ firstRun: false }));

    const renameBtn = document.getElementById('renameProfileBtn');
    if (renameBtn) renameBtn.addEventListener('click', () => {
      const ap = state.getActiveProfile();
      if (!ap) return;
      this.showRenameProfileModal(ap);
    });
  }

  showExportModal() {
    let modal = document.getElementById('exportModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'exportModal';
      modal.className = 'avatar-modal';
      document.body.appendChild(modal);
    }

    const payload = state.exportAll();
    const jsonStr = JSON.stringify(payload, null, 2);

    modal.innerHTML = `
      <div class="purchase-modal-bg" id="exportModalBg"></div>
      <div class="avatar-picker-card" style="max-width: 480px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: var(--fs-xl);">Export Backup</div>
          <button class="game-close-btn" id="exportModalClose" style="position: static;">✕</button>
        </div>
        <div style="font-size: var(--fs-xs); color: var(--text-secondary); margin-bottom: var(--space-sm);">
          Save this data to transfer your profiles, coins, and progress to another device.
        </div>
        <textarea readonly class="settings-textarea" id="exportJsonText" style="width: 100%; height: 160px; font-family: var(--font-mono); font-size: 11px; padding: var(--space-sm); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); border: var(--border-subtle); resize: none; margin-bottom: var(--space-sm);">${jsonStr}</textarea>
        <div style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-sm);">
          <button class="btn btn-primary btn-full" id="exportCopyBtn">📋 Copy JSON</button>
          <button class="btn btn-secondary btn-full" id="exportDownloadBtn">📥 Download File</button>
        </div>
        <button class="btn btn-secondary btn-full" id="exportModalDone">Done</button>
      </div>
    `;

    modal.classList.add('show');
    const closeModal = () => modal.classList.remove('show');
    document.getElementById('exportModalBg').onclick = closeModal;
    document.getElementById('exportModalClose').onclick = closeModal;
    document.getElementById('exportModalDone').onclick = closeModal;

    const copyBtn = document.getElementById('exportCopyBtn');
    copyBtn.onclick = () => {
      const textarea = document.getElementById('exportJsonText');
      textarea.select();
      navigator.clipboard?.writeText(jsonStr).then(() => {
        this.showToast('Save copied to clipboard! 📋', 'success');
      }).catch(() => {
        document.execCommand('copy');
        this.showToast('Save copied to clipboard! 📋', 'success');
      });
    };

    const dlBtn = document.getElementById('exportDownloadBtn');
    dlBtn.onclick = () => {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mathx_save_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('Download started! 📥', 'success');
      } catch (e) {
        this.showToast('Use "Copy JSON" on this device', 'error');
      }
    };
  }

  showImportModal() {
    let modal = document.getElementById('importModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'importModal';
      modal.className = 'avatar-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="purchase-modal-bg" id="importModalBg"></div>
      <div class="avatar-picker-card" style="max-width: 480px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: var(--fs-xl);">Restore Backup</div>
          <button class="game-close-btn" id="importModalClose" style="position: static;">✕</button>
        </div>
        <div style="font-size: var(--fs-xs); color: var(--text-secondary); margin-bottom: var(--space-sm);">
          Choose a backup JSON file or paste your save text below:
        </div>
        <input type="file" id="modalImportFileInput" accept=".json,application/json" style="display: none;" />
        <button class="btn btn-secondary btn-full" id="btnPickImportFile" style="margin-bottom: var(--space-sm);">
          📁 Choose Backup File (.json)
        </button>
        <textarea class="settings-textarea" id="importJsonInput" placeholder="Or paste backup JSON code here..." style="width: 100%; height: 120px; font-family: var(--font-mono); font-size: 11px; padding: var(--space-sm); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); border: var(--border-subtle); resize: none; margin-bottom: var(--space-sm);"></textarea>
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn-secondary btn-full" id="importModalCancel">Cancel</button>
          <button class="btn btn-primary btn-full" id="importModalRestore">Restore Data</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
    const closeModal = () => modal.classList.remove('show');
    document.getElementById('importModalBg').onclick = closeModal;
    document.getElementById('importModalClose').onclick = closeModal;
    document.getElementById('importModalCancel').onclick = closeModal;

    const fileInput = document.getElementById('modalImportFileInput');
    const pickBtn = document.getElementById('btnPickImportFile');
    pickBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const ok = state.importAll(data);
          if (ok) {
            this.showToast('Save file restored successfully! 🎉', 'success');
            closeModal();
            setTimeout(() => this.render(), 400);
          } else {
            this.showToast('Unrecognized save format.', 'error');
          }
        } catch (err) {
          this.showToast('Invalid JSON in save file.', 'error');
        }
      };
      reader.readAsText(file);
    };

    const restoreBtn = document.getElementById('importModalRestore');
    restoreBtn.onclick = () => {
      const text = document.getElementById('importJsonInput').value.trim();
      if (!text) {
        this.showToast('Please paste save JSON first.', 'error');
        return;
      }
      try {
        const data = JSON.parse(text);
        const ok = state.importAll(data);
        if (ok) {
          this.showToast('Save data restored successfully! 🎉', 'success');
          closeModal();
          setTimeout(() => this.render(), 400);
        } else {
          this.showToast('Unrecognized save format.', 'error');
        }
      } catch (err) {
        this.showToast('Invalid JSON format.', 'error');
      }
    };
  }

  showRenameProfileModal(profile) {
    let modal = document.getElementById('renameModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'renameModal';
      modal.className = 'avatar-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="purchase-modal-bg" id="renameModalBg"></div>
      <div class="avatar-picker-card" style="max-width: 380px;">
        <div style="font-family: var(--font-display); font-weight: 800; font-size: var(--fs-xl); margin-bottom: var(--space-sm);">
          Rename Profile
        </div>
        <input type="text" id="renameInput" maxlength="20" value="${this.escapeHtml(profile.name)}" class="profile-name-input" style="width: 100%; margin-bottom: var(--space-md);" />
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn-secondary btn-full" id="renameCancel">Cancel</button>
          <button class="btn btn-primary btn-full" id="renameSave">Save</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
    const input = document.getElementById('renameInput');
    input.focus();
    input.select();

    const closeModal = () => modal.classList.remove('show');
    document.getElementById('renameModalBg').onclick = closeModal;
    document.getElementById('renameCancel').onclick = closeModal;

    document.getElementById('renameSave').onclick = () => {
      const newName = input.value.trim();
      if (newName) {
        state.renameProfile(profile.id, newName);
        this.showToast('Profile renamed! ✨', 'success');
        closeModal();
        document.getElementById('screen-profile').innerHTML = this.renderProfileScreen();
        this.bindProfileEvents();
        this.bindProfileBubble();
      }
    };
  }

  showResetConfirmModal() {
    let modal = document.getElementById('resetModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'resetModal';
      modal.className = 'avatar-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="purchase-modal-bg" id="resetModalBg"></div>
      <div class="avatar-picker-card" style="max-width: 380px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: var(--space-xs);">⚠️</div>
        <div style="font-family: var(--font-display); font-weight: 800; font-size: var(--fs-xl); margin-bottom: var(--space-xs);">
          Reset All Progress?
        </div>
        <div style="font-size: var(--fs-xs); color: var(--text-secondary); margin-bottom: var(--space-md);">
          This will reset coins, stars, inventory, and unlockables for this profile.
        </div>
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn-secondary btn-full" id="resetCancel">Cancel</button>
          <button class="btn btn-primary btn-full" id="resetConfirm" style="background: var(--error);">Reset</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
    const closeModal = () => modal.classList.remove('show');
    document.getElementById('resetModalBg').onclick = closeModal;
    document.getElementById('resetCancel').onclick = closeModal;

    document.getElementById('resetConfirm').onclick = () => {
      state.resetState();
      document.documentElement.setAttribute('data-theme', 'midnights');
      closeModal();
      this.showToast('Progress reset.', 'success');
      this.render();
    };
  }

  showAvatarPickerModal() {
    let modal = document.getElementById('avatarPickerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avatarPickerModal';
      modal.className = 'avatar-modal';
      document.body.appendChild(modal);
    }

    const unlocked = state.get('unlockedAvatars') || ['🦸','🦄','🐉','🥷','👽','😺','🐼','🦊','🐙','🧙','👨‍🚀','🤖'];
    const current = state.get('currentAvatar') || '🦸';

    // Ensure user has at least default starter avatars in unlocked if empty
    const uniqueUnlocked = [...new Set([...['🦸','🦄','🐉','🥷','👽','😺','🐼','🦊','🐙','🧙','👨‍🚀','🤖'], ...unlocked])];

    const gridHTML = uniqueUnlocked.map(av => `
      <button class="avatar-grid-item ${av === current ? 'active' : ''}" data-avatar="${av}">
        <span class="avatar-grid-emoji">${av}</span>
        ${av === current ? '<span style="font-size: 10px; color: var(--accent-primary); font-weight: bold; margin-top: 2px;">Equipped</span>' : ''}
      </button>
    `).join('');

    modal.innerHTML = `
      <div class="purchase-modal-bg" id="avatarModalBg"></div>
      <div class="avatar-picker-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: var(--fs-xl);">Choose Your Avatar</div>
          <button class="game-close-btn" id="avatarModalClose" style="position: static;">✕</button>
        </div>
        <div class="avatar-grid">
          ${gridHTML}
        </div>
        <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-xs);">
          <button class="btn btn-secondary btn-full" id="avatarModalShop">Shop 🛍️</button>
          <button class="btn btn-primary btn-full" id="avatarModalDone">Done</button>
        </div>
      </div>
    `;

    modal.classList.add('show');

    const closeModal = () => modal.classList.remove('show');
    document.getElementById('avatarModalBg').onclick = closeModal;
    document.getElementById('avatarModalClose').onclick = closeModal;
    document.getElementById('avatarModalDone').onclick = closeModal;

    const shopBtn = document.getElementById('avatarModalShop');
    if (shopBtn) {
      shopBtn.onclick = () => {
        closeModal();
        this._shopCategory = 'avatars';
        this.navigateTo('shop');
        this.refreshShop();
      };
    }

    modal.querySelectorAll('.avatar-grid-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const av = btn.dataset.avatar;
        state.set('currentAvatar', av);
        const ap = state.getActiveProfile();
        if (ap) state.renameProfile(ap.id, null, av);
        this.showToast(`${av} Avatar equipped!`, 'success');
        closeModal();
        document.getElementById('screen-profile').innerHTML = this.renderProfileScreen();
        this.bindProfileEvents();
        this.bindProfileBubble();
      });
    });
  }

  // === TAB BAR & NAVIGATION ===
  renderTabBar() {
    return `
      <nav class="tab-bar" id="tabBar">
        <button class="tab-item active" data-tab="path" id="tabPath">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          Path
        </button>
        <button class="tab-item" data-tab="shop" id="tabShop">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          Shop
        </button>
        <button class="tab-item" data-tab="profile" id="tabProfile">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/>
          </svg>
          Profile
        </button>
      </nav>
    `;
  }

  bindTabEvents() {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.navigateTo(target);
        
        // Update tab active state
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  navigateTo(screenId) {
    // Hide current
    const currentEl = document.querySelector('.screen.active');
    if (currentEl) {
      currentEl.classList.remove('active');
      currentEl.classList.add('exit-left');
      setTimeout(() => currentEl.classList.remove('exit-left'), 350);
    }

    // Show target
    const targetEl = document.getElementById(`screen-${screenId}`);
    if (targetEl) {
      requestAnimationFrame(() => {
        targetEl.classList.add('active');
      });
    }

    this.currentScreen = screenId;

    // Update tab bar active state
    document.querySelectorAll('.tab-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === screenId);
    });
  }

  hideTabBar() {
    const tabBar = document.getElementById('tabBar');
    if (tabBar) tabBar.style.display = 'none';
  }

  showTabBar() {
    const tabBar = document.getElementById('tabBar');
    if (tabBar) tabBar.style.display = '';
  }

  // === TOAST NOTIFICATIONS ===
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // === UTILITIES ===
  formatNumber(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  updateCoinDisplays() {
    const balance = this.formatNumber(state.get('balance'));
    ['coinDisplay', 'shopCoinDisplay', 'profileCoinDisplay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = balance;
    });
  }
}
