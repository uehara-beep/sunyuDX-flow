export const API = 'http://localhost:8000'

export async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function jpost<T>(path: string, body: any): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function jdel<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { method: 'DELETE' })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
