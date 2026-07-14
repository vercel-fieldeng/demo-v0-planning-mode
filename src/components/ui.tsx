import * as React from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background-100 disabled:opacity-50 disabled:pointer-events-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-gray-1000 text-background-100 hover:bg-gray-900",
  secondary:
    "bg-background-100 text-gray-1000 border border-gray-400 hover:bg-gray-100",
  ghost: "bg-transparent text-gray-900 hover:bg-gray-100 hover:text-gray-1000",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
};

/** Shared button styling — reuse on <button> and on <Link> that should look like a button. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={buttonClasses(variant, size, className)}
        {...props}
      />
    );
  },
);

/* ---------------------------------- Spinner -------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ----------------------------------- Badge --------------------------------- */

type BadgeTone = "neutral" | "success" | "warning" | "error" | "info";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-900 border-gray-400",
  success: "bg-green-100 text-green-700 border-green-700/30",
  warning: "bg-amber-100 text-amber-700 border-amber-700/30",
  error: "bg-red-100 text-red-700 border-red-700/30",
  info: "bg-blue-100 text-blue-700 border-blue-700/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Textarea ------------------------------- */

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-md border border-gray-400 bg-background-100 px-3 py-2 text-sm text-gray-1000",
        "placeholder:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
        className,
      )}
      {...props}
    />
  );
});

/* ----------------------------------- Input --------------------------------- */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-gray-400 bg-background-100 px-3 text-sm text-gray-1000",
        "placeholder:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
        className,
      )}
      {...props}
    />
  );
});

/* ---------------------------------- Checkbox ------------------------------- */

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "h-4 w-4 rounded border transition-colors",
            checked
              ? "border-blue-700 bg-blue-700"
              : "border-gray-500 bg-background-100",
          )}
        />
        {checked && (
          <svg
            className="absolute h-3 w-3 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-gray-1000">{label}</span>
        {description && (
          <span className="text-[13px] text-gray-700">{description}</span>
        )}
      </span>
    </label>
  );
}
