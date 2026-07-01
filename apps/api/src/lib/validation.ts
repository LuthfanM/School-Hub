import { z } from 'zod'

export function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Invalid request body.'
}

export function optionalTrimmedString() {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }, z.string().nullable())
}

export function optionalLowercaseEmail(message: string) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed ? trimmed.toLowerCase() : null
  }, z.string().email(message).nullable())
}

export function optionalPassword(message: string) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return null

    return value.trim() ? value : null
  }, z.string().min(8, message).nullable())
}
