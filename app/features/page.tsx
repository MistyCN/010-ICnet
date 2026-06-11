import { siteConfig } from "@/config/site";
import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "讨论",
  description: `在 ${siteConfig.serverName} 社区参与讨论和交流。`,
};

export default function FeaturesPage() {
  return (
    <div className="py-20 px-6 max-w-4xl mx-auto flex-1">
      <div className="space-y-12 animate-fade-up">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">讨论</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto font-light">
            社区讨论与玩家交流空间。
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 bg-card-bg border border-border-base rounded-full text-text-light animate-fade-in">
            <MessageSquare className="h-8 w-8" />
          </div>
          <p className="text-text-muted text-sm font-light">暂无讨论</p>
          <p className="text-text-light text-xs">讨论板块将在后续版本中启用。</p>
        </div>
      </div>
    </div>
  );
}
