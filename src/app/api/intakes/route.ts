import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  
  // Unauthorized if no user or user is not a reviewer
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Patient can only see their own intakes
  const intakes = await prisma.intake.findMany({
    where: user.role === "PATIENT" ? { submittedById: user.id } : {},
    include: {
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: { id: true, name: true, email: true },
      },
      documents: true,
      },
      orderBy: { createdAt: "desc" },
  });
  
  return NextResponse.json(intakes);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json ({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "PATIENT") {
    return NextResponse.json({ error: "Only patients can submit applications" }, { status: 403 });
  }
  const body = await request.json();
  const { clientName, clientEmail, clientPhone, dateOfBirth, ssn, description, notes } = body;

  // Basic validation
  if (!clientName || !clientEmail || !clientPhone || !dateOfBirth || !ssn || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const intake = await prisma.intake.create({
    data: {
      clientName,
      clientEmail,
      clientPhone,
      dateOfBirth,
      ssn,
      description,
      notes: notes || null,
      submittedById: user.id,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      intakeId: intake.id,
      action: "CREATED",
      details: JSON.stringify({ submittedBy: user.email }),
    },
  });

  return NextResponse.json(intake, { status: 201 });
}
