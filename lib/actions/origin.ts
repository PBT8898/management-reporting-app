import type { NextRequest } from "next/server";
export function validOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    // Next may normalize its internal URL to localhost. The incoming Host
    // identifies the browser's actual endpoint, including its port.
    const expected = new URL(request.nextUrl.protocol + "//" + (request.headers.get("host") || request.nextUrl.host));
    return origin === expected.origin;
  } catch { return false; }
}
