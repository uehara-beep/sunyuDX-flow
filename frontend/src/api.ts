const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8001";

async function okOrThrow(r: Response) {
  if (!r.ok) throw new Error(await r.text());
  return r;
}

export async function jget<T>(path: string): Promise<T> {
  const r = await okOrThrow(await fetch(API_BASE + path));
  return r.json();
}

export async function jpost<T = any>(path: string, body?: any): Promise<T> {
  const r = await okOrThrow(await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  return r.json();
}

export async function jdel<T = any>(path: string): Promise<T> {
  const r = await okOrThrow(await fetch(API_BASE + path, { method: "DELETE" }));
  return r.json();
}
