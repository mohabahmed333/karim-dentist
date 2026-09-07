import Link from "next/link";

type StatCard = {
  href: string;
  label: string;
  value: string;
};

type Props = {
  stats: StatCard[];
};

export function ContentStatsRow({ stats }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#e6e8ec] lg:col-span-2">
      <h2 className="mb-4 text-sm font-semibold text-[#0f2744]">Content</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="rounded-2xl bg-white px-4 py-3 transition hover:bg-white"
          >
            <p className="text-xs text-[#6b7280]">{stat.label}</p>
            <p className="truncate text-sm font-semibold text-[#0f2744]">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
