function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function humanDelay(minMs = 500, maxMs = 2000): Promise<void> {
  await new Promise((r) => setTimeout(r, randomBetween(minMs, maxMs)));
}
