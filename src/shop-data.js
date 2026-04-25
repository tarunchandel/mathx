/**
 * MathX - Shop & Economy Data
 * All purchasable items, themes, and boosts
 */

const SHOP_CATEGORIES = {
  powerups: {
    label: 'Power-ups',
    emoji: '⚡',
    items: [
      { id: 'safetyPins',   name: 'Safety Pin',     emoji: '🧷', description: 'Ignore 1 wrong answer in a set. Your streak stays alive!', price: 500,  currency: 'coins', stackable: true, maxStack: 10 },
      { id: 'timeWarps',    name: 'Time Warp',      emoji: '⏳', description: 'Freeze the timer for 5 extra seconds on one question.',     price: 300,  currency: 'coins', stackable: true, maxStack: 10 },
      { id: 'greatEscapes', name: 'Great Escape',   emoji: '🪂', description: 'Keep your earned coins even if The Great Reset triggers.',  price: 750,  currency: 'coins', stackable: true, maxStack: 5  },
      { id: 'autoSolve',    name: 'Auto-Solve',     emoji: '🤖', description: 'Skip a question and automatically mark it correct.',        price: 1000, currency: 'coins', stackable: true, maxStack: 3  },
      // === New 10 power-ups ===
      { id: 'fiftyFifty',   name: '50/50',          emoji: '🎯', description: 'Show two possible answers — you pick the right one.',       price: 600,  currency: 'coins', stackable: true, maxStack: 10 },
      { id: 'crystalBall',  name: 'Crystal Ball',   emoji: '🔮', description: 'Reveal the first digit of the next answer.',                price: 400,  currency: 'coins', stackable: true, maxStack: 10 },
      { id: 'hintMaster',   name: 'Hint Master',    emoji: '💡', description: 'Get a strategic hint for one question.',                    price: 350,  currency: 'coins', stackable: true, maxStack: 10 },
      { id: 'shieldWall',   name: 'Shield Wall',    emoji: '🛡️', description: 'Absorbs the first wrong answer of every set in this run.', price: 1200, currency: 'coins', stackable: true, maxStack: 5  },
      { id: 'doubleOrNothing', name: 'Double or Nothing', emoji: '🎲', description: 'Stake current set coins for a 2× payout if perfect.', price: 800, currency: 'coins', stackable: true, maxStack: 5 },
      { id: 'phoneAFriend', name: 'Phone a Friend', emoji: '📞', description: 'Skip one question without penalty. No coins for it.',      price: 500,  currency: 'coins', stackable: true, maxStack: 5  },
      { id: 'rewindTime',   name: 'Rewind Time',    emoji: '⏪', description: 'Re-attempt the last question you got wrong.',               price: 900,  currency: 'coins', stackable: true, maxStack: 3  },
      { id: 'mirrorMirror', name: 'Mirror Mirror',  emoji: '🪞', description: 'Swap a question for an easier sibling problem.',           price: 650,  currency: 'coins', stackable: true, maxStack: 5  },
      { id: 'luckyClover',  name: 'Lucky Clover',   emoji: '🍀', description: '+15% chance for Lucky 13 to trigger this set.',            price: 1100, currency: 'coins', stackable: true, maxStack: 5  },
      { id: 'goldRush',     name: 'Gold Rush',      emoji: '💰', description: 'Triple the coin reward of one correct answer.',            price: 700,  currency: 'coins', stackable: true, maxStack: 5  },
    ]
  },
  boosts: {
    label: 'Boosts',
    emoji: '🚀',
    items: [
      { id: 'coffeeBoosts',   name: 'Coffee Boost',   emoji: '☕', description: '1.5× coin earnings for 30 minutes. Stack those coins!',  price: 1000, currency: 'coins', stackable: true, maxStack: 5 },
      { id: 'streakFreezes',  name: 'Streak Freeze',  emoji: '🧊', description: 'Protect your daily streak if you miss a day.',           price: 800,  currency: 'coins', stackable: true, maxStack: 3 },
      { id: 'weekendWarrior', name: 'Weekend Warrior',emoji: '🎉', description: '2× coin multiplier for the next 1 hour.',                price: 2000, currency: 'coins', stackable: true, maxStack: 3 },
      // === New 10 boosts ===
      { id: 'xpExtravaganza', name: 'XP Extravaganza',emoji: '📈', description: '+50% practice points for 1 hour.',                       price: 1500, currency: 'coins', stackable: true, maxStack: 5 },
      { id: 'plectrumPower',  name: 'Plectrum Power', emoji: '🎼', description: '2× plectrum drops in GOAT mode for 1 hour.',             price: 2500, currency: 'coins', stackable: true, maxStack: 3 },
      { id: 'rocketFuel',     name: 'Rocket Fuel',    emoji: '🚀', description: '3× coins for the next single set.',                      price: 1800, currency: 'coins', stackable: true, maxStack: 5 },
      { id: 'energyDrink',    name: 'Energy Drink',   emoji: '⚡', description: '+3 sec on every Vibe Check timer for 30 min.',           price: 1200, currency: 'coins', stackable: true, maxStack: 5 },
      { id: 'morningSun',     name: 'Morning Sun',    emoji: '🌅', description: 'First set of the day pays 5×. Resets at midnight.',     price: 2200, currency: 'coins', stackable: true, maxStack: 3 },
      { id: 'doubleDip',      name: 'Double Dip',     emoji: '🍦', description: 'Earn coins AND practice points on Quiz sets for 1 hr.',  price: 1700, currency: 'coins', stackable: true, maxStack: 5 },
      { id: 'megaPhone',      name: 'Mega Phone',     emoji: '📣', description: '2× streak reward bonus for the next 7 days.',            price: 3000, currency: 'coins', stackable: true, maxStack: 2 },
      { id: 'turboTimer',     name: 'Turbo Timer',    emoji: '⏱️', description: 'GOAT mode bumped to 4 sec/question for 30 min.',         price: 2000, currency: 'coins', stackable: true, maxStack: 3 },
      { id: 'cloverChain',    name: 'Clover Chain',   emoji: '☘️', description: 'Each consecutive correct gives +1% bonus, up to 30%.',   price: 1900, currency: 'coins', stackable: true, maxStack: 3 },
      { id: 'comboCarnival',  name: 'Combo Carnival', emoji: '🎪', description: 'Perfect-set bonus tripled for the next set.',            price: 2400, currency: 'coins', stackable: true, maxStack: 3 },
    ]
  },
  themes: {
    label: 'Themes',
    emoji: '🎨',
    items: [
      // === Originals ===
      { id: 'midnights',         name: 'Midnights',           emoji: '🌙', description: 'Dark sparkle vibes. The default cosmic theme.',          price: 0,    currency: 'coins', themeId: 'midnights', owned: true, mode: 'dark' },
      { id: 'midnightsLight',    name: 'Midnights · Light',   emoji: '🌤️', description: 'Lavender daydream — Midnights flipped to bright.',       price: 2000, currency: 'coins', themeId: 'midnightsLight', mode: 'light' },
      { id: 'folklore',          name: 'Folklore · Dark',     emoji: '🍂', description: 'Earthy, warm tones. A cozy cabin in the woods.',        price: 2000, currency: 'coins', themeId: 'folklore', mode: 'dark' },
      { id: 'folkloreLight',     name: 'Folklore · Light',    emoji: '🌾', description: 'Sun-drenched parchment & honey gold.',                  price: 2000, currency: 'coins', themeId: 'folkloreLight', mode: 'light' },
      { id: '1989',              name: '1989 · Dark',         emoji: '🌊', description: 'Neon cyan and hot pink. Pure retro-futurism.',          price: 3000, currency: 'coins', themeId: '1989', mode: 'dark' },
      { id: 'retro1989Light',    name: '1989 · Light',        emoji: '🩵', description: 'Vaporwave on cotton-candy daylight.',                   price: 3000, currency: 'coins', themeId: 'retro1989Light', mode: 'light' },
      { id: 'reputation',        name: 'Reputation · Dark',   emoji: '🐍', description: 'Black and gold. Power moves only.',                     price: 5000, currency: 'coins', themeId: 'reputation', mode: 'dark' },
      { id: 'reputationLight',   name: 'Reputation · Light',  emoji: '👑', description: 'Cream & molten gold. Elegant flex.',                    price: 5000, currency: 'coins', themeId: 'reputationLight', mode: 'light' },
      { id: 'barbie',            name: 'Barbie · Light',      emoji: '🎀', description: 'Bright pinks and neon vibes. Life in plastic!',         price: 4000, currency: 'coins', themeId: 'barbie', mode: 'light' },
      { id: 'barbieDark',        name: 'Barbie · Dark',       emoji: '💋', description: 'After-dark Malibu — neon hot-pink on midnight.',        price: 4000, currency: 'coins', themeId: 'barbieDark', mode: 'dark' },
      { id: 'oppenheimer',       name: 'Oppenheimer · Dark',  emoji: '💣', description: 'Deep grays and explosive fiery oranges.',               price: 4000, currency: 'coins', themeId: 'oppenheimer', mode: 'dark' },
      { id: 'oppenheimerLight',  name: 'Oppenheimer · Light', emoji: '☀️', description: 'Sunlit desert — cream parchment, scorched orange.',     price: 4000, currency: 'coins', themeId: 'oppenheimerLight', mode: 'light' },
      { id: 'hacker',            name: 'Hacker · Dark',       emoji: '💻', description: 'Matrix green on deep black. Time to code.',             price: 6000, currency: 'coins', themeId: 'hacker', mode: 'dark' },
      { id: 'hackerLight',       name: 'Hacker · Light',      emoji: '🖥️', description: 'IDE light mode — green on paper white.',                price: 6000, currency: 'coins', themeId: 'hackerLight', mode: 'light' },
      { id: 'lover',             name: 'Lover · Light',       emoji: '💕', description: 'Pastel pinks and soft blues. A dreamy aesthetic.',      price: 5000, currency: 'coins', themeId: 'lover', mode: 'light' },
      { id: 'loverDark',         name: 'Lover · Dark',        emoji: '💘', description: 'Twilight romance — sapphire & rose on indigo night.',   price: 5000, currency: 'coins', themeId: 'loverDark', mode: 'dark' },
      { id: 'neonPulseDark',     name: 'Neon Pulse · Dark',   emoji: '⚡', description: 'Blistering cyan and magenta on pure black.',            price: 6000, currency: 'coins', themeId: 'neonPulseDark', mode: 'dark' },
      { id: 'neonPulseLight',    name: 'Neon Pulse · Light',  emoji: '💡', description: 'Cyan & magenta on bright white. Now actually readable!',price: 6000, currency: 'coins', themeId: 'neonPulseLight', mode: 'light' },
      { id: 'venomDark',         name: 'Toxic Venom · Dark',  emoji: '🐍', description: 'High-saturation acid green and toxic purple in the void.', price: 6500, currency: 'coins', themeId: 'venomDark', mode: 'dark' },
      { id: 'venomLight',        name: 'Toxic Venom · Light', emoji: '🧪', description: 'Acid green and toxic purple on daylight.',              price: 6500, currency: 'coins', themeId: 'venomLight', mode: 'light' },
      // === New pairs ===
      { id: 'galaxyDark',        name: 'Galaxy · Dark',       emoji: '🌌', description: 'Cosmic indigo & nebula pink with twinkling stars.',     price: 5500, currency: 'coins', themeId: 'galaxyDark', mode: 'dark' },
      { id: 'galaxyLight',       name: 'Galaxy · Light',      emoji: '🪐', description: 'Soft astral lavender with glowing nebulas.',            price: 5500, currency: 'coins', themeId: 'galaxyLight', mode: 'light' },
      { id: 'forestDark',        name: 'Forest · Dark',       emoji: '🌲', description: 'Mossy emeralds, fireflies, and amber accents.',         price: 4500, currency: 'coins', themeId: 'forestDark', mode: 'dark' },
      { id: 'forestLight',       name: 'Forest · Light',      emoji: '🌳', description: 'Sun-dappled meadow greens & gold.',                     price: 4500, currency: 'coins', themeId: 'forestLight', mode: 'light' },
      { id: 'oceanDark',         name: 'Ocean · Dark',        emoji: '🌊', description: 'Abyssal blues with bioluminescent teal.',               price: 4500, currency: 'coins', themeId: 'oceanDark', mode: 'dark' },
      { id: 'oceanLight',        name: 'Ocean · Light',       emoji: '🐚', description: 'Coastal sky-blue & seafoam.',                           price: 4500, currency: 'coins', themeId: 'oceanLight', mode: 'light' },
      { id: 'sunsetDark',        name: 'Sunset · Dark',       emoji: '🌆', description: 'Burnt umber to magenta — golden hour after dusk.',     price: 4500, currency: 'coins', themeId: 'sunsetDark', mode: 'dark' },
      { id: 'sunsetLight',       name: 'Sunset · Light',      emoji: '🌅', description: 'Peach, coral, and a hot rose horizon.',                price: 4500, currency: 'coins', themeId: 'sunsetLight', mode: 'light' },
      { id: 'cyberpunkDark',     name: 'Cyberpunk · Dark',    emoji: '🤖', description: 'Hot pink & laser yellow on void violet.',               price: 7000, currency: 'coins', themeId: 'cyberpunkDark', mode: 'dark' },
      { id: 'cyberpunkLight',    name: 'Cyberpunk · Light',   emoji: '🎰', description: 'Sun-bleached arcade — yellow with hot magenta accents.',price: 7000, currency: 'coins', themeId: 'cyberpunkLight', mode: 'light' },
      // === Vibrant Collection (merged from main) ===
      { id: 'auroraDark',        name: 'Aurora · Dark',       emoji: '🌌', description: 'Electric violet & teal ribbons shimmering across a deep night sky.', price: 4500, currency: 'coins', themeId: 'aurora-dark', mode: 'dark' },
      { id: 'auroraLight',       name: 'Aurora · Light',      emoji: '🌠', description: 'Aurora reimagined at dawn — soft cloud-white with violet & teal highlights.', price: 4500, currency: 'coins', themeId: 'aurora-light', mode: 'light' },
      { id: 'vaporwaveDark',     name: 'Vaporwave · Dark',    emoji: '🌴', description: 'Hyper-saturated magenta & cyan glow over a midnight grid. Pure 80s energy.', price: 5500, currency: 'coins', themeId: 'vaporwave-dark', mode: 'dark' },
      { id: 'vaporwaveLight',    name: 'Vaporwave · Light',   emoji: '🏝️', description: 'Sun-bleached pastel vaporwave. Cotton-candy magenta & cyan on ivory.', price: 5500, currency: 'coins', themeId: 'vaporwave-light', mode: 'light' },
      { id: 'citrusDark',        name: 'Citrus · Dark',       emoji: '🍊', description: 'Electric lime & tangerine punch against a charcoal backdrop. Zero chill.', price: 4000, currency: 'coins', themeId: 'citrus-dark', mode: 'dark' },
      { id: 'citrusLight',       name: 'Citrus · Light',      emoji: '🍋', description: 'Sunlit lime & tangerine on crisp ivory. Wakes up your whole screen.', price: 4000, currency: 'coins', themeId: 'citrus-light', mode: 'light' },
    ]
  },
  status: {
    label: 'Status',
    emoji: '✨',
    items: [
      { id: 'holographicName', name: 'Holo Name',      emoji: '🌈', description: 'Your name shimmers with a holographic rainbow effect.', price: 3000, currency: 'coins', unique: true },
      { id: 'guitarSound',     name: 'Guitar Strum',   emoji: '🎸', description: 'A sweet guitar strum plays when you submit an answer.', price: 1500, currency: 'coins', soundId: 'guitar', unique: true },
      { id: 'cashSound',       name: 'Cash Register',  emoji: '💰', description: 'Ka-ching! A cash register sound on every correct answer.', price: 1500, currency: 'coins', soundId: 'cash', unique: true },
      { id: 'vipStatus',       name: 'VIP Badge',      emoji: '💎', description: 'A fancy diamond badge next to your name!',              price: 25,   currency: 'plectrums', unique: true },
      // === New 10 status items ===
      { id: 'rainbowAura',     name: 'Rainbow Aura',   emoji: '🌈', description: 'Animated rainbow ring around your avatar.',             price: 4000, currency: 'coins', unique: true, statusKey: 'rainbowAura' },
      { id: 'fireBadge',       name: 'Fire Badge',     emoji: '🔥', description: 'A blazing fire badge — for streak warriors.',           price: 2500, currency: 'coins', unique: true, statusKey: 'fireBadge' },
      { id: 'crownOfMath',     name: 'Crown of Math',  emoji: '👑', description: 'A regal crown floats above your name.',                 price: 5000, currency: 'coins', unique: true, statusKey: 'crownOfMath' },
      { id: 'starBurst',       name: 'Star Burst',     emoji: '🌟', description: 'Stars burst around your name in shop & profile.',       price: 3500, currency: 'coins', unique: true, statusKey: 'starBurst' },
      { id: 'lightningTrail',  name: 'Lightning Trail',emoji: '⚡', description: 'Lightning trails follow your taps in-game.',            price: 4500, currency: 'coins', unique: true, statusKey: 'lightningTrail' },
      { id: 'roboBadge',       name: 'Robo Badge',     emoji: '🤖', description: 'For the algorithmically gifted.',                       price: 2000, currency: 'coins', unique: true, statusKey: 'roboBadge' },
      { id: 'unicornDust',     name: 'Unicorn Dust',   emoji: '🦄', description: 'Pastel sparkle particles on every correct answer.',     price: 6000, currency: 'coins', unique: true, statusKey: 'unicornDust' },
      { id: 'galaxyName',      name: 'Galaxy Name',    emoji: '🌌', description: 'Your name has a swirling galaxy gradient.',             price: 5500, currency: 'coins', unique: true, statusKey: 'galaxyName' },
      { id: 'piPin',           name: 'π Pin',          emoji: '🥧', description: 'A tiny pi badge — for the truly nerdy.',                price: 1800, currency: 'coins', unique: true, statusKey: 'piPin' },
      { id: 'midnightHalo',    name: 'Midnight Halo',  emoji: '😇', description: 'A subtle halo above your avatar that glows at night.',  price: 3800, currency: 'coins', unique: true, statusKey: 'midnightHalo' },
    ]
  },
  exclusives: {
    label: 'Exclusives',
    emoji: '🎸',
    items: [
      { id: 'plectrumGod',  name: 'Plectrum God Title', emoji: '👑', description: 'The ultimate flex. Changes your title to "Plectrum God".', price: 100, currency: 'plectrums', unique: true },
      { id: 'goldenAura',   name: 'Golden Aura',        emoji: '✨', description: 'Surrounds your profile with a permanent golden glow.',     price: 50,  currency: 'plectrums', unique: true },
      // === New 10 plectrum items ===
      { id: 'mastermindTitle',name: 'Mastermind Title', emoji: '🧠', description: 'Override your status title with the legendary "Mastermind".', price: 75, currency: 'plectrums', unique: true, statusKey: 'mastermindTitle' },
      { id: 'cosmicTrail',   name: 'Cosmic Trail',      emoji: '☄️', description: 'Comet-trail particles on every correct answer.',         price: 60,  currency: 'plectrums', unique: true, statusKey: 'cosmicTrail' },
      { id: 'soundPackEpic', name: 'Epic Sound Pack',   emoji: '🎺', description: 'Cinematic orchestral hits on every level-up.',             price: 80,  currency: 'plectrums', unique: true, statusKey: 'soundPackEpic' },
      { id: 'soundPackLofi', name: 'Lo-fi Sound Pack',  emoji: '🎧', description: 'Chill lo-fi keypress and answer sounds.',                  price: 70,  currency: 'plectrums', unique: true, soundId: 'lofi' },
      { id: 'soundPack8bit', name: '8-bit Sound Pack',  emoji: '🕹️', description: 'Retro arcade chiptune sounds for every action.',          price: 70,  currency: 'plectrums', unique: true, soundId: '8bit' },
      { id: 'platinumFrame', name: 'Platinum Frame',    emoji: '⬜', description: 'A sleek platinum frame around your profile card.',         price: 90,  currency: 'plectrums', unique: true, statusKey: 'platinumFrame' },
      { id: 'diamondName',   name: 'Diamond Name',      emoji: '💎', description: 'Your player name in shimmering crystalline diamond.',     price: 120, currency: 'plectrums', unique: true, statusKey: 'diamondName' },
      { id: 'plectrum2x',    name: 'Plectrum Doubler',  emoji: '🎻', description: 'Permanently 2× plectrum drops in GOAT mode.',             price: 200, currency: 'plectrums', unique: true, statusKey: 'plectrum2xPerma' },
      { id: 'lifetimeCoffee',name: 'Lifetime Espresso', emoji: '☕', description: 'Permanent 1.25× coin earnings. No expiry.',                price: 250, currency: 'plectrums', unique: true, statusKey: 'lifetimeCoffee' },
      { id: 'rockstarTitle', name: 'Rockstar Title',    emoji: '🤘', description: 'Display "Rockstar" as your title.',                       price: 65,  currency: 'plectrums', unique: true, statusKey: 'rockstarTitle' },
      { id: 'godModeBadge',  name: 'God Mode Badge',    emoji: '🌠', description: 'A pulsing celestial badge — the rarest flex.',            price: 300, currency: 'plectrums', unique: true, statusKey: 'godModeBadge' },
    ]
  },
  // === NEW TAB 1: Avatars ===
  avatars: {
    label: 'Avatars',
    emoji: '🦸',
    items: [
      { id: 'avatarRobot',     name: 'Robo',         emoji: '🤖', description: 'A friendly mathbot avatar.',         price: 800,  currency: 'coins', unique: true, avatarKey: '🤖' },
      { id: 'avatarUnicorn',   name: 'Unicorn',      emoji: '🦄', description: 'Magical math unicorn.',              price: 1200, currency: 'coins', unique: true, avatarKey: '🦄' },
      { id: 'avatarDragon',    name: 'Dragon',       emoji: '🐉', description: 'Wise calculation dragon.',           price: 1500, currency: 'coins', unique: true, avatarKey: '🐉' },
      { id: 'avatarNinja',     name: 'Math Ninja',   emoji: '🥷', description: 'Stealthy. Speedy. Sums.',            price: 1300, currency: 'coins', unique: true, avatarKey: '🥷' },
      { id: 'avatarAlien',     name: 'Galactic Alien',emoji: '👽',description: 'Visiting from Planet Pi.',           price: 1400, currency: 'coins', unique: true, avatarKey: '👽' },
      { id: 'avatarKitty',     name: 'Cool Cat',     emoji: '😺', description: 'A cool calculating cat.',            price: 700,  currency: 'coins', unique: true, avatarKey: '😺' },
      { id: 'avatarPanda',     name: 'Panda',        emoji: '🐼', description: 'Bamboo and binary.',                 price: 900,  currency: 'coins', unique: true, avatarKey: '🐼' },
      { id: 'avatarFox',       name: 'Clever Fox',   emoji: '🦊', description: 'Sly and statistical.',               price: 1000, currency: 'coins', unique: true, avatarKey: '🦊' },
      { id: 'avatarOctopus',   name: 'Octo',         emoji: '🐙', description: 'Eight tentacles, eight times tables.',price: 1600,currency: 'coins', unique: true, avatarKey: '🐙' },
      { id: 'avatarWizard',    name: 'Math Wizard',  emoji: '🧙', description: 'Casting calculation spells.',         price: 2000, currency: 'coins', unique: true, avatarKey: '🧙' },
      { id: 'avatarAstronaut', name: 'Astronaut',    emoji: '👨‍🚀',description: 'Doing math at zero-G.',              price: 1800, currency: 'coins', unique: true, avatarKey: '👨‍🚀' },
      { id: 'avatarSuperhero', name: 'Superhero',    emoji: '🦸', description: 'Saving the world, one quiz at a time.',price: 2200,currency: 'coins', unique: true, avatarKey: '🦸' },
    ]
  },
  // === NEW TAB 2: Bundles (mixed-currency curated bundles) ===
  bundles: {
    label: 'Bundles',
    emoji: '🎁',
    items: [
      { id: 'bundleStarter',   name: 'Starter Pack',     emoji: '🎁', description: '3× Safety Pin, 3× Time Warp, 1× Coffee Boost.', price: 1500, currency: 'coins', bundle: { safetyPins: 3, timeWarps: 3, coffeeBoosts: 1 } },
      { id: 'bundleRescue',    name: 'Rescue Kit',       emoji: '🚑', description: '5× Safety Pin, 2× Great Escape, 1× Streak Freeze.', price: 3500, currency: 'coins', bundle: { safetyPins: 5, greatEscapes: 2, streakFreezes: 1 } },
      { id: 'bundleSpeedster', name: 'Speedster Bundle', emoji: '🏎️', description: '5× Time Warp, 3× Crystal Ball, 1× Energy Drink.', price: 2800, currency: 'coins', bundle: { timeWarps: 5, crystalBall: 3, energyDrink: 1 } },
      { id: 'bundleCoinflood', name: 'Coin Flood',       emoji: '💸', description: '2× Coffee Boost, 1× Weekend Warrior, 2× Rocket Fuel.', price: 5500, currency: 'coins', bundle: { coffeeBoosts: 2, weekendWarrior: 1, rocketFuel: 2 } },
      { id: 'bundleStreakSafe',name: 'Streak Vault',     emoji: '🔒', description: '3× Streak Freeze, 1× Mega Phone.', price: 4500, currency: 'coins', bundle: { streakFreezes: 3, megaPhone: 1 } },
      { id: 'bundleCheater',   name: 'Easy Mode Pack',   emoji: '🛟', description: '3× Auto-Solve, 5× 50/50, 3× Hint Master.', price: 5000, currency: 'coins', bundle: { autoSolve: 3, fiftyFifty: 5, hintMaster: 3 } },
      { id: 'bundleGoatMode',  name: 'GOAT Mode Pack',   emoji: '🐐', description: '2× Plectrum Power, 2× Turbo Timer, 3× Shield Wall.', price: 7500, currency: 'coins', bundle: { plectrumPower: 2, turboTimer: 2, shieldWall: 3 } },
      { id: 'bundleLuck',      name: 'Lucky Charm',      emoji: '🍀', description: '3× Lucky Clover, 3× Gold Rush, 2× Double or Nothing.', price: 4200, currency: 'coins', bundle: { luckyClover: 3, goldRush: 3, doubleOrNothing: 2 } },
      { id: 'bundleCombat',    name: 'Combat Kit',       emoji: '⚔️', description: '3× Shield Wall, 3× Rewind Time, 5× Mirror Mirror.', price: 6500, currency: 'coins', bundle: { shieldWall: 3, rewindTime: 3, mirrorMirror: 5 } },
      { id: 'bundleAllStar',   name: 'All-Star Bundle',  emoji: '⭐', description: 'One of every Power-up. Mass restock.', price: 9999, currency: 'coins', bundle: { safetyPins: 2, timeWarps: 2, greatEscapes: 1, autoSolve: 1, fiftyFifty: 2, crystalBall: 2, hintMaster: 2, shieldWall: 1, doubleOrNothing: 1, phoneAFriend: 1, rewindTime: 1, mirrorMirror: 1, luckyClover: 1, goldRush: 1 } },
      { id: 'bundleProMonth',  name: 'Pro Month',        emoji: '📆', description: '5× Coffee, 3× Weekend Warrior, 5× XP Extravaganza.', price: 12500, currency: 'coins', bundle: { coffeeBoosts: 5, weekendWarrior: 3, xpExtravaganza: 5 } },
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
  // Find the item to inspect its shape
  let foundItem = null;
  for (const cat of Object.values(SHOP_CATEGORIES)) {
    foundItem = cat.items.find(i => i.id === itemId);
    if (foundItem) break;
  }

  // Themes
  if (foundItem?.themeId) {
    if ((state.unlockedThemes || []).includes(foundItem.themeId)) {
      return state.currentTheme === foundItem.themeId ? 'equipped' : 'owned';
    }
    return 'available';
  }

  // Sounds (legacy: holographic uses both detection paths)
  if (foundItem?.soundId) {
    const sounds = state.unlockedSounds || [];
    if (sounds.includes(foundItem.soundId)) {
      return state.enterSound === foundItem.soundId ? 'equipped' : 'owned';
    }
    return 'available';
  }

  // Avatars
  if (foundItem?.avatarKey) {
    const owned = state.unlockedAvatars || [];
    if (owned.includes(foundItem.avatarKey)) {
      return state.currentAvatar === foundItem.avatarKey ? 'equipped' : 'owned';
    }
    return 'available';
  }

  // Bundles never "owned" — re-purchasable
  if (foundItem?.bundle) {
    return 'available';
  }

  // Status / Exclusives — driven by statusKey or specific legacy keys
  if (foundItem?.statusKey) {
    if (state[foundItem.statusKey]) {
      return state.activeStatusBadge === foundItem.statusKey ? 'equipped' : 'owned';
    }
    return 'available';
  }

  if (itemId === 'holographicName' && state.holographicName) return 'owned';
  if (itemId === 'vipStatus' && state.vipStatus) return 'owned';
  if (itemId === 'goldenAura' && state.goldenAura) return 'owned';
  if (itemId === 'plectrumGod' && state.plectrumGod) return 'owned';

  // Stackable powerups/boosts
  if (state.inventory && state.inventory[itemId] !== undefined && state.inventory[itemId] > 0) {
    return `owned:${state.inventory[itemId]}`;
  }

  return 'available';
}

export { SHOP_CATEGORIES, getShopItems, getShopCategories, getItemStatus };
