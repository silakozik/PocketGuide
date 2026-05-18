import type {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserDTO,
} from "@pocketguide/types";

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
  } catch {
    /* ignore */
  }
  return res.status === 401
    ? "E-posta veya şifre hatalı"
    : "İstek başarısız oldu";
}

export async function fetchCurrentUser(): Promise<UserDTO | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as AuthResponseDTO;
  return data.user;
}

export async function login(body: LoginRequestDTO): Promise<UserDTO> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as AuthResponseDTO;
  return data.user;
}

export async function register(body: RegisterRequestDTO): Promise<UserDTO> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as AuthResponseDTO;
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
