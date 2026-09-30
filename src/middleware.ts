import { NextResponse, type NextRequest } from "next/server";
import { EDITOR_COOKIE, editorTokenValid } from "@/lib/editor-session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(EDITOR_COOKIE)?.value;
  const signedIn = await editorTokenValid(token);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!signedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (signedIn && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
