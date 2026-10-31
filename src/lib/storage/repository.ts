import { EventPlan, EventProfile, BudgetPlan, TaskGraph, VendorChecklistItem, RunSheetEntry, Scenario, ChatMessage } from '../types';

export interface PlanRepository {
  getPlan(eventId?: string): Promise<EventPlan | null>;
  savePlan(plan: EventPlan): Promise<void>;
  updateProfile(profile: EventProfile): Promise<void>;
  updateBudget(eventId: string, budget: BudgetPlan): Promise<void>;
  updateTasks(eventId: string, tasks: TaskGraph): Promise<void>;
  updateVendors(eventId: string, vendors: VendorChecklistItem[]): Promise<void>;
  updateRunSheet(eventId: string, runSheet: RunSheetEntry[]): Promise<void>;
  addScenario(eventId: string, scenario: Scenario): Promise<void>;
  appendChatMessage(eventId: string, message: ChatMessage): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY_PREFIX = 'event_copilot_plan_v2';

export class LocalStoragePlanRepository implements PlanRepository {
  private getKey(eventId?: string): string {
    return eventId ? `${STORAGE_KEY_PREFIX}_${eventId}` : `${STORAGE_KEY_PREFIX}_active`;
  }

  async getPlan(eventId?: string): Promise<EventPlan | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.getKey(eventId));
      if (!raw) return null;
      return JSON.parse(raw) as EventPlan;
    } catch (err) {
      console.warn('LocalStoragePlanRepository.getPlan error:', err);
      return null;
    }
  }

  async savePlan(plan: EventPlan): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(plan);
      localStorage.setItem(this.getKey(plan.profile.id), serialized);
      // Also cache as active plan
      localStorage.setItem(this.getKey(), serialized);
    } catch (err) {
      console.error('LocalStoragePlanRepository.savePlan error:', err);
    }
  }

  async updateProfile(profile: EventProfile): Promise<void> {
    const existing = await this.getPlan(profile.id);
    if (existing) {
      existing.profile = profile;
      await this.savePlan(existing);
    }
  }

  async updateBudget(eventId: string, budget: BudgetPlan): Promise<void> {
    const existing = await this.getPlan(eventId);
    if (existing) {
      existing.budget = budget;
      await this.savePlan(existing);
    }
  }

  async updateTasks(eventId: string, tasks: TaskGraph): Promise<void> {
    const existing = await this.getPlan(eventId);
    if (existing) {
      existing.tasks = tasks;
      await this.savePlan(existing);
    }
  }

  async updateVendors(eventId: string, vendors: VendorChecklistItem[]): Promise<void> {
    const existing = await this.getPlan(eventId);
    if (existing) {
      existing.vendors = vendors;
      await this.savePlan(existing);
    }
  }

  async updateRunSheet(eventId: string, runSheet: RunSheetEntry[]): Promise<void> {
    const existing = await this.getPlan(eventId);
    if (existing) {
      existing.runSheet = runSheet;
      await this.savePlan(existing);
    }
  }

  async addScenario(eventId: string, scenario: Scenario): Promise<void> {
    const existing = await this.getPlan(eventId);
    if (existing) {
      existing.scenarios = [scenario, ...(existing.scenarios || [])];
      await this.savePlan(existing);
    }
  }

  async appendChatMessage(eventId: string, message: ChatMessage): Promise<void> {
    const existing = await this.getPlan(eventId);
    if (existing) {
      existing.chatHistory = [...(existing.chatHistory || []), message];
      await this.savePlan(existing);
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (err) {
      console.error('LocalStoragePlanRepository.clear error:', err);
    }
  }
}

// Global singleton instance for client-side usage
export const planRepository = new LocalStoragePlanRepository();
