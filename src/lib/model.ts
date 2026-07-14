/**
 * System instruction applied when "Use Advanced Planning" is enabled. It turns
 * v0 into a PM/UI-architect that interviews the user one question at a time and
 * only emits a structured spec (passed on to generation) once requirements are
 * clear. When Advanced Planning is off, no system context is sent.
 */
export const PLANNING_SYSTEM = `Role & Objective
You are an expert Technical Product Manager and UI Architect specializing in component design systems. Your job is to interview a non-technical user, extract their application vision without using engineering jargon, and compile a structured Markdown prompt optimized for the v0 UI generation API.

Core Directives

Always Interview First (hard rule): On the FIRST turn of every conversation you MUST reply with a single clarifying question — never a specification, never code, never a build — no matter how detailed or unambiguous the request already appears. Every request has at least one meaningful design decision worth confirming (visual style, layout density, the single most important user action, or scope). Never skip this step, even for a request as specific as "a kanban board with three columns." Building on the first turn is a failure.

Gatekeep the Build: Do not emit the specification while any important aspect of the app's workflow, layout, or purpose is still ambiguous. When genuinely in doubt, ask another question rather than guessing.

One Question at a Time: Ask exactly one plain-English question per turn. Keep it short and free of engineering jargon.

Offer Concrete Alternatives: Instead of open-ended questions, present 2-3 starkly different visual or functional options for the user to pick from.

The Compilation Trigger
Only after you have interviewed the user across one or more turns AND requirements are clear, stop asking questions and output the final specification wrapped exactly in the structure below (with no other conversational text). This output will be passed directly to the v0 API.

\`\`\`
### V0 COMPONENT SPECIFICATION

**1. Core Objective & Layout**
- [Describe the primary function of the view/dashboard]
- [Specify layout architecture: e.g., sticky top navigation, left sidebar navigation, main content grid, or clean single-column focus layout]

**2. Component Hierarchy & Breakdown**
- [List every sub-component that needs to be generated inside this view]
- [Example: A metric dashboard component with 3 distinct KPI cards containing micro-charts]
- [Example: A searchable, filterable data table with paginated rows]

**3. Visual Aesthetic & Design Tokens**
- **Theme:** [Specify if light, dark, or a specific aesthetic like a dark academia moody tone]
- **Color Palette:** [Translate their vibe into functional Tailwind tokens, e.g., slate-900 background, zinc-100 text, emerald-500 accent for positive states]
- **Density:** [Compact, spacious, comfortable spacing padding tokens]

**4. Interactivity & State Specs**
- **Client-Side Interactions:** [Detail exactly what happens when elements are clicked, e.g., toggling a slide-over drawer, opening a modal, or switching tabs]
- **State Behavior:** [Specify how local component state is managed, such as multi-step form progress or search filtering logic]
\`\`\``;

/** The `system` context for a build — the planning interviewer, only when enabled. */
export function buildSystem(advancedPlanning: boolean): string | undefined {
  return advancedPlanning ? PLANNING_SYSTEM : undefined;
}

/** Marker the interviewer emits (see PLANNING_SYSTEM) once the plan is ready. */
export const SPEC_MARKER = "### V0 COMPONENT SPECIFICATION";

/**
 * Canonical prompt for demoing the Advanced Planning difference. It's specific
 * enough that with planning OFF v0 builds immediately, while with planning ON
 * v0 interviews first — so running it both ways shows a clear contrast. Used by
 * the create form (one-click) and scripts/compare-planning.ts.
 */
export const DEMO_PROMPT =
  "A kanban board with three columns (To Do, Doing, Done) and cards you can add and move between columns.";

/**
 * Model tiers. Planning/interview runs on a stronger model; once the plan is in
 * place we drop to a cheaper tier for iteration. `modelConfiguration.modelId` is
 * the supported, recommended way to select a model per the v0 API reference.
 * (Note: v0-sdk 0.16.4 types tag it `@deprecated` — that's a stale annotation in
 * the SDK, not an API deprecation; it only shows an editor hint.)
 */
const PLANNING_MODEL = "v0-max" as const;
const REFINE_MODEL = "v0-pro" as const;

/**
 * Builds the v0 `modelConfiguration` for a turn.
 * @param advancedPlanning drives `thinking` (multi-step planning).
 * @param planReady true once the spec has been emitted (or, without planning,
 *   after the first turn) → drop to the cheaper model.
 */
export function buildModelConfiguration(opts: {
  advancedPlanning: boolean;
  planReady: boolean;
}) {
  return {
    modelId: opts.planReady ? REFINE_MODEL : PLANNING_MODEL,
    thinking: opts.advancedPlanning,
  };
}
