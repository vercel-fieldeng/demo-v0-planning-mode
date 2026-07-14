/**
 * Prebuilt templates. Each maps to a *v0 template-system template*, which we
 * instantiate with v0.chats.init({ type: "template", templateId }) when a user
 * creates a project, then send their prompt into the new chat to customize it.
 *
 * >>> `templateId` is the id from a template's v0 URL: for
 *     v0.app/templates/image-transformer-template-fm90jwvZrDb the id is the
 *     trailing segment, `fm90jwvZrDb` (NOT a chat id — chats.init resolves it
 *     against the template system, and fork/getById would 404 on it). <<<
 * A template with an empty `templateId` falls back to a from-scratch
 * v0.chats.create.
 */
export interface Template {
  id: string;
  name: string;
  /** One-line description shown in the picker. */
  description: string;
  /** Emoji glyph used as a lightweight icon in the UI. */
  glyph: string;
  /** v0 template-system id to init from. Empty string = create from scratch. */
  templateId: string;
}

export const templates: Template[] = [
  {
    id: "blank",
    name: "Blank app",
    description: "Start from scratch — no template.",
    glyph: "◻",
    templateId: "", // intentionally blank: uses create instead of init
  },
  {
    id: "image-transformer",
    name: "Image Transformer",
    description: "An image transformer that applies style filters to uploaded images.",
    glyph: "🎨",

    // The templateId is the last segment of the v0 template-system URL, e.g.
    // https://v0.app/templates/image-transformer-template-fm90jwvZrDb
    templateId: "fm90jwvZrDb",
  },
];

export const DEFAULT_TEMPLATE_ID = "blank";

export function getTemplate(id: string | undefined): Template {
  return (
    templates.find((t) => t.id === id) ??
    templates.find((t) => t.id === DEFAULT_TEMPLATE_ID)!
  );
}
