import { NextRequest, NextResponse } from "next/server";


export function proxy(request: NextRequest) {
    const user = request.cookies.get("user");
     const { pathname } = request.nextUrl;

     // Redirect to login if not authenticated
     if (!user && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
     }

     // Redirect to home if authenticated (already logged in and visiting again)
     if (user && pathname === "/login") {
        try {
            const parsed = JSON.parse(user.value);
            return NextResponse.redirect(
                new URL(parsed.role === "PATIENT" ? "/intake" : "/queue", request.url)
            );
        } catch {
            // Malformed cookie — clear it and let them log in again
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete("user");
            return response;
        }
     }

     if (user && pathname === "/intake") {
        const parsed = JSON.parse(user.value);
        if (parsed.role !== "PATIENT") {
            return NextResponse.redirect(new URL("/queue", request.url));
        }
     }
     
     if (user && pathname === "/queue") {
        const parsed = JSON.parse(user.value);
        if (parsed.role !== "REVIEWER") {
            return NextResponse.redirect(new URL("/intake", request.url));
        }
     }

     return NextResponse.next();
}
   

export const config = {
    matcher: ["/", "/intake", "/queue", "/login"],
};
