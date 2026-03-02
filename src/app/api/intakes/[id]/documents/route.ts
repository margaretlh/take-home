import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // For patients, verify they own this intake
  if (user.role === "PATIENT") {
    const intake = await prisma.intake.findUnique({
      where: { id },
      select: { submittedById: true },
    });

    if (!intake || intake.submittedById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const description = formData.get("description") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  // Save to /public/uploads so files are accessible via URL
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: `/uploads/${uniqueName}`,
      description: description || null,
      intakeId: id,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      intakeId: id,
      action: "DOCUMENT_UPLOADED",
      details: JSON.stringify({ fileName: file.name }),
    },
  });

  return NextResponse.json(document, { status: 201 });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // For patients, verify they own this intake
  if (user.role === "PATIENT") {
    const intake = await prisma.intake.findUnique({
      where: { id },
      select: { submittedById: true },
    });

    if (!intake || intake.submittedById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const documents = await prisma.document.findMany({
    where: { intakeId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}
