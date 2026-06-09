import { differenceInHours, parseISO, isValid } from 'date-fns';

// ── Category weights ──────────────────────────────────
const CATEGORY_WEIGHT = {
  work: 4,
  business: 3,
  church: 2,
  personal: 1,
};

const URGENCY_WEIGHT = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

// ── Rules-based score ─────────────────────────────────
export function scoreTask(task) {
  let score = 0;

  // Urgency
  score += URGENCY_WEIGHT[task.urgency] ?? 4;

  // Category
  score += CATEGORY_WEIGHT[task.category] ?? 1;

  // Due-date proximity
  if (task.dueDate) {
    const due = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate.toDate?.() ?? new Date(task.dueDate);
    if (isValid(due)) {
      const hoursLeft = differenceInHours(due, new Date());
      if (hoursLeft < 0) score += 20; // overdue
      else if (hoursLeft < 2) score += 15;
      else if (hoursLeft < 8) score += 10;
      else if (hoursLeft < 24) score += 6;
      else if (hoursLeft < 72) score += 3;
    }
  }

  // Estimated duration (shorter = bump slightly for quick wins)
  if (task.estimatedMinutes) {
    if (task.estimatedMinutes <= 15) score += 2;
    else if (task.estimatedMinutes <= 30) score += 1;
  }

  return score;
}

export function rulesPrioritize(tasks) {
  return [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => scoreTask(b) - scoreTask(a));
}

// ── AI prioritization via Anthropic API ───────────────
export async function aiPrioritize(tasks, userContext = '') {
  const activeTasks = tasks.filter((t) => !t.completed);
  if (activeTasks.length === 0) return [];

  const taskSummary = activeTasks.map((t, i) => ({
    index: i,
    title: t.title,
    category: t.category,
    urgency: t.urgency,
    dueDate: t.dueDate || 'none',
    estimatedMinutes: t.estimatedMinutes || 'unknown',
    notes: t.notes || '',
  }));

  const prompt = `You are a productivity expert helping prioritize daily tasks.

User context: ${userContext || 'Busy professional managing multiple responsibilities'}

Here are the tasks to prioritize (JSON):
${JSON.stringify(taskSummary, null, 2)}

Return ONLY a JSON array of task indices in priority order (highest priority first), plus a one-sentence rationale for each.
Format:
[
  { "index": 2, "reason": "..." },
  { "index": 0, "reason": "..." },
  ...
]
Only return the JSON array, no other text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('AI prioritization failed');
  const data = await response.json();
  const text = data.content?.[0]?.text ?? '[]';
  const cleaned = text.replace(/```json|```/g, '').trim();
  const ranked = JSON.parse(cleaned);

  // Map back to task objects
  const result = ranked
    .map(({ index, reason }) => ({
      task: activeTasks[index],
      reason,
    }))
    .filter((r) => r.task != null)
    .map(({ task, reason }) => ({ ...task, aiReason: reason }));

  // Append any tasks that didn't get ranked
  const rankedIds = new Set(result.map((t) => t.id));
  const unranked = activeTasks.filter((t) => !rankedIds.has(t.id));
  return [...result, ...unranked];
}
