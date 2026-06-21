import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getFacilityForManager } from "@/lib/data";
import { isOpRole } from "@/lib/admin";
import FacilityForm from "@/components/facility-form";

export const metadata = {
  title: "编辑公共设施",
  description: "编辑你登记的公共设施",
};

export default async function EditFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const facility = await getFacilityForManager(id, session.user.id, isOpRole(session.user.role));

  // 不存在或不属于当前用户 → 404（不泄露存在性）
  if (!facility) {
    notFound();
  }

  return (
    <div className="flex-grow bg-background py-10">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">编辑公共设施</h1>
          <p className="text-xs text-text-muted mt-1 font-normal">修改你登记的公共设施信息</p>
        </div>

        <div className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm">
          <FacilityForm
            facility={{
              id: facility.id,
              landName: facility.landName,
              facilityName: facility.facilityName,
              builder: facility.builder,
            }}
          />
        </div>
      </div>
    </div>
  );
}
