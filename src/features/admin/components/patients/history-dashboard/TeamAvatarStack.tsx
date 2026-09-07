"use client";

/**
 * DISABLED: assigned dental team stack — + button had no assign action.
 * Restore when team assignment CRUD exists.
 */
import Image from "next/image";
import { TEAM } from "./dashboard-data";

export function TeamAvatarStack() {
  return (
    <div className="flex items-center">
      {TEAM.map((member, index) => (
        <span
          key={member.name}
          title={member.name}
          className="relative inline-flex size-11 overflow-hidden rounded-full border-[3px] border-[#EBEAE5] bg-[#111111] text-[11px] font-semibold text-white"
          style={{ marginLeft: index === 0 ? 0 : -10, zIndex: TEAM.length - index }}
        >
          {"src" in member && member.src ? (
            <Image
              src={member.src}
              alt={member.name}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <span className="m-auto">{"initials" in member ? member.initials : ""}</span>
          )}
        </span>
      ))}
      {/* DISABLED no-op assign button */}
    </div>
  );
}
