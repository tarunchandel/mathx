/**
 * MathX - Arthur Benjamin Tip Engine
 * Context-aware math tips based on operations performed
 */

const TIPS = {
  '+': [
    {
      title: 'Left-to-Right Addition',
      content: 'Add from left-to-right! Break numbers into place values and add them separately.',
      example: '48 + 37 → (40+30) + (8+7) = 70 + 15 = 85',
    },
    {
      title: 'Round & Adjust',
      content: 'Round one number up to make it easier, then adjust. It\'s faster than carrying!',
      example: '67 + 28 → 67 + 30 - 2 = 97 - 2 = 95',
    },
    {
      title: 'Complement Addition',
      content: 'When numbers are close to 100, add the complements and subtract from 200.',
      example: '97 + 96 → 200 - (3+4) = 200 - 7 = 193',
    },
  ],
  '-': [
    {
      title: 'Think of Distance!',
      content: 'Instead of subtracting, think "how far is B from A?" Count up from the smaller number.',
      example: '100 - 76 → 76→80 (+4) then 80→100 (+20) = 24',
    },
    {
      title: 'Round & Adjust',
      content: 'Round the number you\'re subtracting to make it clean, then adjust.',
      example: '83 - 29 → 83 - 30 + 1 = 53 + 1 = 54',
    },
    {
      title: 'Break It Down',
      content: 'Break subtraction into smaller, easier steps by splitting the subtrahend.',
      example: '152 - 37 → 152 - 30 - 7 = 122 - 7 = 115',
    },
  ],
  '×': [
    {
      title: 'Multiply by 5 Trick',
      content: 'To multiply by 5, multiply by 10 and divide by 2! Works every time.',
      example: '44 × 5 → 44 × 10 ÷ 2 = 440 ÷ 2 = 220',
    },
    {
      title: 'Multiply by 11',
      content: 'To multiply a 2-digit number by 11, split the digits and put their sum in the middle!',
      example: '25 × 11 → 2_(2+5)_5 = 275',
    },
    {
      title: 'Squaring Ending in 5',
      content: 'To square a number ending in 5: multiply the first digit(s) by (itself + 1), then append 25.',
      example: '35² → (3×4)25 = 1225',
    },
    {
      title: 'Break & Distribute',
      content: 'Break one number apart and multiply each part separately, then add.',
      example: '23 × 7 → (20×7) + (3×7) = 140 + 21 = 161',
    },
    {
      title: 'Multiply by 9 Trick',
      content: 'Multiply by 10 and subtract the original number!',
      example: '37 × 9 → 37 × 10 - 37 = 370 - 37 = 333',
    },
  ],
  '÷': [
    {
      title: 'Break It Down!',
      content: 'Divide in stages! Divide by small factors one at a time.',
      example: '144 ÷ 4 → 144 ÷ 2 = 72, then 72 ÷ 2 = 36',
    },
    {
      title: 'Use Multiplication',
      content: 'Think: "what times the divisor equals the dividend?" Turn division into multiplication.',
      example: '96 ÷ 8 → "8 × ? = 96" → 8 × 12 = 96, so answer is 12',
    },
    {
      title: 'Divide by 5 Trick',
      content: 'To divide by 5, multiply by 2 and move the decimal (or divide by 10).',
      example: '135 ÷ 5 → 135 × 2 = 270, then 270 ÷ 10 = 27',
    },
  ],
};

/**
 * Get a context-aware tip based on the operations performed in the set
 */
function getTip(operationsUsed) {
  // Pick the most interesting operation for the tip
  const priority = ['×', '÷', '-', '+'];
  let selectedOp = '+';
  
  for (const op of priority) {
    if (operationsUsed.includes(op)) {
      selectedOp = op;
      break;
    }
  }
  
  const tipList = TIPS[selectedOp] || TIPS['+'];
  return tipList[Math.floor(Math.random() * tipList.length)];
}

/**
 * Get tip specifically related to numbers used in a question
 */
function getSmartTip(questions) {
  const ops = questions.map(q => q.operator);
  const uniqueOps = [...new Set(ops)];
  
  // Check for special number patterns
  for (const q of questions) {
    if (q.operator === '×') {
      if (q.b === 5 || q.a === 5) {
        return TIPS['×'].find(t => t.title.includes('5'));
      }
      if (q.b === 11 || q.a === 11) {
        return TIPS['×'].find(t => t.title.includes('11'));
      }
      if (q.b === 9 || q.a === 9) {
        return TIPS['×'].find(t => t.title.includes('9'));
      }
      if (String(q.a).endsWith('5') && q.a === q.b) {
        return TIPS['×'].find(t => t.title.includes('Squaring'));
      }
    }
    if (q.operator === '÷') {
      if (q.b === 5) {
        return TIPS['÷'].find(t => t.title.includes('5'));
      }
    }
  }
  
  // Fallback to random tip based on operations used
  return getTip(uniqueOps);
}

export { getTip, getSmartTip, TIPS };
