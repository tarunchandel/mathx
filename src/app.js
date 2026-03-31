/**
 * MathX - The Mastermind Eras Tour
 * Main Application Controller
 */

import { state } from './state.js';
import { 
  generateQuestionSet, checkAnswer, getLevelConfig, getDifficultyConfig, calculateCoins, LEVEL_CONFIG,
  generatePracticeSet, getAvailableOps, SKILL_CONFIG, PRACTICE_POINTS_REQUIRED, PRACTICE_POINTS_PER_CORRECT
} from './engine.js';
import { getSmartTip } from './tips.js';
import { SHOP_CATEGORIES, getShopCategories, getItemStatus } from './shop-data.js';
import { SFX, Haptics } from './audio.js';

export class App {
  constructor() {
    this.currentScreen = 'path';
    this.gameState = null;
    this.timerInterval = null;
    this.questionStartTime = null;
  }

  init() {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', state.get('currentTheme') || 'midnights');
    
    // Check daily streak and calculate current level based on sub-level clearing
    state.checkStreak();
    state.recalculateCurrentLevel();
    
    // Show splash then render
    this.showSplash();
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
      <div class="header-bar">
        <div class="header-title">MathX</div>
        <div class="header-coins" id="headerCoins">
          <span class="coin-icon">🪙</span>
          <span id="coinDisplay">${this.formatNumber(state.get('balance'))}</span>
        </div>
      </div>
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
      const diffConfig = getDifficultyConfig(diffKey);
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
        this.hideLevelModal();
        setTimeout(() => this.startPractice(level, opt.dataset.op), 300);
      };
    });

    document.querySelectorAll('.quiz-opt').forEach(opt => {
      opt.onclick = () => {
        this.hideLevelModal();
        setTimeout(() => this.startGame(level, opt.dataset.diff), 300);
      };
    });
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
  startGame(level, difficulty) {
    const questions = generateQuestionSet(level);
    const diffConfig = getDifficultyConfig(difficulty);

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
      safetyPinUsed: false,
      greatEscapeActive: false,
      timeWarpUsed: false,
    };

    // Check for active powerups
    const inv = state.get('inventory');
    
    this.renderGameScreen();
    this.navigateTo('game');
    this.hideTabBar();
    
    // Start timer if applicable
    if (diffConfig.timer) {
      this.startTimer();
    }
    
    this.questionStartTime = Date.now();
  }

  renderGameScreen() {
    const gs = this.gameState;
    const q = gs.questions[gs.currentQuestion];
    const diffConfig = gs.diffConfig;
    const inv = state.get('inventory');

    // Active powerup chips
    let powerupsHTML = '';
    if (inv.safetyPins > 0 && !gs.safetyPinUsed) {
      powerupsHTML += `<span class="active-powerup-chip" id="useSafetyPin" title="Click to activate">🧷 Safety Pin (${inv.safetyPins})</span>`;
    }
    if (inv.timeWarps > 0 && !gs.timeWarpUsed && diffConfig.timer) {
      powerupsHTML += `<span class="active-powerup-chip" id="useTimeWarp" title="Click to activate">⏳ Time Warp (${inv.timeWarps})</span>`;
    }
    if (inv.greatEscapes > 0 && !gs.greatEscapeActive) {
      powerupsHTML += `<span class="active-powerup-chip" id="useGreatEscape" title="Click to activate">🪂 Great Escape (${inv.greatEscapes})</span>`;
    }
    if (inv.autoSolve > 0) {
      powerupsHTML += `<span class="active-powerup-chip" id="useAutoSolve" title="Click to activate">🤖 Auto-Solve (${inv.autoSolve})</span>`;
    }

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
        ${powerupsHTML ? `<div class="active-items-row">${powerupsHTML}</div>` : ''}
      </div>
      
      <div class="game-question-area">
        <div class="question-number">Question ${gs.currentQuestion + 1} of 10</div>
        <div class="question-text" id="questionText">${q.display}</div>
        <div class="answer-display" id="answerDisplay">
          <span id="answerText">${gs.userAnswer}</span><span class="cursor-blink"></span>
        </div>
        <div class="game-coins" id="gameCoins">
          🪙 <span id="setCoins">${gs.setCoins}</span>
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

    // Close button
    const closeBtn = document.getElementById('gameCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.exitGame());
    }

    // Powerup buttons
    const safetyPin = document.getElementById('useSafetyPin');
    if (safetyPin) {
      safetyPin.addEventListener('click', () => {
        if (state.useItem('safetyPins')) {
          this.gameState.safetyPinUsed = true;
          safetyPin.remove();
          this.showToast('🧷 Safety Pin activated!', 'success');
          if (state.get('soundEffects')) SFX.coin();
          if (state.get('haptics')) Haptics.light();
        }
      });
    }

    const timeWarp = document.getElementById('useTimeWarp');
    if (timeWarp) {
      timeWarp.addEventListener('click', () => {
        if (state.useItem('timeWarps')) {
          this.gameState.timeWarpUsed = true;
          this.gameState.timerValue += 5;
          this.updateTimerDisplay();
          timeWarp.remove();
          this.showToast('⏳ Time Warp! +5s', 'success');
          if (state.get('soundEffects')) SFX.coin();
          if (state.get('haptics')) Haptics.light();
        }
      });
    }

    const greatEscape = document.getElementById('useGreatEscape');
    if (greatEscape) {
      greatEscape.addEventListener('click', () => {
        if (state.useItem('greatEscapes')) {
          this.gameState.greatEscapeActive = true;
          greatEscape.remove();
          this.showToast('🪂 Great Escape activated!', 'success');
          if (state.get('soundEffects')) SFX.coin();
          if (state.get('haptics')) Haptics.light();
        }
      });
    }

    const autoSolve = document.getElementById('useAutoSolve');
    if (autoSolve) {
      autoSolve.addEventListener('click', () => {
        if (state.useItem('autoSolve')) {
          const q = this.gameState.questions[this.gameState.currentQuestion];
          this.gameState.userAnswer = String(q.answer);
          this.showToast('🤖 Auto-Solve used!', 'success');
          this.submitAnswer();
          autoSolve.remove();
        }
      });
    }

    // Keyboard support
    this._keyHandler = (e) => {
      if (this.currentScreen !== 'game') return;
      if (e.key >= '0' && e.key <= '9') this.handleKeyPress(e.key);
      else if (e.key === '.') this.handleKeyPress('.');
      else if (e.key === '-') this.handleKeyPress('-');
      else if (e.key === 'Backspace') this.handleKeyPress('backspace');
      else if (e.key === 'Enter') this.handleKeyPress('submit');
    };
    document.addEventListener('keydown', this._keyHandler);
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
    if (!gs || gs.userAnswer === '' || gs.userAnswer === '-') return;

    const q = gs.questions[gs.currentQuestion];
    const answerTime = Date.now() - this.questionStartTime;
    gs.questionTimes.push(answerTime);
    const isCorrect = checkAnswer(q, gs.userAnswer);
    
    // Lucky 13 check (answered in ~1.3s)
    const timeSec = answerTime / 1000;
    const isLucky13 = isCorrect && Math.abs(timeSec - 1.3) < 0.15;

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
      let qCoins = gs.level * gs.diffConfig.multiplier;
      
      // Coffee boost & Weekend Warrior
      if (state.isCoffeeBoostActive()) {
        qCoins = Math.floor(qCoins * 1.5);
      }
      if (state.isWeekendWarriorActive && state.isWeekendWarriorActive()) {
        qCoins *= 2;
      }

      // Lucky 13
      if (isLucky13) {
        qCoins *= 13;
        this.triggerLucky13();
        state.set('lucky13Count', (state.get('lucky13Count') || 0) + 1);
      }

      gs.setCoins += qCoins;
      gs.correctCount++;

      const setCoinsEl = document.getElementById('setCoins');
      if (setCoinsEl) setCoinsEl.textContent = gs.setCoins;

      // Move to next question
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
      
      // Check safety pin
      if (gs.safetyPinUsed) {
        // Safety pin absorbs the hit
        gs.safetyPinUsed = false; // used up
        if (state.get('soundEffects')) SFX.wrong();
        if (state.get('haptics')) Haptics.medium();
        this.showToast('🧷 Safety Pin saved you!', 'success');
        
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
      
      state.update({
        totalGamesPlayed: state.get('totalGamesPlayed') + 1,
        totalCorrect: state.get('totalCorrect') + gs.correctCount,
        totalQuestions: state.get('totalQuestions') + 10,
      });

      this.handlePostGameUpdates();
      this.showResults(gs, 0, 0, null, pointsEarned);
      return;
    }

    // --- NORMAL QUIZ LOGIC ---
    let totalCoins = gs.setCoins;
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
      if (state.get('streakCount') > 1) {
        setTimeout(() => {
           this.triggerStreakCelebration(state.get('streakCount'));
        }, 800);
      }
    }

    // Daily Challenge logic
    state.addChallengeProgress();
    const reward = state.claimChallengeReward();
    if (reward) {
      setTimeout(() => {
        this.showToast(`🏆 Daily Challenge Complete! +${reward.coins}🪙 +${reward.plectrums}🎸`, 'gold');
        this.spawnSparkles(20);
        if (state.get('soundEffects')) SFX.levelComplete();
      }, 1500);
    }
  }

  triggerStreakCelebration(streakCount) {
    if (state.get('soundEffects')) SFX.lucky13(); // Reusing a hype sound
    const overlay = document.createElement('div');
    overlay.className = 'streak-celebration-overlay active';
    overlay.innerHTML = `
      <div class="streak-anim-content">
        <div style="font-size: 80px;">🔥</div>
        <div class="streak-anim-text">${streakCount} DAY STREAK!</div>
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
              Practice Complete!
            </div>
            
            <div class="results-coins" style="color: var(--success); font-size: var(--fs-xl);">
              <span>${skill.emoji}</span>
              <span>+${pointsEarned} Points</span>
            </div>
            <div style="font-size: var(--fs-sm); color: var(--text-secondary); margin-bottom: var(--space-md);">
              ${gs.correctCount} of 10 Correct
            </div>
            
            <div style="display: flex; gap: var(--space-md); width: 100%; max-width: 300px; margin-top: var(--space-lg);">
              <button class="btn btn-secondary btn-full" id="resultsHome">Home</button>
              <button class="btn btn-primary btn-full" id="resultsRetry">Practice Again</button>
            </div>
          </div>
        </div>
      `;
      this.navigateTo('results');
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
    
    // Re-render path and profile with updated data
    document.getElementById('screen-path').innerHTML = this.renderPathScreen();
    this.bindPathEvents();
    document.getElementById('screen-profile').innerHTML = this.renderProfileScreen();
    this.bindProfileEvents();
    this.updateCoinDisplays();
    
    this.navigateTo('path');
    this.showTabBar();
  }

  // === TIMER ===
  startTimer() {
    const gs = this.gameState;
    if (!gs || !gs.diffConfig.timer) return;
    
    gs.timerValue = gs.diffConfig.timer;
    if (gs.timeWarpUsed) {
      // already applied
    }
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (gs.isTimerFrozen) return;
      
      gs.timerValue = Math.max(0, gs.timerValue - 0.1);
      this.updateTimerDisplay();
      
      if (gs.timerValue <= 0) {
        // Time's up - same as wrong answer
        this.stopTimer();
        
        // Check safety pin
        if (gs.safetyPinUsed) {
          gs.safetyPinUsed = false;
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
    
    const tabsHTML = categories.map(cat => 
      `<button class="shop-tab ${cat.id === activeCategory ? 'active' : ''}" data-category="${cat.id}">${cat.emoji} ${cat.label}</button>`
    ).join('');

    const items = SHOP_CATEGORIES[activeCategory]?.items || [];
    const stateData = {
      unlockedThemes: state.get('unlockedThemes'),
      currentTheme: state.get('currentTheme'),
      unlockedSounds: state.get('unlockedSounds'),
      enterSound: state.get('enterSound'),
      holographicName: state.get('holographicName'),
      vipStatus: state.get('vipStatus'),
      goldenAura: state.get('goldenAura'),
      plectrumGod: state.get('plectrumGod'),
      inventory: state.get('inventory'),
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
      <div class="header-bar">
        <div class="header-title">Shop</div>
        <div class="header-coins">
          <span class="coin-icon">🪙</span>
          <span id="shopCoinDisplay">${this.formatNumber(state.get('balance'))}</span>
        </div>
      </div>
      <div class="screen-content">
        <div class="shop-tabs">${tabsHTML}</div>
        <div class="shop-grid">${itemsHTML}</div>
      </div>
    `;
  }

  bindShopEvents() {
    // Category tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._shopCategory = tab.dataset.category;
        document.getElementById('screen-shop').innerHTML = this.renderShopScreen();
        this.bindShopEvents();
      });
    });

    // Shop items
    document.querySelectorAll('.shop-item').forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.dataset.itemId;
        const category = item.dataset.category;
        this.handleShopItemClick(itemId, category);
      });
    });
  }

  handleShopItemClick(itemId, category) {
    const items = SHOP_CATEGORIES[category]?.items || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const stateData = {
      unlockedThemes: state.get('unlockedThemes'),
      currentTheme: state.get('currentTheme'),
      unlockedSounds: state.get('unlockedSounds'),
      enterSound: state.get('enterSound'),
      holographicName: state.get('holographicName'),
      inventory: state.get('inventory'),
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
      const themes = [...state.get('unlockedThemes'), item.themeId];
      state.set('unlockedThemes', themes);
      state.set('currentTheme', item.themeId);
      document.documentElement.setAttribute('data-theme', item.themeId);
    } else if (item.soundId) {
      const sounds = [...state.get('unlockedSounds'), item.soundId];
      state.set('unlockedSounds', sounds);
      state.set('enterSound', item.soundId);
    } else if (item.unique) {
      if (item.id === 'holographicName') {
        state.set('holographicName', true);
      } else if (item.id === 'vipStatus') {
        state.set('vipStatus', true);
      } else if (item.id === 'goldenAura') {
        state.set('goldenAura', true);
      } else if (item.id === 'plectrumGod') {
        state.set('plectrumGod', true);
      }
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

    return `
      <div class="header-bar">
        <div class="header-title">Profile</div>
        <div class="header-coins">
          <span class="coin-icon">🪙</span>
          <span id="profileCoinDisplay">${this.formatNumber(balance)}</span>
        </div>
      </div>
      <div class="screen-content">
        <div class="profile-header-card ${state.get('goldenAura') ? 'golden-aura' : ''}">
          <div class="profile-avatar">${statusEmoji}</div>
          <div class="profile-name ${isHolo ? 'holographic' : ''}">${name}</div>
          <div class="profile-status-title">${statusTitle}</div>
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
          <div class="streak-title">🔥 Daily Streak: ${streakCount} days</div>
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
          <div class="settings-title">Data Management</div>
          <div class="settings-row" style="justify-content: center; gap: var(--space-md);">
            <button class="btn btn-secondary btn-sm" id="exportProgress">Export Save</button>
            <button class="btn btn-secondary btn-sm" id="importProgress">Import Save</button>
            <input type="file" id="importFile" style="display:none;" accept=".json">
          </div>
        </div>

        <div style="text-align: center; margin-top: var(--space-xl); padding-bottom: var(--space-xl);">
          <button class="btn btn-danger btn-sm" id="resetProgress">Reset All Progress</button>
        </div>
      </div>
    `;
  }

  renderInventoryRows() {
    const inv = state.get('inventory');
    const items = [
      { key: 'safetyPins', name: 'Safety Pins', emoji: '🧷' },
      { key: 'timeWarps', name: 'Time Warps', emoji: '⏳' },
      { key: 'greatEscapes', name: 'Great Escapes', emoji: '🪂' },
      { key: 'autoSolve', name: 'Auto-Solve', emoji: '🤖' },
      { key: 'coffeeBoosts', name: 'Coffee Boosts', emoji: '☕' },
      { key: 'streakFreezes', name: 'Streak Freezes', emoji: '🧊' },
      { key: 'weekendWarrior', name: 'Weekend Warrior', emoji: '🎉' },
    ];

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

    const resetBtn = document.getElementById('resetProgress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure? This will reset ALL progress, coins, and items!')) {
          state.resetState();
          document.documentElement.setAttribute('data-theme', 'midnights');
          this.render();
        }
      });
    }

    const exportBtn = document.getElementById('exportProgress');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.state));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `mathx_save_${new Date().getTime()}.json`);
        dlAnchorElem.click();
      });
    }

    const importBtn = document.getElementById('importProgress');
    const importFile = document.getElementById('importFile');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => {
        importFile.click();
      });
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            state.resetState();
            state.update(data);
            this.showToast('Save file loaded successfully!', 'success');
            setTimeout(() => this.render(), 500);
          } catch (err) {
            this.showToast('Failed to load save file.', 'error');
          }
        };
        reader.readAsText(file);
      });
    }
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
