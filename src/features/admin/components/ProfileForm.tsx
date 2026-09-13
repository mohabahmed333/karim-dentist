"use client";

import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { updateMyProfile } from "@/services/profiles/actions";
import { uploadPublicMedia } from "@/lib/supabase/upload";
import {
  IMAGE_FILE_ACCEPT,
  prepareMediaFile,
} from "@/lib/supabase/uploadHelpers";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminInput } from "@/features/admin/ui";
import { AdminUserAvatar } from "./AdminUserAvatar";

export type ProfileFormValues = {
  displayName: string | null;
  phone: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
};

type Props = {
  userId: string;
  email: string | null;
  roleName: string | null;
  memberSince: string | null;
  initial: ProfileFormValues;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProfileForm({
  userId,
  email,
  roleName,
  memberSince,
  initial,
}: Props) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const prepared = prepareMediaFile(file, "image");
      // Folder must be the uid: the storage policy only allows writes inside
      // a folder named after the signed-in user.
      const url = await uploadPublicMedia("avatars", prepared, userId);
      setAvatarUrl(url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : t("admin.profile.uploadError"),
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(event.currentTarget);
    const trimmed = (key: string) => {
      const value = String(data.get(key) ?? "").trim();
      return value ? value : null;
    };

    try {
      await updateMyProfile({
        display_name: trimmed("displayName"),
        phone: trimmed("phone"),
        job_title: trimmed("jobTitle"),
        avatar_url: avatarUrl,
      });
      toast.success(t("admin.profile.success"));
    } catch {
      setError(t("admin.profile.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="max-w-lg space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-4">
        <AdminUserAvatar
          name={displayName || null}
          email={email}
          avatarUrl={avatarUrl}
          size="xl"
        />
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_FILE_ACCEPT}
            className="hidden"
            onChange={(event) => void onPickFile(event.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload aria-hidden />
              {uploading
                ? t("admin.profile.uploading")
                : t("admin.profile.uploadPhoto")}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => setAvatarUrl(null)}
              >
                {t("admin.profile.removePhoto")}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            {t("admin.profile.photoHint")}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">{t("admin.profile.displayName")}</Label>
        <AdminInput
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={80}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">{t("admin.profile.jobTitle")}</Label>
          <AdminInput
            id="jobTitle"
            name="jobTitle"
            defaultValue={initial.jobTitle ?? ""}
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("admin.profile.phone")}</Label>
          <AdminInput
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initial.phone ?? ""}
            maxLength={40}
          />
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 border-t border-[var(--admin-border)] pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[var(--admin-muted)]">
            {t("admin.profile.email")}
          </dt>
          <dd className="truncate text-[var(--admin-text)]">{email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--admin-muted)]">
            {t("admin.profile.role")}
          </dt>
          <dd className="truncate text-[var(--admin-text)]">
            {roleName ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--admin-muted)]">
            {t("admin.profile.memberSince")}
          </dt>
          <dd className="truncate text-[var(--admin-text)]">
            {formatDate(memberSince)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-[var(--admin-muted)]">
        {t("admin.profile.readOnlyHint")}
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending || uploading}>
        {pending ? t("admin.loading") : t("admin.profile.save")}
      </Button>
    </form>
  );
}
