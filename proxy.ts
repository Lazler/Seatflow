import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const GESCHUETZTE_ROUTEN = ["/dashboard"];
const AUTH_ROUTEN = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pfad = request.nextUrl.pathname;
  const istGeschuetzt = GESCHUETZTE_ROUTEN.some((r) => pfad.startsWith(r));
  const istAuthRoute = AUTH_ROUTEN.some((r) => pfad.startsWith(r));

  if (istGeschuetzt && !user) {
    // Rücksprungziel merken, damit man nach dem Login wieder dort landet
    const url = new URL("/login", request.url);
    url.searchParams.set("weiter", pfad);
    return NextResponse.redirect(url);
  }

  if (istAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
