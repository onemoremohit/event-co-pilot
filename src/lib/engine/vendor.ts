import { VendorChecklistItem, EventProfile, BudgetPlan, TaskGraph } from '../types';
import {
  CULTURAL_VENDOR_TEMPLATES,
  VendorTemplate,
  detectEventArchetype,
  getCulturalVendorTemplates
} from '../constants/cultural';

export interface VendorOptions {
  customTemplates?: VendorTemplate[];
}

/**
 * Pure deterministic vendor checklist generator.
 * Maps cultural vendor templates to budget allocations and scheduled task deadlines.
 */
export function generateVendorChecklist(
  profile: EventProfile,
  budgetPlan: BudgetPlan,
  taskGraph: TaskGraph,
  options: VendorOptions = {}
): VendorChecklistItem[] {
  const archetype = detectEventArchetype(profile);
  const templates = options.customTemplates || getCulturalVendorTemplates(archetype);
  const categoryBudgetMap = new Map(budgetPlan.categories.map(c => [c.slug, c.allocatedAmount]));

  // Create a map from category to earliest task deadline for that category
  const categoryDeadlines = new Map<string, string>();
  taskGraph.tasks.forEach(task => {
    const existing = categoryDeadlines.get(task.category);
    if (!existing || task.deadline < existing) {
      categoryDeadlines.set(task.category, task.deadline);
    }
  });

  return templates.map((template, idx) => {
    const id = `vendor-${profile.id.substring(0, 8)}-${idx + 1}`;
    const categoryBudget = categoryBudgetMap.get(template.category) || 20000;

    // Estimate ~70% of category budget dedicated to primary vendor
    const estimatedBudget = Math.round(categoryBudget * 0.7);
    const deadline = categoryDeadlines.get(template.category) || profile.eventDate;

    return {
      id,
      eventId: profile.id,
      category: template.category,
      vendorType: template.vendorType,
      status: 'not_started',
      vendorName: null,
      estimatedBudget,
      quotedPrice: null,
      contactInfo: null,
      enquiryMessage: null,
      deadline,
      notes: template.description,
      why: `Essential cultural service for ${template.category.replace('_', ' ')} with required lead time of ${template.leadTimeDays} days.`
    };
  });
}

