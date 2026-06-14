import { join } from "path";
import { existsSync, readFileSync } from "fs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    const safeFilenamePattern = /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9]+$/;
    if (!safeFilenamePattern.test(filename)) {
      return new Response("文件名不合法", { status: 400 });
    }

    const filePath = join(process.cwd(), "data", "uploads", filename);

    if (!existsSync(filePath)) {
      return new Response("图片未找到", { status: 404 });
    }

    const buffer = readFileSync(filePath);

    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "image/png";
    if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    } else if (ext === "gif") {
      contentType = "image/gif";
    } else if (ext === "webp") {
      contentType = "image/webp";
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Serve image error:", error);
    return new Response("读取图片失败", { status: 500 });
  }
}
