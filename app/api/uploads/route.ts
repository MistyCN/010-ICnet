import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import crypto from "crypto";

const getUploadDir = () => {
  const uploadDir = join(process.cwd(), "data", "uploads");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "请登录后上传图片" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "未接收到图片文件" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只允许上传图片文件" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split(".").pop() || "png";
    const safeExt = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext.toLowerCase())
      ? ext.toLowerCase()
      : "png";
    const filename = `${crypto.randomUUID()}.${safeExt}`;
    const filePath = join(getUploadDir(), filename);

    writeFileSync(filePath, buffer);

    return NextResponse.json({
      url: `/api/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json({ error: "图片上传失败，请重试" }, { status: 500 });
  }
}
