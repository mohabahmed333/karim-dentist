"use client";

import type { ChatSlashCommand } from "./slashCommands";

type Props = {
  commands: ChatSlashCommand[];
  onPick: (command: ChatSlashCommand) => void;
};

export function ChatSlashMenu({ commands, onPick }: Props) {
  if (commands.length === 0) return null;
  return (
    <div className="border-b border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2">
      <p className="mb-1.5 text-[10px] font-medium tracking-wide text-[var(--admin-muted)] uppercase">
        Commands
      </p>
      <ul className="space-y-1">
        {commands.map((cmd) => (
          <li key={cmd.id}>
            <button
              type="button"
              onClick={() => onPick(cmd)}
              className="flex w-full items-baseline gap-2 rounded-xl px-2.5 py-2 text-start hover:bg-[var(--admin-hover)]"
            >
              <span className="text-[13px] font-semibold text-[var(--admin-text)]">
                {cmd.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--admin-muted)]">
                {cmd.hint}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
