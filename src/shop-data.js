/**
 * MathX - Shop & Economy Data
 * All purchasable items, themes, and boosts
 */

const SHOP_CATEGORIES = {
  powerups: {
    label: 'Power-ups',
    emoji: '⚡',
    items: [
      {
        id: 'safetyPins',
        name: 'Safety Pin',
        emoji: '🧷',
        description: 'Ignore 1 wrong answer in a set. Your streak stays alive!',
        price: 500,
        currency: 'coins',
        stackable: true,
        maxStack: 10,
      },
      {
        id: 'timeWarps',
        name: 'Time Warp',
        emoji: '⏳',
        description: 'Freeze the timer for 5 extra seconds on one question.',
        price: 300,
        currency: 'coins',
        stackable: true,
        maxStack: 10,
      },
      {
        id: 'greatEscapes',
        name: 'Great Escape',
        emoji: '🪂',
        description: 'Keep your earned coins even if The Great Reset triggers.',
        price: 750,
        currency: 'coins',
        stackable: true,
        maxStack: 5,
      },
      {
        id: 'autoSolve',
        name: 'Auto-Solve',
        emoji: '🤖',
        description: 'Skip a question and automatically mark it correct.',
        price: 1000,
        currency: 'coins',
        stackable: true,
        maxStack: 3,
      },
    ]
  },
  boosts: {
    label: 'Boosts',
    emoji: '🚀',
    items: [
      {
        id: 'coffeeBoosts',
        name: 'Coffee Boost',
        emoji: '☕',
        description: '1.5× coin earnings for 30 minutes. Stack those coins!',
        price: 1000,
        currency: 'coins',
        stackable: true,
        maxStack: 5,
      },
      {
        id: 'streakFreezes',
        name: 'Streak Freeze',
        emoji: '🧊',
        description: 'Protect your daily streak if you miss a day. One-time use.',
        price: 800,
        currency: 'coins',
        stackable: true,
        maxStack: 3,
      },
      {
        id: 'weekendWarrior',
        name: 'Weekend Warrior',
        emoji: '🎉',
        description: '2× coin multiplier for the next 1 hour.',
        price: 2000,
        currency: 'coins',
        stackable: true,
        maxStack: 3,
      },
    ]
  },
  themes: {
    label: 'Themes',
    emoji: '🎨',
    items: [
      {
        id: 'midnights',
        name: 'Midnights',
        emoji: '🌙',
        description: 'Dark sparkle vibes. The default cosmic theme.',
        price: 0,
        currency: 'coins',
        themeId: 'midnights',
        owned: true, // always owned
      },
      {
        id: 'folklore',
        name: 'Folklore',
        emoji: '🍂',
        description: 'Earthy, warm tones. Like a cozy cabin in the woods.',
        price: 2000,
        currency: 'coins',
        themeId: 'folklore',
      },
      {
        id: '1989',
        name: '1989',
        emoji: '🌊',
        description: 'Neon cyan and hot pink. Pure retro-futurism.',
        price: 3000,
        currency: 'coins',
        themeId: '1989',
      },
      {
        id: 'reputation',
        name: 'Reputation',
        emoji: '🐍',
        description: 'Black and gold. Power moves only.',
        price: 5000,
        currency: 'coins',
        themeId: 'reputation',
      },
      {
        id: 'barbie',
        name: 'Barbie',
        emoji: '🎀',
        description: 'Bright pinks and neon vibes. Life in plastic!',
        price: 4000,
        currency: 'coins',
        themeId: 'barbie',
      },
      {
        id: 'oppenheimer',
        name: 'Oppenheimer',
        emoji: '💣',
        description: 'Deep grays and explosive fiery oranges.',
        price: 4000,
        currency: 'coins',
        themeId: 'oppenheimer',
      },
      {
        id: 'hacker',
        name: 'Hacker',
        emoji: '💻',
        description: 'Matrix green on deep black. Time to code.',
        price: 6000,
        currency: 'coins',
        themeId: 'hacker',
      },
      {
        id: 'lover',
        name: 'Lover',
        emoji: '💕',
        description: 'Pastel pinks and soft blues. A dreamy aesthetic.',
        price: 5000,
        currency: 'coins',
        themeId: 'lover',
      },

      // ===== VIBRANT COLLECTION (Dual-Mode Dark / Light) =====
      // Each family ships with a matched Dark + Light variant.

      // --- Aurora: electric violet + teal ---
      {
        id: 'auroraDark',
        name: 'Aurora • Dark',
        emoji: '🌌',
        description: 'Electric violet & teal ribbons shimmering across a deep night sky.',
        price: 4500,
        currency: 'coins',
        themeId: 'aurora-dark',
      },
      {
        id: 'auroraLight',
        name: 'Aurora • Light',
        emoji: '🌠',
        description: 'Aurora reimagined at dawn — soft cloud-white with violet & teal highlights.',
        price: 4500,
        currency: 'coins',
        themeId: 'aurora-light',
      },

      // --- Vaporwave: neon magenta + cyan retro-future ---
      {
        id: 'vaporwaveDark',
        name: 'Vaporwave • Dark',
        emoji: '🌴',
        description: 'Hyper-saturated magenta & cyan glow over a midnight grid. Pure 80s energy.',
        price: 5500,
        currency: 'coins',
        themeId: 'vaporwave-dark',
      },
      {
        id: 'vaporwaveLight',
        name: 'Vaporwave • Light',
        emoji: '🏝️',
        description: 'Sun-bleached pastel vaporwave. Cotton-candy magenta & cyan on ivory.',
        price: 5500,
        currency: 'coins',
        themeId: 'vaporwave-light',
      },

      // --- Citrus: electric lime + tangerine pop ---
      {
        id: 'citrusDark',
        name: 'Citrus • Dark',
        emoji: '🍊',
        description: 'Electric lime & tangerine punch against a charcoal backdrop. Zero chill.',
        price: 4000,
        currency: 'coins',
        themeId: 'citrus-dark',
      },
      {
        id: 'citrusLight',
        name: 'Citrus • Light',
        emoji: '🍋',
        description: 'Sunlit lime & tangerine on crisp ivory. Wakes up your whole screen.',
        price: 4000,
        currency: 'coins',
        themeId: 'citrus-light',
      },
    ]
  },
  status: {
    label: 'Status',
    emoji: '✨',
    items: [
      {
        id: 'holographicName',
        name: 'Holo Name',
        emoji: '🌈',
        description: 'Your name shimmers with a holographic rainbow effect.',
        price: 3000,
        currency: 'coins',
        unique: true,
      },
      {
        id: 'guitarSound',
        name: 'Guitar Strum',
        emoji: '🎸',
        description: 'A sweet guitar strum plays when you submit an answer.',
        price: 1500,
        currency: 'coins',
        soundId: 'guitar',
        unique: true,
      },
      {
        id: 'cashSound',
        name: 'Cash Register',
        emoji: '💰',
        description: 'Ka-ching! A cash register sound on every correct answer.',
        price: 1500,
        currency: 'coins',
        soundId: 'cash',
        unique: true,
      },
      {
        id: 'vipStatus',
        name: 'VIP Badge',
        emoji: '💎',
        description: 'A fancy diamond badge next to your name!',
        price: 25,
        currency: 'plectrums',
        unique: true,
      },
    ]
  },
  exclusives: {
    label: 'Exclusives',
    emoji: '🎸',
    items: [
      {
        id: 'plectrumGod',
        name: 'Plectrum God Title',
        emoji: '👑',
        description: 'The ultimate flex. Changes your title to "Plectrum God".',
        price: 100,
        currency: 'plectrums',
        unique: true,
      },
      {
        id: 'goldenAura',
        name: 'Golden Aura',
        emoji: '✨',
        description: 'Surrounds your profile with a permanent golden glow.',
        price: 50,
        currency: 'plectrums',
        unique: true,
      },
    ]
  },
};

