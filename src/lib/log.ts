/**
 * Lightweight structured logging for server-side v0 Platform API calls.
 *
 * Everything prints to the process console, so it shows up in the terminal
 * running `next dev` (or the function logs in production). No dependencies,
 * always on — this is a demo and we want the full trail.
 *
 * The centerpiece is `v0Call`: wrap any v0 SDK call in it to get a
 * request/success/failure trail with timing, plus a parsed, operation-tagged
 * error (V0Error) that callers can surface to the client.
 */

type Level = "info" | "warn" | "error";

const LABEL: Record<Level, string> = {
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR",
};

/** Two-digit / three-digit zero pad for the timestamp. */
function stamp(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(
    d.getMilliseconds(),
    3,
  )}`;
}

/** Single-line, timestamped log with optional structured fields. */
export function log(level: Level, event: string, fields?: Record<string, unknown>) {
  const sink =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (fields && Object.keys(fields).length > 0) {
    sink(`${stamp()} ${LABEL[level]} ${event}`, fields);
  } else {
    sink(`${stamp()} ${LABEL[level]} ${event}`);
  }
}

/** Parsed shape of a v0 SDK error (internal to this module). */
interface ParsedV0Error {
  /** HTTP status, when the error came from an HTTP response. */
  status?: number;
  /** v0 error `type`, e.g. "internal_server_error". */
  type?: string;
  /** Human-readable message (v0's, or the raw error message as a fallback). */
  message: string;
  /** The raw response body / original message, for the logs. */
  raw: string;
}

/**
 * The v0 SDK throws `new Error("HTTP <status>: <body>")` on non-2xx responses
 * (see node_modules/v0-sdk/dist/index.js). Bodies typically look like
 * `{ success: false, error: { type, message } }`. Pull the useful parts out,
 * degrading gracefully for non-HTTP errors (timeouts, aborts, etc.).
 */
function parseV0Error(err: unknown): ParsedV0Error {
  const raw = err instanceof Error ? err.message : String(err);
  const httpMatch = /^HTTP (\d+): ([\s\S]*)$/.exec(raw);
  if (!httpMatch) {
    return { message: raw, raw };
  }

  const status = Number(httpMatch[1]);
  const bodyText = httpMatch[2];
  try {
    const body = JSON.parse(bodyText) as {
      error?: { type?: string; message?: string };
      message?: string;
    };
    const type = body.error?.type;
    const message = body.error?.message ?? body.message ?? `HTTP ${status}`;
    return { status, type, message, raw: bodyText };
  } catch {
    return { status, message: bodyText || `HTTP ${status}`, raw: bodyText };
  }
}

/**
 * Error thrown by `v0Call` on failure. Carries which operation failed and the
 * parsed HTTP details, and formats a message suitable for showing to the user.
 */
export class V0Error extends Error {
  readonly op: string;
  readonly status?: number;
  readonly type?: string;

  constructor(op: string, parsed: ParsedV0Error, cause: unknown) {
    const parts = [
      `HTTP ${parsed.status ?? "?"}`,
      parsed.type,
    ].filter(Boolean);
    super(`v0.${op} failed (${parts.join(" ")}): ${parsed.message}`, { cause });
    this.name = "V0Error";
    this.op = op;
    this.status = parsed.status;
    this.type = parsed.type;
  }
}

/**
 * Wrap a v0 SDK call for logging + error normalization.
 *
 * Logs `v0.<op> →` with the given `meta` before the call, `✓ { ms }` on
 * success, and `✗ { ms, status, type, message }` plus the raw body on failure —
 * then rethrows a {@link V0Error} that names the operation.
 *
 * `meta` should be pre-sanitized by the caller (truncate message text, log
 * prompt lengths not contents) so the trail stays readable.
 */
export async function v0Call<T>(
  op: string,
  meta: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  log("info", `v0.${op} →`, meta);
  try {
    const result = await fn();
    log("info", `v0.${op} ✓`, { ms: Date.now() - start });
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    const parsed = parseV0Error(err);
    log("error", `v0.${op} ✗`, {
      ms,
      status: parsed.status,
      type: parsed.type,
      message: parsed.message,
    });
    // Full body on its own line so it's easy to copy out of the terminal.
    log("error", `v0.${op} ✗ body`, { raw: parsed.raw });
    throw new V0Error(op, parsed, err);
  }
}

/** Truncate free text to a short preview for logging (internal). */
function preview(text: string | undefined, max = 120): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Verbose logging toggle. Off by default so end-user prompt content isn't logged. */
export function isDebug(): boolean {
  return process.env.V0_DEBUG === "1" || process.env.V0_DEBUG === "true";
}

/**
 * Preview of user-supplied content for logs — only reveals the text when
 * V0_DEBUG is enabled; otherwise returns a redaction marker so the log still
 * shows a message was present without leaking its content.
 */
export function debugPreview(text: string | undefined, max = 120): string {
  return isDebug() ? preview(text, max) : "«hidden — set V0_DEBUG=1»";
}
