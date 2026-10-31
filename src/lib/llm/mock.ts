import {
  LLMProvider,
  IntakeContext,
  IntakeResponse,
  ExplainResponse,
  VendorMessageRequest,
  VendorMessageResponse,
  ProfileUpdateData
} from './provider';
import { ChatMessage, EventProfile, BudgetPlan } from '../types';
import { PLAN_STYLES } from '../constants/cultural';

export class MockLLMProvider implements LLMProvider {
  name = 'MockLLMProvider';

  async chat(messages: ChatMessage[], context: IntakeContext): Promise<IntakeResponse> {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
    const profile = context.currentProfile;

    // 1. Initial Greeting / Subtype selection
    if (!profile.eventSubType && !profile.eventName) {
      if (lastUserMessage.includes('diwali') || lastUserMessage.includes('festival') || lastUserMessage.includes('navratri') || lastUserMessage.includes('puja')) {
        return {
          message: 'Splendid! Festival celebrations bring the entire community together. What is the target date for your festival event?',
          profileUpdate: {
            eventName: 'Community Festival Celebration',
            eventSubType: 'festival'
          },
          suggestedQuickReplies: ['6 weeks from now', 'Next month on weekend', 'December 15th']
        };
      }
      if (lastUserMessage.includes('night') || lastUserMessage.includes('dance') || lastUserMessage.includes('performance')) {
        return {
          message: 'A cultural performance night sounds wonderful! When are you planning to stage the event?',
          profileUpdate: {
            eventName: 'Society Cultural Night',
            eventSubType: 'cultural_night'
          },
          suggestedQuickReplies: ['In 6 weeks', 'Mid December', 'On Saturday evening']
        };
      }
      return {
        message: 'Namaste! I am your Event Co-pilot for community celebrations. What type of celebration are we organizing?',
        suggestedQuickReplies: [
          'Diwali / Festival Mela',
          'Society Cultural Night & Performances',
          'Neighborhood Community Gathering'
        ]
      };
    }

    // 2. Event Date
    if (!profile.eventDate) {
      const match = lastUserMessage.match(/(\d{4}-\d{2}-\d{2})|december\s*(\d{1,2})/i);
      const targetDate = '2026-12-15'; // Default fallback date

      return {
        message: 'Got it. Event date noted! Next, what is your total planned budget for the celebration in INR?',
        profileUpdate: {
          eventDate: targetDate
        },
        suggestedQuickReplies: ['₹2,50,000', '₹4,00,000', '₹6,00,000']
      };
    }

    // 3. Total Budget
    if (!profile.totalBudget?.amount) {
      let amount = 400000;
      if (lastUserMessage.includes('4') || lastUserMessage.includes('4l') || lastUserMessage.includes('400000') || lastUserMessage.includes('4 lakh')) {
        amount = 400000;
      } else if (lastUserMessage.includes('2') || lastUserMessage.includes('2.5') || lastUserMessage.includes('250000')) {
        amount = 250000;
      } else if (lastUserMessage.includes('6') || lastUserMessage.includes('600000')) {
        amount = 600000;
      }

      return {
        message: `Budget recorded: ₹${amount.toLocaleString('en-IN')}. How many guests and residents are you expecting?`,
        profileUpdate: {
          budgetAmount: amount,
          currency: 'INR'
        },
        suggestedQuickReplies: ['150 guests', '200 guests', '300 guests']
      };
    }

    // 4. Guest Count & Feasibility check + Candidate Plans
    if (!profile.guestCount) {
      let guests = 200;
      if (lastUserMessage.includes('200')) guests = 200;
      else if (lastUserMessage.includes('150')) guests = 150;
      else if (lastUserMessage.includes('300')) guests = 300;
      else if (lastUserMessage.includes('250')) guests = 250;

      const budget = profile.totalBudget.amount;
      const perHead = Math.round(budget / guests);

      // Candidate styles
      const candidates = PLAN_STYLES.filter(s => !s.perHeadThreshold || perHead <= s.perHeadThreshold);

      return {
        message: `With ₹${budget.toLocaleString('en-IN')} for ${guests} guests, you have approximately ₹${perHead.toLocaleString('en-IN')} per head. That is a viable, balanced budget!\n\nTo tailor your plan, which planning style best aligns with your committee's vision?`,
        profileUpdate: {
          guestCount: guests
        },
        candidatePlans: candidates,
        suggestedQuickReplies: [
          'Food & Prasad First',
          'Look & Spectacle First',
          'Balanced Community Harmony'
        ]
      };
    }

    // 5. Priorities & Tier
    if (!profile.priorities?.top2 || profile.priorities.top2.length === 0) {
      let top2: [string, string] = ['food_prasad', 'stage_sound'];
      if (lastUserMessage.includes('look') || lastUserMessage.includes('decor')) {
        top2 = ['decor', 'stage_sound'];
      } else if (lastUserMessage.includes('food') || lastUserMessage.includes('prasad')) {
        top2 = ['food_prasad', 'stage_sound'];
      }

      return {
        message: 'Priorities confirmed! Which city or society locality is the venue located in?',
        profileUpdate: {
          priorities: top2,
          experienceTier: 'normal'
        },
        suggestedQuickReplies: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune']
      };
    }

    // 6. Finalization
    return {
      message: 'All core event parameters gathered! Your deterministic budget, backward timeline, and vendor checklists have been generated.',
      profileUpdate: {
        city: 'Bengaluru'
      },
      isComplete: true,
      suggestedQuickReplies: ['View Event Dashboard', 'Open What-If Simulator']
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
