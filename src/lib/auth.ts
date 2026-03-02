import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secret= new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

export async function createSessionToken(user: object) {
    return new SignJWT({ user })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(secret);
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token)
        return null;

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload.user as any;
    } catch {
        return null;
    }
}
