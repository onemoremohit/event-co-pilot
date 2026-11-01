import {
  LLMProvider,
  IntakeContext,
  IntakeResponse,
  ExplainResponse,
  VendorMessageRequest,
  VendorMessageResponse
} from './provider';
import { ChatMessage, EventProfile, BudgetPlan, BudgetCategorySlug } from '../types';
import { PLAN_STYLES, detectEventArchetype, getCandidatePlanStyles } from '../constants/cultural';
import { extractFieldsFromText } from './parser';
import { resolveLocationTier, LOCATION_TIERS } from '../engine/location';

export class MockLLMProvider implements LLMProvider {
  name = 'MockLLMProvider';

  async chat(messages: ChatMessage[], context: IntakeContext): Promise<IntakeResponse> {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    
    // 1. Run deterministic extraction on user's message
    const extracted = extractFieldsFromText(lastUserMessage);

    // 2. Merge extracted fields onto current context
    const current = context.currentProfile || {};

    // Location merging with clarification tracking
    let mergedLocation = current.location;
    if (extracted.city || extracted.locationTier) {
      const city = extracted.city || current.location?.city || '';
      const resolved = city ? resolveLocationTier(city) : null;
      const tier = extracted.locationTier || (resolved && !resolved.isUnknown ? resolved.tier : (current.location?.tier || 'tier2'));
      const isUnknown = extracted.locationTier ? false : (extracted.isLocationUnknown ?? (resolved ? resolved.isUnknown : false));
      const clarificationAsked = current.location?.clarificationAsked || Boolean(extracted.locationTier);

      mergedLocation = {
        city: city || (extracted.locationTier ? LOCATION_TIERS[extracted.locationTier].label : ''),
        tier,
        isUnknown,
        clarificationAsked
      };
    }

    const updated = {
      ...current,
      eventSubType: extracted.eventSubType ?? current.eventSubType,
      eventName: extracted.eventName ?? current.eventName,
      eventDate: extracted.eventDate ?? current.eventDate,
      totalBudget: extracted.budgetAmount
        ? { amount: extracted.budgetAmount, currency: 'INR' }
        : current.totalBudget,
      guestCount: extracted.guestCount ?? current.guestCount,
      experienceTier: extracted.experienceTier ?? current.experienceTier ?? 'normal',
      priorities: extracted.priorities && extracted.priorities.length > 0
        ? { top2: extracted.priorities as [BudgetCategorySlug, BudgetCategorySlug], notes: '' }
        : current.priorities,
      location: mergedLocation
    };

    // If user's message was an explicit single-field correction
    const isCorrection = (extracted.guestCount && current.guestCount && extracted.guestCount !== current.guestCount) ||
                         (extracted.budgetAmount && current.totalBudget?.amount && extracted.budgetAmount !== current.totalBudget.amount);

    // 2b. Evaluate input sanity with kindness and realism
    const { evaluateInputSanity } = await import('../engine/sanity');
    const sanity = evaluateInputSanity(
      updated.totalBudget?.amount,
      updated.guestCount,
      updated.eventDate,
      updated.eventSubType
    );

    if (sanity.isAbsurd) {
      return {
        message: sanity.humanMessage,
        profileUpdate: extracted,
        suggestedQuickReplies: [
          'Yes, this is a starting amount (donations coming)',
          'Enter different budget (e.g. ₹50,000)',
          sanity.nearestWorkableOption
            ? `Plan intimate tea for ~${sanity.nearestWorkableOption.maxFeasibleGuests} neighbors`
            : 'Start new plan'
        ]
      };
    }

    if (sanity.flags.includes('past_date') || sanity.flags.includes('zero_or_negative_guests') || sanity.flags.includes('zero_or_negative_budget')) {
      return {
        message: sanity.humanMessage,
        profileUpdate: extracted,
        suggestedQuickReplies: ['In 3 weeks', 'In 6 weeks', '50 guests', '100 guests']
      };
    }

    // 3. Check what required fields are still missing in priority order
    // Required: subType, budget, guests, date, location

    if (!updated.eventSubType) {
      return {
        message: 'Namaste! Welcome to Event Co-pilot. Which type of community celebration are we planning today?',
        profileUpdate: extracted,
        suggestedQuickReplies: [
          'Diwali / Festival Celebration',
          'Society Cultural Performance Night',
          'Neighborhood Community Gathering'
        ]
      };
    }

    if (!updated.totalBudget?.amount) {
      const ack = updated.eventName ? `Great, planning for a ${updated.eventName}. ` : '';
      return {
        message: `${ack}What is your total planned budget in INR? (e.g. ₹2.5 Lakhs, 4L, ₹50,000)`,
        profileUpdate: extracted,
        suggestedQuickReplies: ['₹1,50,000', '₹3,00,000', '₹4,00,000', '₹6,00,000']
      };
    }

    if (!updated.guestCount) {
      return {
        message: `Budget noted: ₹${updated.totalBudget.amount.toLocaleString('en-IN')}. How many guests and residents are you expecting?`,
        profileUpdate: extracted,
        suggestedQuickReplies: ['60 guests', '150 guests', '200 guests', '300 guests']
      };
    }

    if (!updated.eventDate) {
      const perHead = Math.round(updated.totalBudget.amount / updated.guestCount);
      const perHeadText = `With ₹${updated.totalBudget.amount.toLocaleString('en-IN')} for ${updated.guestCount} guests, your per-head capacity is ₹${perHead.toLocaleString('en-IN')}. `;
      return {
        message: `${perHeadText}When is the celebration taking place? You can specify a date (e.g. 15 December) or timeframe (e.g. in 6 weeks, in 3 weeks).`,
        profileUpdate: extracted,
        suggestedQuickReplies: ['In 3 weeks', 'In 6 weeks', 'December 15th', 'Next month weekend']
      };
    }

    if (!updated.location?.city) {
      return {
        message: 'Which city, town, or village is the event located in? (This helps us calibrate local vendor and rental cost benchmarks).',
        profileUpdate: extracted,
        suggestedQuickReplies: [
          'Delhi NCR / Bengaluru (Metro)',
          'Meerut / Jaipur (Large City)',
          'Smaller City or Town',
          'Village or Rural Area'
        ]
      };
    }

    // One-time fallback if typed location could not be matched in built-in directory
    const locRes = resolveLocationTier(updated.location.city);
    const isUnknownCity = updated.location.isUnknown ?? locRes.isUnknown;
    const clarificationAlreadyAsked = Boolean(current.location?.clarificationAsked);

    if (isUnknownCity && !clarificationAlreadyAsked) {
      return {
        message: `I noted ${updated.location.city}. How would you describe your location?`,
        profileUpdate: {
          ...extracted,
          city: updated.location.city,
          locationTier: 'tier2'
        },
        suggestedQuickReplies: [
          'Big metro, for example Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune',
          'Large city, for example Jaipur, Lucknow, Indore, Nagpur, Meerut',
          'Smaller city or town',
          'Village or rural area'
        ]
      };
    }

    // 4. All required fields are present! Offer Candidate Plan Styles matching event archetype
    const archetype = detectEventArchetype(updated);
    const perHead = Math.round(updated.totalBudget.amount / updated.guestCount);
    const candidateStyles = getCandidatePlanStyles(archetype).filter(s => !s.perHeadThreshold || perHead <= s.perHeadThreshold);

    if (!updated.priorities?.top2 || updated.priorities.top2.length === 0) {
      const locRes = resolveLocationTier(updated.location.city);
      let message = `All essential details gathered for ${updated.eventName} in ${updated.location.city} (${locRes.label})!\n\nPer-head budget is ₹${perHead.toLocaleString('en-IN')}. Select a planning style to prioritize your spend:`;

      if (isCorrection) {
        message = `Updated! Per-head budget is now ₹${perHead.toLocaleString('en-IN')}.\n\nSelect a planning style to complete your plan:`;
      }

      return {
        message,
        profileUpdate: extracted,
        candidatePlans: candidateStyles,
        suggestedQuickReplies: candidateStyles.map(s => s.name).slice(0, 3)
      };
    }

    // 5. Complete! Ready to generate plan
    return {
      message: `Your celebration specifications are complete for ${updated.eventName} in ${updated.location.city}! Click "Generate Live Event Plan" to build your auditable budget, backward schedule, and vendor checklist.`,
      profileUpdate: extracted,
      isComplete: true,
      suggestedQuickReplies: ['Generate Live Event Plan']
    };
  }

