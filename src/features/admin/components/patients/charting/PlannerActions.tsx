"use client";

type Props = {
  bookDisabled: boolean;
  onBook: () => void;
};

export function PlannerActions({ bookDisabled, onBook }: Props) {
  return (
    <button
      type="button"
      disabled={bookDisabled}
      onClick={onBook}
      className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
    >
      Book Appointment
    </button>
  );
}
