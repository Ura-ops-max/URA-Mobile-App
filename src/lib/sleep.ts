/** Await a fixed delay — used to simulate network latency in the mock layer. */
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
