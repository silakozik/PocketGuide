export type AdminCity = {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
  countryCode: string;
  status?: "active" | "passive";
  isActive?: boolean;
  lastSyncedAt?: string | null;
  createdAt?: string;
  poiCounts?: Record<string, number>;
};

export type AdminReport = {
  id: string;
  userId?: string;
  citySlug?: string;
  category?: string;
  status?: "open" | "in_progress" | "resolved";
  message?: string;
  createdAt?: string;
};

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`/api${path}`, API_BASE);
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message ?? `Request failed: ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function getCities() {
  return request<AdminCity[]>("/admin/cities");
}

export async function updateCityStatus(cityId: string, status: "active" | "passive") {
  return request<AdminCity>(`/admin/cities/${cityId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function syncCityData(input: { citySlug: string; cityName: string; countryCode: string }) {
  return request(`/admin/import-city`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getReports(filters: { q?: string; status?: string; city?: string } = {}) {
  return request<AdminReport[]>("/admin/reports", { query: filters });
}
