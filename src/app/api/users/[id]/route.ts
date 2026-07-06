import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdminUser from "@/models/AdminUser";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, role } = body;

    const userToUpdate = await AdminUser.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (email && email !== userToUpdate.email) {
      const existing = await AdminUser.findOne({ email });
      if (existing) {
        return NextResponse.json({ error: "Email already taken" }, { status: 400 });
      }
      userToUpdate.email = email;
    }

    if (name) userToUpdate.name = name;
    if (role) userToUpdate.role = role;
    if (password) userToUpdate.passwordHash = hashPassword(password);

    await userToUpdate.save();

    const { passwordHash, ...userObj } = userToUpdate.toObject();

    return NextResponse.json({ user: userObj });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const user = await AdminUser.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
