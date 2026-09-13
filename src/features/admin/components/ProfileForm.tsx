"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Upload, UserRound } from "lucide-react";
import { updateMyProfile } from "@/services/profiles/actions";
import { useAdminProfileStore } from "@/features/admin/stores/adminProfileStore";
import type { ServedPatient } from "@/services/profiles/servedPatients";
import { patientProfilePath } from "@/services/reservations/patientHistory";
import { uploadPublicMedia } from "@/lib/supabase/upload";
import {
  IMAGE_FILE_ACCEPT,
  prepareMediaFile,
} from "@/lib/supabase/uploadHelpers";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/features/admin/ui";
import { AdminUserAvatar } from "./AdminUserAvatar";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import {
  ProfileBadge,
  ProfileDetailCard,
  ProfileDetailRow,
} from "./profile/ProfileDetailCard";

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
  lastUpdated: string | null;
  isActive: boolean;
  patients: ServedPatient[];
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
  lastUpdated,
  isActive,
  patients,
  initial,
}: Props) {
  const t = useTranslations();
  const updateProfileStore = useAdminProfileStore((state) => state.update);
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState(initial);
  const [editing, setEditing] = useState(false);
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
      setValues((prev) => ({ ...prev, avatarUrl: url }));
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

    const next = {
      display_name: trimmed("displayName"),
      phone: trimmed("phone"),
      job_title: trimmed("jobTitle"),
      avatar_url: values.avatarUrl,
    };

    try {
      await updateMyProfile(next);
      setValues({
        displayName: next.display_name,
        phone: next.phone,
        jobTitle: next.job_title,
        avatarUrl: next.avatar_url,
      });
      setEditing(false);
      updateProfileStore({
        name: next.display_name,
        avatarUrl: next.avatar_url,
      });
      toast.success(t("admin.profile.success"));
    } catch {
      setError(t("admin.profile.error"));
    } finally {
      setPending(false);
    }
  }

  const displayName = values.displayName?.trim() || null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* The page's action, beside the title, as on every other admin page.
          Inside the form on purpose, so Save stays a plain submit button. */}
      <LocalizedAdminPageHeader
        titleKey="admin.pages.profile.title"
        descriptionKey="admin.pages.profile.description"
        actions={
          editing ? (
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={pending || uploading}>
                {pending ? t("admin.loading") : t("admin.profile.save")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setValues(initial);
                  setEditing(false);
                  setError(null);
                }}
              >
                {t("admin.profile.cancel")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil aria-hidden />
              {t("admin.profile.edit")}
            </Button>
          )
        }
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
        <div
          className="absolute inset-x-0 top-0 h-32"
          style={{
            backgroundImage:
              "linear-gradient(var(--admin-border) 1px, transparent 1px), linear-gradient(90deg, var(--admin-border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 0.35,
          }}
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-3 px-6 py-10">
          <AdminUserAvatar
            name={displayName}
            email={email}
            avatarUrl={values.avatarUrl}
            size="xl"
            className="ring-4 ring-[var(--admin-panel)]"
          />
          {editing ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_FILE_ACCEPT}
                className="hidden"
                onChange={(event) => void onPickFile(event.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center justify-center gap-2">
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
                {values.avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading}
                    onClick={() =>
                      setValues((prev) => ({ ...prev, avatarUrl: null }))
                    }
                  >
                    {t("admin.profile.removePhoto")}
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
                {displayName ?? email ?? "—"}
              </h1>
              <p className="text-[13px] text-[var(--admin-muted)]">{email}</p>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProfileDetailCard title={t("admin.profile.personalDetails")}>
          <ProfileDetailRow label={t("admin.profile.displayName")}>
            {editing ? (
              <AdminInput
                name="displayName"
                defaultValue={values.displayName ?? ""}
                maxLength={80}
                aria-label={t("admin.profile.displayName")}
              />
            ) : (
              (displayName ?? "—")
            )}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.jobTitle")}>
            {editing ? (
              <AdminInput
                name="jobTitle"
                defaultValue={values.jobTitle ?? ""}
                maxLength={80}
                aria-label={t("admin.profile.jobTitle")}
              />
            ) : (
              (values.jobTitle ?? "—")
            )}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.phone")}>
            {editing ? (
              <AdminInput
                name="phone"
                type="tel"
                defaultValue={values.phone ?? ""}
                maxLength={40}
                aria-label={t("admin.profile.phone")}
              />
            ) : (
              (values.phone ?? "—")
            )}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.email")}>
            {email ?? "—"}
          </ProfileDetailRow>
        </ProfileDetailCard>

        <ProfileDetailCard title={t("admin.profile.accountDetails")}>
          <ProfileDetailRow label={t("admin.profile.role")}>
            {roleName ? (
              <ProfileBadge tone="accent">{roleName}</ProfileBadge>
            ) : (
              "—"
            )}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.status")}>
            <ProfileBadge tone={isActive ? "positive" : "neutral"}>
              {isActive
                ? t("admin.profile.statusActive")
                : t("admin.profile.statusDeactivated")}
            </ProfileBadge>
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.memberSince")}>
            {formatDate(memberSince)}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.lastUpdated")}>
            {formatDate(lastUpdated)}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("admin.profile.password")}>
            <Link
              href="/admin/account/password"
              className="text-[var(--admin-primary,#5e6ad2)] hover:underline"
            >
              {t("admin.nav.changePassword")}
            </Link>
          </ProfileDetailRow>
        </ProfileDetailCard>

        <ProfileDetailCard
          title={t("admin.profile.patients")}
          action={<ProfileBadge>{String(patients.length)}</ProfileBadge>}
        >
          {patients.length === 0 ? (
            <p className="py-4 text-[13px] text-[var(--admin-muted)]">
              {t("admin.profile.patientsEmpty")}
            </p>
          ) : (
            patients.map((patient) => (
              <ProfileDetailRow
                key={patient.patientKey}
                label={patient.name ?? patient.patientKey}
              >
                <span className="flex items-center justify-end gap-2">
                  {patient.phone ? (
                    <span className="text-[var(--admin-muted)]">
                      {patient.phone}
                    </span>
                  ) : null}
                  <Link
                    href={patientProfilePath(patient.patientKey)}
                    className="text-[var(--admin-primary,#5e6ad2)] hover:underline"
                  >
                    <UserRound className="inline size-3.5" aria-hidden />
                    <span className="sr-only">
                      {patient.name ?? patient.patientKey}
                    </span>
                  </Link>
                </span>
              </ProfileDetailRow>
            ))
          )}
        </ProfileDetailCard>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
