import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
    },
  });

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { password: _, ...safeUser } = user;

  const token = await createSessionToken(safeUser);

  const response = NextResponse.json(safeUser);
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("session");
  return response;
}
