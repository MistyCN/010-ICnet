import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FacilityForm from "@/components/facility-form";

export const metadata = {
  title: "登记公共设施",
  description: "登记一个新的公共设施",
};

export default async function NewFacilityPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/facilities/new");
  }

  return (
    <div className="flex-grow bg-background py-10">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">登记公共设施</h1>
          <p className="text-xs text-text-muted mt-1 font-normal">
            登记后按本清单发放奖励，请如实填写领地名与建造者信息
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm">
          <FacilityForm />
        </div>
      </div>
    </div>
  );
}
