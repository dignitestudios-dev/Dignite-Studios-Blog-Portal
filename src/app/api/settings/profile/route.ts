import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AdminUser from "@/models/AdminUser";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, oldPassword, newPassword } = await req.json();

    await connectDB();
    const user = await AdminUser.findOne({ email: session.user.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (name) {
      user.name = name;
    }

    if (oldPassword && newPassword) {
      const oldPasswordHash = hashPassword(oldPassword);
      if (user.passwordHash !== oldPasswordHash) {
        return NextResponse.json({ message: "Incorrect old password" }, { status: 400 });
      }

      // Password validation (just in case they bypass UI)
      const hasLength = newPassword.length >= 8;
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        return NextResponse.json({ message: "New password does not meet security requirements" }, { status: 400 });
      }

      user.passwordHash = hashPassword(newPassword);
    }

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
