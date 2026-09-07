"use client";

type Props = {
  url: string;
  name?: string;
};

export function MessageVideo({ url, name }: Props) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg bg-black">
      <video
        controls
        preload="metadata"
        className="max-h-56 w-full"
        aria-label={name ?? "Video"}
      >
        <source src={url} />
      </video>
    </div>
  );
}
