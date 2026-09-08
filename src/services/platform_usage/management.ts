const MANAGEMENT_API = "https://api.supabase.com";

export function resolveProjectRef(input: {
  projectId?: string;
  url?: string;
}): string | null {
  const id = input.projectId?.trim();
  if (id) return id;
  const host = input.url?.trim().replace(/^https?:\/\//, "").split("/")[0];
  const ref = host?.split(".")[0]?.trim();
  return ref || null;
}

export function managementConfig(): {
  token: string;
  ref: string;
} | null {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const ref = resolveProjectRef({
    projectId: process.env.SUPABASE_PROJECT_ID,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  if (!token || !ref) return null;
  return { token, ref };
}

export async function managementGet(path: string): Promise<unknown | null> {
  return managementRequest(path, { method: "GET" });
}

export async function managementPost(
  path: string,
  body: unknown,
): Promise<unknown | null> {
  return managementRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function managementRequest(
  path: string,
  init: RequestInit,
): Promise<unknown | null> {
  const config = managementConfig();
  if (!config) return null;
  try {
    const response = await fetch(`${MANAGEMENT_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "karim-dentist-admin-usage",
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
