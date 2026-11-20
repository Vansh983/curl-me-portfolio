export function readingTime(body: string = ''): number {
  return Math.max(1, Math.ceil((body.trim().match(/\S+/g)?.length ?? 0) / 230));
}
