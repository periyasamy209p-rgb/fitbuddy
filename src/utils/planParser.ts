import { DayWorkout } from '../types';

export function parseWorkoutPlan(rawText: string): DayWorkout[] {
  if (!rawText) return [];

  const days: DayWorkout[] = [];
  // Split by Day patterns e.g. "### Day 1:", "Day 1:", "## Day 1", "**Day 1"
  const dayRegex = /(?:###?\s*|\*\*|^)Day\s*(\d+)[:\s\-–—]+([^\n\r]+)/gim;

  const matches: Array<{ dayNumber: number; title: string; index: number }> = [];
  let match;
  while ((match = dayRegex.exec(rawText)) !== null) {
    matches.push({
      dayNumber: parseInt(match[1], 10),
      title: match[2].replace(/\*\*/g, '').trim(),
      index: match.index,
    });
  }

  if (matches.length === 0) {
    // Fallback: create 7 generic days if pattern didn't match cleanly
    return [
      {
        dayNumber: 1,
        dayTitle: 'Full Plan Routine',
        focus: 'Comprehensive 7-Day Protocol',
        warmup: '5–10 mins dynamic mobility and joint activation',
        exercises: [
          { name: 'See raw view for full breakdown', setsAndReps: 'Full Schedule' }
        ],
        cooldown: '5–10 mins static stretching and hydration',
        notes: rawText,
      }
    ];
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index : rawText.length;
    const dayChunk = rawText.substring(startIndex, endIndex);

    // Extract Warm-up
    let warmup = '5–10 mins dynamic stretching, arm circles, hip openers';
    const warmupMatch = dayChunk.match(/Warm-up[^\n\r:]*[:\-–]\s*([^\n\r]+(?:\n(?!\s*[\*\-]\s*(?:Main|Cooldown))[^\n\r]+)*)/i);
    if (warmupMatch) {
      warmup = warmupMatch[1].replace(/[\*\#]/g, '').trim();
    }

    // Extract Cooldown
    let cooldown = '5–8 mins static stretching & hydration';
    const cooldownMatch = dayChunk.match(/Cooldown[^\n\r:]*[:\-–]\s*([^\n\r]+(?:\n(?!\s*[\*\-]\s*(?:Day|Important))[^\n\r]+)*)/i);
    if (cooldownMatch) {
      cooldown = cooldownMatch[1].replace(/[\*\#]/g, '').trim();
    }

    // Extract Exercises
    const exercises: Array<{ name: string; setsAndReps: string; details?: string }> = [];
    const exerciseLines = dayChunk.split('\n');
    for (const line of exerciseLines) {
      const trimmed = line.trim();
      // Match bullet points like "* Incline Dumbbell Bench Press: 4 sets of 8-10 reps" or "- Squats: 3x10"
      if ((trimmed.startsWith('*') || trimmed.startsWith('-')) && !trimmed.toLowerCase().includes('warm-up') && !trimmed.toLowerCase().includes('cooldown') && !trimmed.toLowerCase().includes('main workout')) {
        const cleaned = trimmed.replace(/^[\*\-\s]+/, '').replace(/\*\*/g, '');
        if (cleaned.includes(':')) {
          const parts = cleaned.split(':');
          exercises.push({
            name: parts[0].trim(),
            setsAndReps: parts.slice(1).join(':').trim(),
          });
        } else if (cleaned.length > 5) {
          exercises.push({
            name: cleaned,
            setsAndReps: '3 sets / targeted volume',
          });
        }
      }
    }

    days.push({
      dayNumber: current.dayNumber || i + 1,
      dayTitle: `Day ${current.dayNumber || i + 1}`,
      focus: current.title,
      warmup,
      exercises: exercises.length > 0 ? exercises : [
        { name: current.title, setsAndReps: 'See detailed protocol in plan notes' }
      ],
      cooldown,
    });
  }

  return days;
}
