const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001";

export async function jget<T>(path: string): Promise<T> {
  const r = await fetch(API_BASE + path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function jpost<T = any>(path: string, body?: any): Promise<T> {
  const r = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function jdel<T = any>(path: string): Promise<T> {
  const r = await fetch(API_BASE + path, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
