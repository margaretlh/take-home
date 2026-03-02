import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production"
  );

async function getSessionUser(request: NextRequest) {
    const token = request.cookies.get("session")?.value;
    if (!token) 
        return null;
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload.user as any;
    } catch {
        return null;
    }
}
  
export async function proxy(request: NextRequest) {
    // const user = request.cookies.get("session");
    const { pathname } = request.nextUrl;
    const user = await getSessionUser(request);

    // Redirect to login if not authenticated
    if (!user && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect already logged in users away from login page
    if (user && pathname === "/login") {
        return NextResponse.redirect(
            new URL(user.role === "PATIENT" ? "/intake" : "/queue", request.url)
        );
    }

    // Patients can't access review queue
    if (user && pathname === "/intake") {
        if (user.role !== "PATIENT") {
            return NextResponse.redirect(new URL("/queue", request.url));
        }
    }
     
    // Reviewers can't access intake
    if (user && pathname === "/queue") {
        if (user.role !== "REVIEWER") {
            return NextResponse.redirect(new URL("/intake", request.url));
        }
    }

    return NextResponse.next();
}   

export const config = {
    matcher: ["/", "/intake", "/queue", "/login"],
};
