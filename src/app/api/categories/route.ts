import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).lean();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { name, description } = await req.json();
  const slug = slugify(name, { lower: true, strict: true });

  const existing = await Category.findOne({ slug });
  if (existing) return NextResponse.json(existing);

  const category = await Category.create({ name, slug, description: description ?? "" });
  return NextResponse.json(category, { status: 201 });
}
