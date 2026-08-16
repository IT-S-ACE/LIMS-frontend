const apiUrl = (process.argv[2] ?? process.env.VITE_API_URL ?? "").replace(/\/$/, "");

if (!apiUrl) {
  console.error("Usage: npm run smoke -- https://api.example.com/api");
  process.exit(1);
}

async function check(path, expectedStatus) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await response.json();

    if (!response.ok || body.status !== expectedStatus) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }

    const requestId = response.headers.get("x-request-id") ?? "missing";
    console.log(`PASS ${path} status=${body.status} request_id=${requestId}`);
  } finally {
    clearTimeout(timeout);
  }
}

try {
  await check("/health/live", "ok");
  await check("/health/ready", "ready");
  console.log("Frontend-to-API smoke test passed.");
} catch (error) {
  console.error(`Smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
