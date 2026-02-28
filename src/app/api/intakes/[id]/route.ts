import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// fetch single intake GET /api/intakes/${id}
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

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
  
  return NextResponse.json(intake);
  // return NextResponse.json(intake, { status: 200 });

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
  
  // const updateData: {
  //   status?: string;
  //   reviewerId?: string;
  //   notes?: string;
  // } = {};

  // if (status)
  //   updateData.status = status;
  // if (reviewerId)
  //   updateData.reviewerId = reviewerId;
  // if (notes !== undefined)
  //   updateData.notes = notes;

  // const updated = await prisma.intake.update({
  //   where: { id },
  //   data: updateData,
  // });


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
  
  // return PATCH /api/intakes/${id} endpoint
  // return NextResponse.json(updated);
  return NextResponse.json(updated, { status: 200 });
  // return NextResponse.json({ message: `TODO: Implement PATCH /api/intakes/${id}` }, { status: 501 });
}
