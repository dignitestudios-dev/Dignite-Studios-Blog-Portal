import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdminUser from "@/models/AdminUser";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const currentUserEmail = session?.user?.email;
    const users = await AdminUser.find({ email: { $ne: currentUserEmail } }, "-passwordHash").sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await AdminUser.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const newUser = await AdminUser.create({
      name,
      email,
      passwordHash: hashPassword(password),
      role: role || "editor",
    });

    const { passwordHash: _, ...userObj } = newUser.toObject();

    return NextResponse.json({ user: userObj });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
