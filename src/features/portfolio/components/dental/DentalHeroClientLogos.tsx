import Image from "next/image";
import type { Tables } from "@/lib/supabase/database.types";

type Props = {
  clients: Tables<"clients">[];
  ariaLabel: string;
};

export function DentalHeroClientLogos({ clients, ariaLabel }: Props) {
  const logos = clients.filter((c) => c.logo_url).slice(0, 5);
  if (!logos.length) return null;

  return (
    <ul
      className="mt-auto hidden flex-wrap items-center gap-x-8 gap-y-4 pt-12 opacity-40 grayscale lg:flex"
      aria-label={ariaLabel}
    >
      {logos.map((client) => (
        <li key={client.id} className="flex h-8 items-center">
          {client.media_type === "video" ? (
            <video
              src={client.logo_url!}
              className="max-h-8 max-w-[7.5rem] object-contain"
              muted
              playsInline
              autoPlay
              loop
              aria-label={client.name}
            />
          ) : (
            <Image
              src={client.logo_url!}
              alt={client.name}
              width={120}
              height={32}
              className="max-h-8 w-auto object-contain"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
