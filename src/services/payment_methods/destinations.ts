import type { PaymentMethod, PaymentMethodKind } from "./types";
import { PAYMENT_METHOD_KINDS } from "./types";

type MethodLike = Pick<PaymentMethod, "kind" | "value" | "is_primary">;

/**
 * What a patient is told to pay: the primary of each kind, InstaPay first.
 *
 * A clinic may keep several numbers, but a patient handed four of them pays to
 * whichever they read last. One per kind is enough to pay, and short enough to
 * survive a WhatsApp template parameter.
 *
 * Falls back to the first active method of a kind when none is marked primary,
 * so a half-configured clinic still bills rather than sending "transfer to:".
 */
export function primaryDestinations(methods: MethodLike[]): string[] {
  const out: string[] = [];
  for (const kind of PAYMENT_METHOD_KINDS) {
    const ofKind = methods.filter(
      (method) => method.kind === kind && method.value.trim(),
    );
    const chosen = ofKind.find((method) => method.is_primary) ?? ofKind[0];
    if (chosen) out.push(chosen.value.trim());
  }
  return out;
}

/** The one line that goes into the message and the template's {{3}}. */
export function destinationLine(methods: MethodLike[]): string {
  return primaryDestinations(methods).join(" — ");
}

/**
 * Every destination a receipt may legitimately name.
 *
 * Wider than the primaries on purpose: a patient who saved an older number and
 * paid to it has still paid the clinic, and bouncing that receipt into manual
 * review punishes them for the clinic's own bookkeeping.
 */
export function allDestinations(methods: MethodLike[]): string[] {
  return methods
    .map((method) => method.value.trim())
    .filter((value) => value.length > 0);
}

export function destinationsOfKind(
  methods: MethodLike[],
  kind: PaymentMethodKind,
): string[] {
  return methods
    .filter((method) => method.kind === kind)
    .map((method) => method.value.trim())
    .filter(Boolean);
}
