# Event Co-pilot 🎪✨
### GenAI-Powered Celebration & Event Planner (Cultural Community Edition)
**Hack2Skills PromptWars Challenge 5**

---

## 🌟 Overview

**Event Co-pilot** is a celebration planning assistant designed for the "accidental planner" — society volunteers, family leads, or community members organizing festivals (Diwali, Navratri, Durga Puja), cultural nights, and neighborhood gatherings.

Unlike typical AI chatbots that offer generic paragraphs of advice, **Event Co-pilot** operates as a live, interactive planning system:
1. **Zero-Hallucination Math**: The LLM *never* computes numbers or dates. Pure deterministic TypeScript engines handle 100% of budget allocation, floor constraints, contingency reserves, and backward DAG scheduling.
2. **Instant Rebalancing with Reasons**: When guest counts spike (e.g. +50 guests) or dates compress, the scenario engine recalculates allocations in <50ms, respects user-locked categories, and supplies human explanations for every delta.
3. **End-to-End Actionability**: Generates tailored vendor enquiry letters with budget brackets, auto-schedules day-of run sheets, and provides rush-mode alternatives for compressed timelines.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- npm or pnpm

### 2. Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd promptwar5

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY (or leave blank to use automatic MockLLMProvider)
```

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm test
```

---

## ☁️ Vercel Deployment Guide (Hobby Tier — No Credit Card Needed)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Milestone 0: Project Scaffold and Vercel Skeleton"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin master
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"** → **"Import Git Repository"**.
3. Select your GitHub repository.
4. Under **"Environment Variables"**, add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API Key (e.g. from Google AI Studio)
   *(Note: If omitted, the application automatically uses the resilient `MockLLMProvider`, ensuring the live demo never fails!)*
5. Click **"Deploy"**. Your live link will be generated in under 60 seconds!

---

## 🏛️ Architecture Highlights

- **Frontend**: Next.js App Router, Tailwind CSS, Lucide icons, responsive design.
- **Backend**: Serverless Next.js API Routes (`/api/chat`, `/api/plan/generate`, `/api/plan/recompute`, `/api/vendor/message`).
- **Plan Engine (Deterministic)**: Pure functions for budget weights, floor costs, rush mode compression, category locks, and diff computation.
- **LLM Layer**: Google Gemini 2.0 Flash behind an `LLMProvider` interface with automatic mock fallback on rate limits or errors.
- **Storage**: Client-side `localStorage` via a `PlanRepository` interface — zero database configuration.

---

## 🎭 The Priya Demo Story

1. **Intake**: Priya is planning a society Diwali festival night for **200 guests** with a budget of **₹4,00,000** in **6 weeks**.
2. **Priorities**: Priya selects **Food & Prasad** and **Stage/Sound** as top priorities.
3. **Plan Generation**: Allocates 10% contingency (₹40,000), applies floors, boosts priority categories, and generates an 11-task backward schedule.
4. **The Twist (+50 Guests)**: Mid-way through, 50 more society members RSVP.
5. **Instant Rebalance**: Priya adjusts the slider in the **What-If Panel**. The engine scales `food_prasad` and per-head costs, preserves locked categories, warns of capacity, and displays exact delta reasons in seconds.

---

## 📜 License
MIT • Built with ❤️ for the Hack2Skills PromptWars Challenge 5.
