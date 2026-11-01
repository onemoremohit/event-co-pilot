'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, EventProfile, PlanStyle, BudgetCategorySlug } from '@/lib/types';
import { Send, Sparkles, Check, Play, User, Bot, RefreshCw } from 'lucide-react';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { resolveLocationTier } from '@/lib/engine/location';

interface IntakeChatProps {
  currentProfile: Partial<EventProfile>;
  onProfileUpdate: (update: Partial<EventProfile>) => void;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  onStartDemo: () => void;
  isDemoRunning: boolean;
}

export function IntakeChat({
  currentProfile,
  onProfileUpdate,
  onGeneratePlan,
  isGenerating,
  onStartDemo,
  isDemoRunning
}: IntakeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      eventId: 'initial',
      role: 'assistant',
      content: 'Namaste! Welcome to Event Co-pilot. I am your planning companion for society festivals, cultural nights, and community celebrations.\n\nWhich type of celebration are we organizing?',
      timestamp: '2026-11-01T00:00:00Z'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    'Diwali / Festival Celebration',
    'Society Cultural Night & Stage Performances',
    'Neighborhood Community Gathering'
  ]);
  const [candidatePlans, setCandidatePlans] = useState<PlanStyle[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevSubTypeRef = useRef<string | undefined>(currentProfile.eventSubType);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, candidatePlans]);

  // Synchronize Assistant question when event archetype is selected or deselected from headline banner
  useEffect(() => {
    if (prevSubTypeRef.current !== currentProfile.eventSubType) {
      const current = currentProfile.eventSubType;
      prevSubTypeRef.current = current;

      if (!current) {
        // Deselected from headline banner: return assistant back to the first question
        const firstMsg: ChatMessage = {
          id: `bot-first-${Date.now()}`,
          eventId: currentProfile.id || 'new',
          role: 'assistant',
          content: 'Namaste! Welcome to Event Co-pilot. I am your planning companion for society festivals, cultural nights, and community celebrations.\n\nWhich type of celebration are we organizing?',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => {
          if (prev.length <= 1) {
            return [firstMsg];
          }
          if (prev[prev.length - 1].role === 'assistant') {
            return [...prev.slice(0, -1), firstMsg];
          }
          return [...prev, firstMsg];
        });

        setQuickReplies([
          'Diwali / Festival Celebration',
          'Society Cultural Night & Stage Performances',
          'Neighborhood Community Gathering'
        ]);
      } else {
        // Selected from headline banner: shift to the next question (budget)
        const subTypeLabels: Record<string, string> = {
          festival: 'Festival Celebration',
          cultural_night: 'Cultural Night & Stage Show',
          neighborhood: 'Neighborhood Community Gathering'
        };
        const label = subTypeLabels[current] || current.replace('_', ' ');

        let nextMsg = '';
        let nextReplies: string[] = [];

        if (!currentProfile.totalBudget?.amount) {
          nextMsg = `Wonderful! We are planning a ${label}. What is your estimated or available budget for this celebration? (e.g. ₹50,000, ₹1.5L, ₹4 Lakhs)`;
          nextReplies = ['₹50,000', '₹1,50,000', '₹3,00,000', '₹5,00,000'];
        } else if (!currentProfile.guestCount) {
          nextMsg = `Great, a ${label} with ₹${currentProfile.totalBudget.amount.toLocaleString('en-IN')} budget! How many attendees or families are you expecting?`;
          nextReplies = ['50 guests', '100 guests', '200 guests', '350 guests'];
        } else if (!currentProfile.eventDate) {
          nextMsg = `When is the ${label} taking place, or how many weeks do we have to prepare?`;
          nextReplies = ['In 2 weeks', 'In 4 weeks', 'In 6 weeks', 'In 8 weeks'];
        } else if (!currentProfile.location?.city) {
          nextMsg = `Which city or town is hosting this ${label}?`;
          nextReplies = ['Bengaluru', 'Delhi NCR', 'Meerut', 'Mumbai', 'Village / Rural'];
        } else {
          nextMsg = `Selected celebration archetype: ${label}. What details would you like to adjust?`;
          nextReplies = [];
        }

        const shiftMsg: ChatMessage = {
          id: `bot-shift-${Date.now()}`,
          eventId: currentProfile.id || 'new',
          role: 'assistant',
          content: nextMsg,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => {
          if (prev.length <= 1) {
            return [shiftMsg];
          }
          if (prev[prev.length - 1].role === 'assistant') {
            return [...prev.slice(0, -1), shiftMsg];
          }
          return [...prev, shiftMsg];
        });

        setQuickReplies(nextReplies);
      }
    }
  }, [
    currentProfile.eventSubType,
    currentProfile.totalBudget?.amount,
    currentProfile.guestCount,
    currentProfile.eventDate,
    currentProfile.location?.city,
    currentProfile.id
  ]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      eventId: currentProfile.id || 'new',
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setQuickReplies([]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          context: {
            currentProfile,
            completeness: 50
          }
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;

        // Apply profile updates
        if (data.profileUpdate) {
          const update: Partial<EventProfile> = {};
          if (data.profileUpdate.eventName) update.eventName = data.profileUpdate.eventName;
          if (data.profileUpdate.eventSubType) update.eventSubType = data.profileUpdate.eventSubType;
          if (data.profileUpdate.eventDate) update.eventDate = data.profileUpdate.eventDate;
          if (data.profileUpdate.budgetAmount) {
            update.totalBudget = { amount: data.profileUpdate.budgetAmount, currency: 'INR' };
          }
          if (data.profileUpdate.guestCount) update.guestCount = data.profileUpdate.guestCount;
          if (data.profileUpdate.experienceTier) update.experienceTier = data.profileUpdate.experienceTier;
          if (data.profileUpdate.priorities) {
            update.priorities = {
              top2: data.profileUpdate.priorities as [BudgetCategorySlug, BudgetCategorySlug],
              notes: ''
            };
          }
          if (data.profileUpdate.city || data.profileUpdate.locationTier) {
            const effectiveCity = data.profileUpdate.city || currentProfile?.location?.city || '';
            const locRes = resolveLocationTier(effectiveCity);
            const effectiveTier = data.profileUpdate.locationTier || locRes.tier;
            update.location = {
              city: effectiveCity,
              tier: effectiveTier,
              clarificationAsked: currentProfile?.location?.clarificationAsked || Boolean(data.profileUpdate.locationTier),
              isUnknown: data.profileUpdate.locationTier ? false : locRes.isUnknown
            };
          }
          if (data.suggestedQuickReplies?.some((r: string) => r.includes('Big metro'))) {
            update.location = {
              ...(update.location || currentProfile?.location || { city: '', tier: 'tier2' }),
              clarificationAsked: true
            };
          }
          onProfileUpdate(update);
        }

        if (data.candidatePlans && data.candidatePlans.length > 0) {
          setCandidatePlans(data.candidatePlans);
        } else {
          setCandidatePlans([]);
        }

        if (data.suggestedQuickReplies) {
          setQuickReplies(data.suggestedQuickReplies);
        }

        const extractedParts: string[] = [];
        if (data.profileUpdate?.eventSubType) extractedParts.push(`Type: ${data.profileUpdate.eventSubType.replace('_', ' ')}`);
        if (data.profileUpdate?.budgetAmount) extractedParts.push(`₹${data.profileUpdate.budgetAmount.toLocaleString('en-IN')}`);
        if (data.profileUpdate?.guestCount) extractedParts.push(`${data.profileUpdate.guestCount} guests`);
        if (data.profileUpdate?.city) extractedParts.push(data.profileUpdate.city);
        if (data.profileUpdate?.eventDate) extractedParts.push(data.profileUpdate.eventDate);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          eventId: currentProfile.id || 'new',
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          meta: {
            provider: json.provider || 'GeminiProvider',
            extractedSummary: extractedParts.length > 0 ? extractedParts.join(' • ') : null
          }
        };
        setMessages(prev => [...prev, botMsg]);

        // Only trigger plan generation if all essential fields are present
        const merged = { ...currentProfile, ...(data.profileUpdate || {}) };
        const hasAllRequired = Boolean(
          (merged.eventSubType || currentProfile.eventSubType) &&
          (data.profileUpdate?.budgetAmount || currentProfile.totalBudget?.amount) &&
          (merged.guestCount || currentProfile.guestCount) &&
          (merged.eventDate || currentProfile.eventDate) &&
          (data.profileUpdate?.city || currentProfile.location?.city)
        );

        if (data.isComplete && hasAllRequired) {
          onGeneratePlan();
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectPlanStyle = (style: PlanStyle) => {
    onProfileUpdate({
      priorities: {
        top2: style.priorityCategories.slice(0, 2) as [BudgetCategorySlug, BudgetCategorySlug],
        notes: `Selected style: ${style.name}`
      }
    });
    handleSendMessage(`I choose "${style.name}"!`);
    setCandidatePlans([]);
  };

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 py-3.5 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm tracking-tight">Cultural Community Intake Assistant</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ready to assist" />
            </div>
            <p className="text-[11px] text-amber-100">Live planning for society festivals, stage nights & gatherings</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartDemo}
          disabled={isDemoRunning || isGenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-amber-900 text-xs font-bold hover:bg-amber-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isDemoRunning ? (
            <>
              <div className="w-3 h-3 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
              <span>Running Demo...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-amber-600" />
              <span>Play Priya&apos;s Demo</span>
            </>
          )}
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-800 border border-amber-200 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              <div>{msg.content}</div>

              {/* GenAI Metadata & Dynamic Entity Extraction Badge */}
              {msg.role === 'assistant' && msg.meta && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700/90">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                    <span>{msg.meta.provider === 'GeminiProvider' ? 'Google Gemini 2.5 Flash' : 'Hybrid AI Reasoning'}</span>
                  </span>
                  {msg.meta.extractedSummary && (
                    <span className="font-mono text-slate-600 bg-amber-50/80 text-[9px] px-1.5 py-0.5 rounded border border-amber-200/70">
                      ⚡ {msg.meta.extractedSummary}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Candidate Plan Cards if offered */}
        {candidatePlans.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Choose Candidate Plan Style:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {candidatePlans.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleSelectPlanStyle(style)}
                  className="text-left bg-white p-3.5 rounded-xl border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all shadow-sm hover:shadow group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-700">
                      {style.name}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                      Select
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">{style.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <Bot className="w-3 h-3 text-amber-600 animate-pulse" />
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Replies */}
      {quickReplies.length > 0 && !isTyping && (
        <div className="px-4 py-2 bg-amber-50/50 border-t border-amber-100 flex flex-wrap gap-1.5">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={e => {
                e.preventDefault();
                handleSendMessage(reply);
              }}
              className="text-xs font-medium bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-full transition-colors shadow-2xs active:scale-95"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your event specs, budget, or guest count..."
            className="flex-1 bg-slate-100 text-slate-900 text-xs sm:text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
