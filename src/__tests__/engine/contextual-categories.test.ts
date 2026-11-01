import { describe, it, expect } from 'vitest';
import { allocateBudget } from '@/lib/engine/budget';
import { scheduleBackward } from '@/lib/engine/timeline';
import { generateVendorChecklist } from '@/lib/engine/vendor';
import { detectEventArchetype, getCategoryMetadata, getCandidatePlanStyles } from '@/lib/constants/cultural';
import { EventProfile } from '@/lib/types';

describe('Event Archetype & Contextual Category Engine', () => {
  it('correctly detects event archetypes from user inputs', () => {
    expect(detectEventArchetype({ eventName: 'Dandiya Night Celebration', eventSubType: 'festival' })).toBe('dandiya_garba');
    expect(detectEventArchetype({ eventName: 'Society Garba & Raas Night', eventSubType: 'festival' })).toBe('dandiya_garba');
    expect(detectEventArchetype({ eventName: 'Durga Puja Cultural Celebration', eventSubType: 'festival' })).toBe('pooja_religious');
    expect(detectEventArchetype({ eventName: 'Diwali Pooja & Bhog', eventSubType: 'festival' })).toBe('pooja_religious');
    expect(detectEventArchetype({ eventName: 'Annual Society Cultural Performance Night', eventSubType: 'cultural_night' })).toBe('cultural_night');
    expect(detectEventArchetype({ eventName: 'Neighborhood Republic Day Gathering', eventSubType: 'neighborhood' })).toBe('neighborhood_gathering');
  });

  it('customizes categories for Dandiya Night: NO prasad, shows Food & Refreshments', () => {
    const dandiyaProfile: EventProfile = {
      id: 'dandiya-test-1',
      eventType: 'community',
      eventSubType: 'festival',
      eventName: 'Gokuldham Society Dandiya & Garba Night',
      eventDate: '2026-11-11',
      totalBudget: { amount: 300000, currency: 'INR' },
      guestCount: 250,
      location: { city: 'Ahmedabad', tier: 'metro' },
      priorities: { top2: ['food_prasad', 'stage_sound'], notes: '' }
    };

    const plan = allocateBudget(dandiyaProfile);
    const foodCat = plan.categories.find(c => c.slug === 'food_prasad');
    expect(foodCat).toBeDefined();

    // Must be "Food & Refreshments", NEVER "Food & Prasad"
    expect(foodCat!.label).toBe('Food & Refreshments');
    expect(foodCat!.label.toLowerCase()).not.toContain('prasad');

    // Sub-items must not mention prasad
    foodCat!.subItems.forEach(item => {
      expect(item.label.toLowerCase()).not.toContain('prasad');
    });

    // Deliverables description must not mention prasad
    expect(foodCat!.deliverablesDescription?.toLowerCase()).not.toContain('prasad');

    // Community volunteer tasks must not mention prasad
    foodCat!.communityTasks?.forEach(task => {
      expect(task.toLowerCase()).not.toContain('prasad');
    });

    // Timeline tasks must not mention prasad
    const tasks = scheduleBackward(dandiyaProfile);
    const foodTask = tasks.tasks.find(t => t.category === 'food_prasad');
    expect(foodTask).toBeDefined();
    expect(foodTask!.title).toBe('Finalize Dinner Caterer & Food Stalls Menu');
    expect(foodTask!.title.toLowerCase()).not.toContain('prasad');

    // Vendor checklist must not mention "Prasad Cook"
    const vendors = generateVendorChecklist(dandiyaProfile, plan, tasks);
    const foodVendor = vendors.find(v => v.category === 'food_prasad');
    expect(foodVendor).toBeDefined();
    expect(foodVendor!.vendorType).toBe('Festive Caterer & Food Stalls Provider');
    expect(foodVendor!.vendorType.toLowerCase()).not.toContain('prasad');

    // Candidate styles must say "Food & Refreshments First"
    const styles = getCandidatePlanStyles('dandiya_garba');
    expect(styles.find(s => s.id === 'food_first')?.name).toBe('Food & Refreshments First');
    expect(styles.find(s => s.id === 'food_first')?.name.toLowerCase()).not.toContain('prasad');
  });

  it('preserves Prasad for religious pooja festivals', () => {
    const poojaProfile: EventProfile = {
      id: 'pooja-test-1',
      eventType: 'community',
      eventSubType: 'festival',
      eventName: 'Durga Puja & Maha Bhog Celebration',
      eventDate: '2026-10-20',
      totalBudget: { amount: 200000, currency: 'INR' },
      guestCount: 150,
      location: { city: 'Kolkata', tier: 'metro' },
      priorities: { top2: ['food_prasad', 'decor'], notes: '' }
    };

    const plan = allocateBudget(poojaProfile);
    const foodCat = plan.categories.find(c => c.slug === 'food_prasad');
    expect(foodCat).toBeDefined();
    expect(foodCat!.label).toContain('Prasad');

    const tasks = scheduleBackward(poojaProfile);
    const foodTask = tasks.tasks.find(t => t.category === 'food_prasad');
    expect(foodTask!.title).toContain('Prasad');

    const vendors = generateVendorChecklist(poojaProfile, plan, tasks);
    const foodVendor = vendors.find(v => v.category === 'food_prasad');
    expect(foodVendor!.vendorType).toContain('Prasad');
  });

  it('customizes categories for Cultural Performance Night: shows Dinner Buffet & Hospitality', () => {
    const culturalProfile: EventProfile = {
      id: 'cultural-test-1',
      eventType: 'community',
      eventSubType: 'cultural_night',
      eventName: 'Society Annual Cultural Performance Night',
      eventDate: '2026-12-05',
      totalBudget: { amount: 150000, currency: 'INR' },
      guestCount: 100,
      location: { city: 'Bengaluru', tier: 'metro' },
      priorities: { top2: ['food_prasad', 'stage_sound'], notes: '' }
    };

    const plan = allocateBudget(culturalProfile);
    const foodCat = plan.categories.find(c => c.slug === 'food_prasad');
    expect(foodCat).toBeDefined();
    expect(foodCat!.label).toBe('Dinner Buffet & Hospitality');
    expect(foodCat!.label.toLowerCase()).not.toContain('prasad');

    const tasks = scheduleBackward(culturalProfile);
    const foodTask = tasks.tasks.find(t => t.category === 'food_prasad');
    expect(foodTask!.title).toBe('Finalize Post-Show Dinner & Green Room Hospitality');
  });
});
