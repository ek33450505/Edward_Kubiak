// Maps scroll progress (0..1) onto the active stage index; the last stage owns progress 1.
export function stageIndex(progress, count) {
  return Math.min(count - 1, Math.floor(progress * count));
}
