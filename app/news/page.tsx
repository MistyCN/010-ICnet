import { siteConfig } from "@/config/site";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "公告",
  description: `${siteConfig.serverName} 的维护通知、更新日志和社区公告。`,
};

export default function NewsPage() {
  return (
    <div className="py-20 px-6 max-w-4xl mx-auto flex-1">
      <div className="space-y-12 animate-fade-up">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">公告</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto font-light">
            维护通知、版本更新和社区活动将在这里发布。
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 bg-card-bg border border-border-base rounded-full text-text-light animate-fade-in">
            <Megaphone className="h-8 w-8" />
          </div>
          <p className="text-text-muted text-sm font-light">暂无公告</p>
          <p className="text-text-light text-xs">公告系统将在后续版本中启用。</p>
        </div>
      </div>
    </div>
  );
}