/**
 * Get all items for a category
 */
function getShopItems(category) {
  return SHOP_CATEGORIES[category]?.items || [];
}

/**
 * Get all categories
 */
function getShopCategories() {
  return Object.entries(SHOP_CATEGORIES).map(([key, val]) => ({
    id: key,
    label: val.label,
    emoji: val.emoji,
  }));
}

/**
 * Check if an item is owned/equipped
 */
function getItemStatus(itemId, state) {
  // Check themes
  if (state.unlockedThemes.includes(itemId)) {
    return state.currentTheme === itemId ? 'equipped' : 'owned';
  }
  
  // Check sounds
  if (state.unlockedSounds.includes(itemId.replace('Sound', '').toLowerCase())) {
    return state.enterSound === itemId.replace('Sound', '').toLowerCase() ? 'equipped' : 'owned';
  }
  
  // Check holographic name and other unique status items
  if (itemId === 'holographicName' && state.holographicName) return 'owned';
  if (itemId === 'vipStatus' && state.vipStatus) return 'owned';
  if (itemId === 'goldenAura' && state.goldenAura) return 'owned';
  if (itemId === 'plectrumGod' && state.plectrumGod) return 'owned';
  
  // Check stackable items
  if (state.inventory[itemId] !== undefined && state.inventory[itemId] > 0) {
    return `owned:${state.inventory[itemId]}`;
  }
  
  return 'available';
}

export { SHOP_CATEGORIES, getShopItems, getShopCategories, getItemStatus };
