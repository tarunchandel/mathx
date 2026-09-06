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

/**
 * Generate a dynamic step-by-step mental math solution for any question
 */
function generateStepByStepMentalSolution(q) {
  const { a, b, operator: op, answer } = q;
  const numA = Number(a);
  const numB = Number(b);

  if (op === '+') {
    // If one number ends close to 10
    const remB = numB % 10;
    if (remB >= 7 && numB > 10) {
      const up = 10 - remB;
      const friendly = numB + up;
      return {
        strategy: 'Round & Adjust (Friendly Tens)',
        steps: [
          `Round ${numB} up to ${friendly} (add ${up})`,
          `${numA} + ${friendly} = ${numA + friendly}`,
          `Subtract the extra ${up}: ${numA + friendly} - ${up} = ${answer}`,
        ],
        tip: 'Rounding to a friendly ten avoids complicated mental carrying.'
      };
    }

    // Left to right place value breakdown
    if (numA >= 10 || numB >= 10) {
      const tensA = Math.floor(numA / 10) * 10;
      const onesA = numA - tensA;
      const tensB = Math.floor(numB / 10) * 10;
      const onesB = numB - tensB;

      if (tensA > 0 && tensB > 0) {
        return {
          strategy: 'Left-to-Right Place Value',
          steps: [
            `Add the tens: ${tensA} + ${tensB} = ${tensA + tensB}`,
            `Add the units: ${onesA} + ${onesB} = ${onesA + onesB}`,
            `Combine both parts: ${tensA + tensB} + ${onesA + onesB} = ${answer}`,
          ],
          tip: 'Mental math is faster when processing highest place values first.'
        };
      }
    }

    return {
      strategy: 'Direct Combination',
      steps: [`Combine ${numA} and ${numB} to get ${answer}`],
      tip: 'Practice instant number-bond recall for small sums.'
    };
  }

  if (op === '-') {
    const remB = numB % 10;
    // Compensation
    if (remB >= 7 && numB >= 10) {
      const bump = 10 - remB;
      const friendlyB = numB + bump;
      return {
        strategy: 'Equal Difference Shift',
        steps: [
          `Shift both numbers up by ${bump} so we subtract a clean ten:`,
          `(${numA} + ${bump}) - (${numB} + ${bump}) = ${numA + bump} - ${friendlyB}`,
          `${numA + bump} - ${friendlyB} = ${answer}`,
        ],
        tip: 'Subtracting round numbers like 20, 30, or 50 is effortless in your head.'
      };
    }

    // Distance method
    if (numA > numB && numB >= 10) {
      const nextTen = Math.ceil(numB / 10) * 10;
      const step1 = nextTen - numB;
      const step2 = numA - nextTen;
      return {
        strategy: 'Count-Up Distance Method',
        steps: [
          `Count up from ${numB} to next milestone ${nextTen}: +${step1}`,
          `Count from ${nextTen} to target ${numA}: +${step2}`,
          `Total distance: ${step1} + ${step2} = ${answer}`,
        ],
        tip: 'Counting forward treats subtraction as a forward road trip.'
      };
    }

    return {
      strategy: 'Direct Distance',
      steps: [`Distance from ${numB} to ${numA} is ${answer}`],
      tip: 'Visualize the number line gap between the two values.'
    };
  }

  if (op === '×') {
    // Multiply by 5
    if (numB === 5 || numA === 5) {
      const other = numB === 5 ? numA : numB;
      return {
        strategy: 'Multiply by 10 then Halve',
        steps: [
          `${other} × 10 = ${other * 10}`,
          `Divide by 2: ${other * 10} ÷ 2 = ${answer}`,
        ],
        tip: '5 is just 10 ÷ 2. Adding a zero and taking half is lightning fast.'
      };
    }

    // Multiply by 9
    if (numB === 9 || numA === 9) {
      const other = numB === 9 ? numA : numB;
      return {
        strategy: 'Multiply by 10 and Subtract',
        steps: [
          `${other} × 10 = ${other * 10}`,
          `Subtract ${other}: ${other * 10} - ${other} = ${answer}`,
        ],
        tip: '9 groups of a number is 10 groups minus 1 group.'
      };
    }

    // Multiply by 11
    if (numB === 11 || numA === 11) {
      const other = numB === 11 ? numA : numB;
      if (other < 100) {
        const d1 = Math.floor(other / 10);
        const d2 = other % 10;
        const sum = d1 + d2;
        if (sum >= 10) {
          return {
            strategy: 'Vedic 11 Sandwich Shortcut (with Carry)',
            steps: [
              `Sum of digits: ${d1} + ${d2} = ${sum}`,
              `Place ${sum % 10} in middle, carry 1 to ${d1}: (${d1} + 1)${sum % 10}${d2} = ${answer}`,
            ],
            tip: 'If the sum is 10 or more, carry the 1 over to the hundreds digit!'
          };
        }
        return {
          strategy: 'Vedic 11 Sandwich Shortcut',
          steps: [
            `Sum of digits: ${d1} + ${d2} = ${sum}`,
            `Sandwich the sum between the digits: ${d1}${sum}${d2} = ${answer}`,
          ],
          tip: 'When multiplying a 2-digit number by 11, place their sum in the center!'
        };
      }
    }

    // Distributive
    if (numA >= 10 || numB >= 10) {
      const factor = numA >= 10 ? numA : numB;
      const mult = numA >= 10 ? numB : numA;
      const tens = Math.floor(factor / 10) * 10;
      const ones = factor - tens;
      return {
        strategy: 'Distributive Chunking',
        steps: [
          `Multiply tens: ${tens} × ${mult} = ${tens * mult}`,
          `Multiply ones: ${ones} × ${mult} = ${ones * mult}`,
          `Add products: ${tens * mult} + ${ones * mult} = ${answer}`,
        ],
        tip: 'Break hard numbers into easy chunks, then combine.'
      };
    }

    return {
      strategy: 'Times Table Recall',
      steps: [`Recall times tables: ${numA} × ${numB} = ${answer}`],
      tip: 'Consistent practice solidifies automatic mental times-table retrieval.'
    };
  }

  if (op === '÷') {
    // Divide by 5
    if (numB === 5) {
      return {
        strategy: 'Double and Divide by 10',
        steps: [
          `Double the number: ${numA} × 2 = ${numA * 2}`,
          `Divide by 10 (shift decimal left): ${numA * 2} ÷ 10 = ${answer}`,
        ],
        tip: 'Dividing by 5 is the mirror shortcut of multiplying by 5.'
      };
    }

    // Factors of 4 or 8
    if (numB === 4) {
      return {
        strategy: 'Double Halving',
        steps: [
          `First halve: ${numA} ÷ 2 = ${numA / 2}`,
          `Halve again: ${numA / 2} ÷ 2 = ${answer}`,
        ],
        tip: 'Dividing by 4 is always two consecutive halves.'
      };
    }

    return {
      strategy: 'Inverse Multiplication',
      steps: [
        `Think: "${numB} × ? = ${numA}"`,
        `Since ${numB} × ${answer} = ${numA}, the answer is ${answer}`,
      ],
      tip: 'Turn division into finding the missing partner in multiplication.'
    };
  }

  return {
    strategy: 'Calculation',
    steps: [`${q.display} = ${answer}`],
    tip: 'Keep numbers modular and friendly.'
  };
}

export { getTip, getSmartTip, generateStepByStepMentalSolution, TIPS };

