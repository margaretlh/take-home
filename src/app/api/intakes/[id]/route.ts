import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// fetch single intake GET /api/intakes/${id}
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const intake = await prisma.intake.findUnique({
    where: { id },
    include: {
      submittedBy: true,
      reviewer: true,
      documents: true,
      auditLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc"}
      },
    },
  });

  if (!intake) {
    return NextResponse.json({error: "Intake not found" }, { status: 404 });
  }
  
  // Patients can only view their own intakes
  if (user.role === "PATIENT" && intake.submittedById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(intake);

}

// Update intake
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();

  const body = await request.json();
  const { status, reviewerId, notes, userId } = body;

  const intake = await prisma.intake.findUnique({ where: { id } });
  if (!intake) {
    return NextResponse.json({error : "Intake not found" }, { status: 404 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "REVIEWER") {
    return NextResponse.json({ error: "Only reviewers can update status" }, { status: 403 });
  }

  const updated = await prisma.intake.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(reviewerId && { reviewerId }),
      ...(notes !== undefined && { notes }),
    },
  });

  const auditDetails: {
    from?: string;
    to?: string;
    notes?: string;
  } = {};

  if (status) {
    auditDetails.from = intake.status;
    auditDetails.to = status;
  }
  
  if (notes !== undefined)
    auditDetails.notes = notes;

  // Audit log
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        intakeId: id,
        action: status ? "STATUS_CHANGED" : "UPDATED",
        details: JSON.stringify(auditDetails),
      },
    });
  }  
  return NextResponse.json(updated, { status: 200 });
}
