import { z } from 'zod';
import {
  BudgetCategorySlug,
  ChatMessage,
  EventProfile,
  EventSubType,
  ExperienceTier,
  PlanStyle,
  BudgetPlan
} from '../types';

// ============================================================================
// Zod Schemas for LLM Structured Outputs
// ============================================================================

export const ProfileUpdateSchema = z.object({
  eventName: z.string().optional(),
  eventSubType: z.enum(['festival', 'cultural_night', 'neighborhood']).optional(),
  eventDate: z.string().optional(),
  budgetAmount: z.number().positive().optional(),
  currency: z.string().default('INR').optional(),
  guestCount: z.number().positive().optional(),
  experienceTier: z.enum(['normal', 'premium']).optional(),
  priorities: z.array(z.string()).max(2).optional(),
  city: z.string().optional(),
  locationTier: z.enum(['metro', 'tier2', 'small_town', 'village']).optional(),
  specialRequirements: z.array(z.string()).optional()
});

export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;

export const CandidatePlanStyleSchema = z.object({
  id: z.enum(['food_first', 'look_first', 'balanced', 'diy_max']),
  name: z.string(),
  description: z.string(),
  priorityCategories: z.array(z.string())
});

export const IntakeResponseSchema = z.object({
  message: z.string().describe('Conversational response to the user'),
  profileUpdate: ProfileUpdateSchema.optional(),
  suggestedQuickReplies: z.array(z.string()).max(4).optional(),
  candidatePlans: z.array(CandidatePlanStyleSchema).optional(),
  isComplete: z.boolean().optional()
});

export type IntakeResponse = z.infer<typeof IntakeResponseSchema>;

export const ExplainItemSchema = z.object({
  targetId: z.string(),
  why: z.string().max(140)
});

export const ExplainResponseSchema = z.object({
  explanations: z.array(ExplainItemSchema)
});

export type ExplainResponse = z.infer<typeof ExplainResponseSchema>;

export const VendorMessageRequestSchema = z.object({
  vendorType: z.string(),
  category: z.string(),
  allocatedBudget: z.number(),
  profile: z.custom<EventProfile>()
});

export type VendorMessageRequest = z.infer<typeof VendorMessageRequestSchema>;

export const VendorMessageResponseSchema = z.object({
  vendorType: z.string(),
  subject: z.string(),
  message: z.string(),
  budgetRangeText: z.string(),
  checklistQuestions: z.array(z.string())
});

export type VendorMessageResponse = z.infer<typeof VendorMessageResponseSchema>;

// ============================================================================
// Context passed to Intake Agent
// ============================================================================

export interface IntakeContext {
  currentProfile: Partial<EventProfile>;
  completeness: number;
  perHeadBudget?: number;
  isFeasible?: boolean;
  warnings?: string[];
}

// ============================================================================
// LLM Provider Interface
// ============================================================================

export interface LLMProvider {
  name: string;
  chat(messages: ChatMessage[], context: IntakeContext): Promise<IntakeResponse>;
  generateExplanations(plan: BudgetPlan, profile: EventProfile): Promise<ExplainResponse>;
  generateVendorMessage(request: VendorMessageRequest): Promise<VendorMessageResponse>;
}
