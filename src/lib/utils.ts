export const newId = (): string => crypto.randomUUID()

export const nowISO = (): string => new Date().toISOString()

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ')

