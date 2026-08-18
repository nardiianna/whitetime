export function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function isInMonth(dateStr: string, monthStart: Date) {
  const d = new Date(dateStr)
  return d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth()
}

export function monthLabel(date: Date) {
  const label = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
