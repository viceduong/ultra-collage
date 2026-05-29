import { customAlphabet } from 'nanoid'

// URL/JSON-safe short ids. Collision-resistant enough for client-side documents.
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const nano = customAlphabet(alphabet, 10)

export const newId = (prefix = ''): string => (prefix ? `${prefix}_${nano()}` : nano())
