import Link from "next/link";
import { buttonClasses } from "./ui";

export function CreateProjectButton({
  size = "md",
  label = "New project",
}: {
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <Link href="/new" className={buttonClasses("primary", size)}>
      <span aria-hidden>+</span>
      {label}
    </Link>
  );
}
