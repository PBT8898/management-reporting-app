import { NextResponse, type NextRequest } from "next/server";
// v1 is a shared, anonymous reporting workspace. Auth is deferred to the lockdown sprint.
export function middleware(request: NextRequest) { return NextResponse.next({ request }); }
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
