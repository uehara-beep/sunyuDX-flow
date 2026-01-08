export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function startOfWeekISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay() // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1 - day) // Mon start
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function startOfMonthISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function endOfMonthISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function dowLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const arr = ['日','月','火','水','木','金','土']
  return arr[d.getDay()]
}
