export function skipFrames(frameCount: number, callback: () => void) {
  if (frameCount == 0) {
    callback()
  } else {
    requestAnimationFrame(() => skipFrames(frameCount - 1, callback))
  }
}
