"use client";

import type { ChatSlashCommand } from "./slashCommands";

type Props = {
  commands: ChatSlashCommand[];
  onPick: (command: ChatSlashCommand) => void;
};

export function ChatSlashMenu({ commands, onPick }: Props) {
  if (commands.length === 0) return null;
  return (
    <div className="border-b border-[#E8EAED] bg-white px-3 py-2">
      <p className="mb-1.5 text-[10px] font-medium tracking-wide text-[#70758A] uppercase">
        Commands
      </p>
      <ul className="space-y-1">
        {commands.map((cmd) => (
          <li key={cmd.id}>
            <button
              type="button"
              onClick={() => onPick(cmd)}
              className="flex w-full items-baseline gap-2 rounded-xl px-2.5 py-2 text-start hover:bg-[#F3F4F6]"
            >
              <span className="text-[13px] font-semibold text-[#111111]">
                {cmd.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-[#70758A]">
                {cmd.hint}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
