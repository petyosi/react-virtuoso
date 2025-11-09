export function toLinux(file: string): string {
  return file.replaceAll('\\', '/')
}
