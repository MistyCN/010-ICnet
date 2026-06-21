import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFacility, listFacilities } from "@/lib/data";
import { validateBuilder, validateFacilityName, validateLandName } from "@/lib/validators";

export async function GET() {
  try {
    const facilities = await listFacilities();

    return NextResponse.json(facilities);
  } catch (error) {
    console.error("Fetch facilities error:", error);
    return NextResponse.json({ error: "获取公共设施清单失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "请登录后操作" }, { status: 401 });
    }

    const body = await req.json();
    const { landName, facilityName, builder } = body;

    const landNameVal = validateLandName(landName);
    if (!landNameVal.isValid) {
      return NextResponse.json({ error: landNameVal.error }, { status: 400 });
    }

    const facilityNameVal = validateFacilityName(facilityName);
    if (!facilityNameVal.isValid) {
      return NextResponse.json({ error: facilityNameVal.error }, { status: 400 });
    }

    const builderVal = validateBuilder(builder);
    if (!builderVal.isValid) {
      return NextResponse.json({ error: builderVal.error }, { status: 400 });
    }

    const newFacility = await createFacility({
      landName: landName.trim(),
      facilityName: facilityName.trim(),
      builder: builder.trim(),
      authorId: session.user.id,
    });

    return NextResponse.json({ id: newFacility.id, message: "登记成功" }, { status: 201 });
  } catch (error) {
    console.error("Create facility error:", error);
    return NextResponse.json({ error: "登记公共设施失败，请稍后重试" }, { status: 500 });
  }
}