  async generateExplanations(plan: BudgetPlan, profile: EventProfile): Promise<ExplainResponse> {
    return {
      explanations: plan.categories.map(cat => ({
        targetId: cat.slug,
        why: cat.why
      }))
    };
  }

  async generateVendorMessage(request: VendorMessageRequest): Promise<VendorMessageResponse> {
    const { vendorType, allocatedBudget, profile } = request;
    const minBudget = Math.round(allocatedBudget * 0.85);
    const maxBudget = Math.round(allocatedBudget * 1.15);
    const budgetRangeText = `₹${minBudget.toLocaleString('en-IN')} – ₹${maxBudget.toLocaleString('en-IN')}`;

    return {
      vendorType,
      subject: `Enquiry: ${vendorType} for ${profile.eventName} (${profile.eventDate})`,
      message: `Dear ${vendorType} Team,\n\nOur society management committee is organizing "${profile.eventName}" on ${profile.eventDate} in ${profile.location.city || 'our campus'}. We are expecting approximately ${profile.guestCount} attendees.\n\nWe are looking to engage a reliable partner for ${vendorType}. Our allocated budget range for this scope is ${budgetRangeText}.\n\nPlease share your availability for ${profile.eventDate}, your service packages, and a formal quote. We would be glad to schedule a quick call to review technical specifications.\n\nWarm regards,\nEvent Planning Committee\n[Your Name / Contact Info]`,
      budgetRangeText,
      checklistQuestions: [
        `Are you available on ${profile.eventDate}?`,
        'Does your quote include on-site technicians and transit?',
        'What is your advance payment and cancellation policy?'
      ]
    };
  }
}
