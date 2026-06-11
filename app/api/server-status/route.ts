import { NextResponse } from "next/server";
import { getServerStatus } from "@/lib/minecraft/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const status = await getServerStatus();
    return NextResponse.json(status, {
      headers: cacheHeaders,
    });
  } catch (error: any) {
    console.error("API Route error in /api/server-status:", error);
    return NextResponse.json(
      {
        online: false,
        host: process.env.MC_SERVER_HOST || process.env.NEXT_PUBLIC_SERVER_IP || "your-server.example.com",
        port: parseInt(process.env.MC_SERVER_PORT || process.env.NEXT_PUBLIC_SERVER_PORT || "25565", 10),
        motd: null,
        version: null,
        protocol: null,
        players: { online: 0, max: 0, sample: [] },
        latency: null,
        checkedAt: new Date().toISOString(),
        error: "Internal server error occurred while fetching status",
      },
      { 
        status: 200, 
        headers: cacheHeaders,
      }
    );
  }
}
