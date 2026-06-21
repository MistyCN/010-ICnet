import Link from "next/link";
import { getServerSession } from "next-auth";
import { Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listFacilities } from "@/lib/data";
import CopyCommandButton from "@/components/copy-command-button";
import FacilityRowActions from "@/components/facility-row-actions";

export const metadata = {
  title: "公共设施清单",
  description: "查看与登记服务器的公共设施，按清单发放奖励",
};

export default async function FacilitiesPage() {
  const session = await getServerSession(authOptions);
  const facilities = await listFacilities();

  return (
    <div className="flex-grow bg-background py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">公共设施清单</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto font-light">
            汇总服务器上的公共设施，登记后按本清单发放奖励。复制传送指令即可一键到达。
          </p>
          <div className="flex justify-center">
            {session ? (
              <Link
                href="/facilities/new"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>登记设施</span>
              </Link>
            ) : (
              <Link
                href="/login?callbackUrl=/facilities/new"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-foreground hover:bg-card-hover font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95"
              >
                <span>登录后登记</span>
              </Link>
            )}
          </div>
        </div>

        {facilities.length === 0 ? (
          <div className="text-center py-16 border border-border-base rounded-2xl bg-card-bg flex flex-col items-center justify-center gap-3 select-none">
            <p className="text-sm text-text-muted">暂无公共设施登记</p>
            <p className="text-xs text-text-light">
              {session ? "点击上方「登记设施」添加第一条记录" : "登录后即可登记公共设施"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border-base bg-card-bg overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-base text-text-muted">
                    <th className="text-left font-medium px-5 py-3 whitespace-nowrap">领地名</th>
                    <th className="text-left font-medium px-5 py-3 whitespace-nowrap">设施名</th>
                    <th className="text-left font-medium px-5 py-3 whitespace-nowrap">建造者</th>
                    <th className="text-left font-medium px-5 py-3 whitespace-nowrap">传送指令</th>
                    <th className="text-right font-medium px-5 py-3 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((facility) => (
                    <tr
                      key={facility.id}
                      className="border-b border-border-base last:border-b-0 hover:bg-card-hover transition-colors duration-150"
                    >
                      <td className="px-5 py-3.5 text-foreground font-medium whitespace-nowrap">
                        {facility.landName}
                      </td>
                      <td className="px-5 py-3.5 text-foreground whitespace-nowrap">
                        {facility.facilityName}
                      </td>
                      <td className="px-5 py-3.5 text-text-muted whitespace-nowrap">
                        {facility.builder}
                      </td>
                      <td className="px-5 py-3.5">
                        <CopyCommandButton command={facility.teleportCommand} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <FacilityRowActions id={facility.id} authorId={facility.authorId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
