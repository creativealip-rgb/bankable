export function logInfo(event: string, payload: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      level: "info",
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    })
  );
}

export function logError(event: string, error: unknown, payload: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      event,
      timestamp: new Date().toISOString(),
      message,
      stack,
      ...payload,
    })
  );
}

