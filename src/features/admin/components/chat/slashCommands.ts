import type { AnyMessageKey } from "@/lib/i18n";

export type ChatSlashCommand = {
  id: string;
  label: string;
  hint: string;
  insert: string;
};

type TFn = (key: AnyMessageKey) => string;

export function getClinicSlashCommands(t: TFn): ChatSlashCommand[] {
  return [
    {
      id: "website",
      label: "/website",
      hint: t("admin.chat.hint.website"),
      insert: "/website",
    },
    {
      id: "chart",
      label: "/chart",
      hint: t("admin.chat.hint.chart"),
      insert: "/chart",
    },
    {
      id: "clinical",
      label: "/clinical",
      hint: t("admin.chat.hint.clinical"),
      insert: "/clinical",
    },
    {
      id: "book",
      label: "/book",
      hint: t("admin.chat.hint.book"),
      insert: "/book",
    },
    {
      id: "today",
      label: "/today",
      hint: t("admin.chat.hint.today"),
      insert: "/today",
    },
    {
      id: "pending",
      label: "/pending",
      hint: t("admin.chat.hint.pending"),
      insert: "/pending",
    },
    {
      id: "noshow",
      label: "/noshow",
      hint: t("admin.chat.hint.noshow"),
      insert: "/noshow",
    },
    {
      id: "patient",
      label: "/patient",
      hint: t("admin.chat.hint.patient"),
      insert: "/patient",
    },
    {
      id: "note",
      label: "/note",
      hint: t("admin.chat.hint.note"),
      insert: "/note",
    },
    {
      id: "attention",
      label: "/attention",
      hint: t("admin.chat.hint.attention"),
      insert: "/attention",
    },
    {
      id: "help",
      label: "/help",
      hint: t("admin.chat.hint.help"),
      insert: "/help",
    },
  ];
}

export function matchSlashCommands(
  input: string,
  commands: ChatSlashCommand[],
): ChatSlashCommand[] {
  if (!input.startsWith("/")) return [];
  const q = input.slice(1).toLowerCase();
  if (input.includes(" ")) return [];
  return commands.filter(
    (cmd) => cmd.id.startsWith(q) || cmd.label.slice(1).startsWith(q),
  );
}

export function slashPrompt(command: ChatSlashCommand, t: TFn): string {
  if (command.id === "help") return t("admin.chat.helpBody");
  return command.hint;
}
