import { describe, it, expect } from 'vitest';
import { scheduleBackward } from '../../lib/engine/timeline';
import { EventProfile } from '../../lib/types';

const normalProfile: EventProfile = {
  id: 'event-diwali',
  eventType: 'community',
  eventSubType: 'festival',
  eventName: 'Society Diwali Celebration',
  eventDate: '2026-12-15',
  planningStartDate: '2026-11-01', // 44 days lead time
  totalBudget: { amount: 400000, currency: 'INR' },
  guestCount: 200,
  guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
  experienceTier: 'normal',
  priorities: { top2: ['food_prasad', 'stage_sound'], notes: '' },
  location: { city: 'Bengaluru' },
  specialRequirements: [],
  profileCompleteness: 100,
  intakeStatus: 'complete',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z'
};

const tightProfile: EventProfile = {
  ...normalProfile,
  planningStartDate: '2026-11-25' // only 20 days lead time -> triggers rush mode!
};

describe('TimelineScheduler (Deterministic Backward DAG)', () => {
  it('schedules all tasks with deadlines strictly on or before event date', () => {
    const graph = scheduleBackward(normalProfile);
    expect(graph.tasks.length).toBeGreaterThan(5);

    graph.tasks.forEach(task => {
      expect(task.deadline <= normalProfile.eventDate).toBe(true);
      expect(task.startDate <= task.deadline).toBe(true);
    });
  });

  it('respects dependency ordering where dependent tasks do not finish before prerequisites', () => {
    const graph = scheduleBackward(normalProfile);
    const taskMap = new Map(graph.tasks.map(t => [t.title, t]));

    graph.tasks.forEach(task => {
      task.dependsOn.forEach(prereqTitle => {
        const prereq = taskMap.get(prereqTitle);
        if (prereq) {
          // Dependent task deadline must be on or after prereq deadline
          expect(task.deadline >= prereq.deadline).toBe(true);
        }
      });
    });
  });

  it('activates rush mode and flags compressed tasks when days available are tight', () => {
    const graph = scheduleBackward(tightProfile);
    expect(graph.rushMode).toBe(true);
    expect(graph.warnings.length).toBeGreaterThan(0);
    expect(graph.warnings[0]).toContain('Rush Mode Active');

    // At-risk tasks should have rush alternatives
    const atRisk = graph.tasks.filter(t => t.isRushFlagged);
    expect(atRisk.length).toBeGreaterThan(0);
    atRisk.forEach(t => {
      expect(t.rushAlternative).not.toBeNull();
      expect(typeof t.rushAlternative).toBe('string');
    });
  });

  it('determines a valid non-empty critical path of task IDs', () => {
    const graph = scheduleBackward(normalProfile);
    expect(graph.criticalPath.length).toBeGreaterThan(0);
    const validIds = new Set(graph.tasks.map(t => t.id));
    graph.criticalPath.forEach(id => {
      expect(validIds.has(id)).toBe(true);
    });
  });
});

