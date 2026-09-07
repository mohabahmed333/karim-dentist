/** Format upcoming open + taken slots for clinic AI system prompts. */
export function formatClinicSlotAvailability(input: {
  openStartsAt: string[];
  takenStartsAt: string[];
}): string {
  const open =
    input.openStartsAt.length > 0
      ? `Open clinic appointment slots (ONLY suggest from these):\n${input.openStartsAt
          .map((iso, i) => `${i + 1}. ${iso}`)
          .join("\n")}`
      : "Open clinic appointment slots: (none — do not invent times; say schedule is full / needs regenerate)";
  const taken =
    input.takenStartsAt.length > 0
      ? `Taken (booked) slots — never suggest these:\n${input.takenStartsAt
          .map((iso, i) => `${i + 1}. ${iso}`)
          .join("\n")}`
      : "Taken (booked) slots: (none listed)";
  return `${open}\n\n${taken}`;
}
