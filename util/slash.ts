// Taken from https://github.com/sindresorhus/slash/blob/main/index.js (MIT)
export function slash(path: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path)

  if (isExtendedLengthPath || hasNonAscii) {
    return path
  }

  return path.replace(/\\/g, '/')
}
