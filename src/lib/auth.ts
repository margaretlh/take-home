import { cookies } from "next/headers";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("user");
    // return user ? JSON.parse(user.value) : null;

    if (!userCookie) return null;

    try {
        const user = JSON.parse(userCookie.value);
        return user;
    } catch (error) {
        console.error("Error parsing user cookie:", error);
        return null;
    }
}