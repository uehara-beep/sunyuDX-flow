const API_BASE = import.meta.env.VITE_API_BASE;

async function ok(r: Response) {
  if (!r.ok) throw new Error(await r.text());
  return r;
}

export async function jget<T>(p: string): Promise<T> {
  const r = await ok(await fetch(API_BASE + p));
  return r.json();
}

export async function jpost<T>(p: string, b?: any): Promise<T> {
  const r = await ok(await fetch(API_BASE + p, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: b ? JSON.stringify(b) : undefined
  }));
  return r.json();
}

export async function jdel<T>(p: string): Promise<T> {
  const r = await ok(await fetch(API_BASE + p, { method: "DELETE" }));
  return r.json();
}
