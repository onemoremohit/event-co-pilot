import { Task, TaskGraph, EventProfile, BudgetCategorySlug } from '../types';
import { CULTURAL_TASK_TEMPLATES, TaskTemplate } from '../constants/cultural';

export interface TimelineOptions {
  customTemplates?: TaskTemplate[];
}

/**
 * Helper to parse ISO date string (YYYY-MM-DD) to UTC Date at midnight
 */
function parseDate(isoString: string): Date {
  const parts = isoString.split('T')[0].split('-');
  return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
}

/**
 * Helper to format Date to YYYY-MM-DD
 */
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Difference in calendar days between two dates (b - a)
 */
function differenceInDays(b: Date, a: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  return Math.round((utcB - utcA) / msPerDay);
}

/**
 * Add days to a Date
 */
function addDays(d: Date, days: number): Date {
  const result = new Date(d.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Backward DAG scheduling algorithm.
 * Schedules all tasks backward from the event date, respects topological prerequisites,
 * detects critical path, and compresses timelines when rush mode is active.
 */
export function scheduleBackward(profile: EventProfile, options: TimelineOptions = {}): TaskGraph {
  const eventDate = parseDate(profile.eventDate);
  const startDate = parseDate(profile.planningStartDate || formatDate(new Date()));
  const daysAvailable = Math.max(0, differenceInDays(eventDate, startDate));

  const templates = options.customTemplates || CULTURAL_TASK_TEMPLATES;
  const maxLeadTime = Math.max(...templates.map(t => t.leadTimeDays), 30);
  const rushMode = daysAvailable < maxLeadTime;

  const warnings: string[] = [];
  if (rushMode) {
    warnings.push(
      `⚡ Rush Mode Active: Only ${daysAvailable} days available before event date (${maxLeadTime} days normally recommended). Tasks have been compressed with faster alternatives.`
    );
  }

  // Create initial task map
  const taskMap = new Map<string, Task>();
  const idMap = new Map<string, string>(); // title -> task ID

  templates.forEach((template, index) => {
    const id = `task-${profile.id.substring(0, 8)}-${index + 1}`;
    idMap.set(template.title, id);
  });

  // Calculate schedule backward from event date
  templates.forEach((template, index) => {
    const id = idMap.get(template.title)!;

    // Ideal start is (eventDate - leadTimeDays)
    let idealStart = addDays(eventDate, -template.leadTimeDays);
    let duration = template.durationDays;

    let isRush = false;
    let status: Task['status'] = 'pending';
    let rushAlternative: string | null = null;

    // Check if task start falls before planning start date (in the past)
    if (idealStart < startDate) {
      status = 'at_risk';
      isRush = true;
      rushAlternative = template.rushAlternative;

      if (rushMode) {
        // Compress duration by 50% (minimum 1 day) and start today
        duration = Math.max(1, Math.floor(template.durationDays * 0.5));
        idealStart = startDate;
      }
    }

    // Deadline is idealStart + duration
    let deadline = addDays(idealStart, duration);

    // Hard ceiling: deadline can never exceed the event date
    if (deadline > eventDate) {
      deadline = eventDate;
    }

    const task: Task = {
      id,
      eventId: profile.id,
      category: template.category,
      title: template.title,
      description: template.description,
      status,
      startDate: formatDate(idealStart),
      deadline: formatDate(deadline),
      leadTimeDays: template.leadTimeDays,
      durationDays: duration,
      dependsOn: template.dependsOn, // titles
      priority: template.priority,
      isRushFlagged: isRush,
      rushAlternative,
      assignee: template.defaultAssignee,
      why: template.dependsOn.length > 0
        ? `Depends on completing prerequisites (${template.dependsOn.length} upstream task${template.dependsOn.length > 1 ? 's' : ''}).`
        : `Primary preparation step requiring ${template.leadTimeDays} days lead time.`,
      createdAt: new Date().toISOString()
    };

    taskMap.set(template.title, task);
  });

  // Second pass: ensure dependent tasks strictly don't start before prerequisites complete
  templates.forEach(template => {
    const task = taskMap.get(template.title);
    if (!task || template.dependsOn.length === 0) return;

    let maxPrereqDeadline: Date | null = null;
    for (const prereqTitle of template.dependsOn) {
      const prereq = taskMap.get(prereqTitle);
      if (prereq) {
        const prereqDeadline = parseDate(prereq.deadline);
        if (!maxPrereqDeadline || prereqDeadline > maxPrereqDeadline) {
          maxPrereqDeadline = prereqDeadline;
        }
      }
    }

    if (maxPrereqDeadline) {
      const currentStart = parseDate(task.startDate);
      if (currentStart < maxPrereqDeadline) {
        // Shift start date to match prereq completion
        const shiftedStart = maxPrereqDeadline;
        const duration = task.durationDays;
        let shiftedDeadline = addDays(shiftedStart, duration);
        if (shiftedDeadline > eventDate) {
          shiftedDeadline = eventDate;
          task.isRushFlagged = true;
          task.status = 'at_risk';
        }
        task.startDate = formatDate(shiftedStart);
        task.deadline = formatDate(shiftedDeadline);
      }
    }
  });

  // Calculate Critical Path (longest chain of dependent tasks)
  const criticalPath = calculateCriticalPath(Array.from(taskMap.values()));

  const atRiskCount = Array.from(taskMap.values()).filter(t => t.isRushFlagged).length;
  if (atRiskCount > 0 && !rushMode) {
    warnings.push(`${atRiskCount} task${atRiskCount > 1 ? 's are' : ' is'} flagged at-risk due to compressed scheduling.`);
  }

  return {
    eventId: profile.id,
    tasks: Array.from(taskMap.values()),
    criticalPath,
    rushMode,
    rushThresholdDays: maxLeadTime,
    totalDaysAvailable: daysAvailable,
    warnings
  };
}

/**
 * Finds critical path through the scheduled task network
 */
function calculateCriticalPath(tasks: Task[]): string[] {
  // Map title to Task
  const titleToTask = new Map<string, Task>();
  tasks.forEach(t => titleToTask.set(t.title, t));

  // Find leaf tasks (tasks that nothing else depends on)
  const allPrereqs = new Set<string>();
  tasks.forEach(t => t.dependsOn.forEach(p => allPrereqs.add(p)));
  const leafTasks = tasks.filter(t => !allPrereqs.has(t.title));

  let longestChain: string[] = [];

  function dfs(currentTitle: string, currentChain: string[]) {
    const task = titleToTask.get(currentTitle);
    if (!task) return;

    const newChain = [task.id, ...currentChain];
    if (task.dependsOn.length === 0) {
      if (newChain.length > longestChain.length) {
        longestChain = newChain;
      }
      return;
    }

    for (const prereq of task.dependsOn) {
      dfs(prereq, newChain);
    }
  }

  leafTasks.forEach(leaf => {
    dfs(leaf.title, []);
  });

  return longestChain.length > 0 ? longestChain : tasks.slice(0, 3).map(t => t.id);
}

