export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_DIMENSION = 1920
const SKIP_COMPRESSION_UNDER_BYTES = 3 * 1024 * 1024
const JPEG_QUALITY = 0.85

async function compress(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size < SKIP_COMPRESSION_UNDER_BYTES) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob || blob.size >= file.size) return file

  const newName = file.name.replace(/\.\w+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg' })
}

/**
 * Validates a picked file is an image within size limits, then downsizes it
 * (long side capped, re-encoded as JPEG) so phone-camera photos don't ship
 * full resolution. Falls back to the original file if compression fails —
 * animated GIFs and SVGs are left untouched since canvas would break them.
 */
export async function prepareImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" non è un'immagine`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`"${file.name}" supera il limite di ${MAX_IMAGE_BYTES / (1024 * 1024)}MB`)
  }
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }
  try {
    return await compress(file)
  } catch {
    return file
  }
}

/**
 * Supabase Storage keys reject characters like apostrophes, accented
 * letters, and some punctuation ("Invalid key" on upload) even though the
 * File's original name allows them (e.g. "Atelier d'architettura.png").
 * Strip everything outside a safe ASCII set before building a storage path.
 */
export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot).replace(/[^a-zA-Z0-9.]/g, '') : ''
  const combiningMarks = new RegExp('[\\u0300-\\u036f]', 'g')
  const safeBase = base
    .normalize('NFD')
    .replace(combiningMarks, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return (safeBase || 'file') + ext
}

export async function prepareImageFiles(
  files: File[],
  onError: (message: string) => void,
): Promise<File[]> {
  const results: File[] = []
  for (const file of files) {
    try {
      results.push(await prepareImageFile(file))
    } catch (err) {
      onError(err instanceof Error ? err.message : 'File non valido')
    }
  }
  return results
}
