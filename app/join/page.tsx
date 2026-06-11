import { siteConfig } from "@/config/site";
import CopyIpButton from "@/components/copy-ip-button";
import { Play, ShieldAlert, Users, MessageSquare } from "lucide-react";

export const metadata = {
  title: "加入我们",
  description: `如何加入 ${siteConfig.serverName} Minecraft 服务器。`,
};

export default function JoinPage() {
  const { socialLinks } = siteConfig;

  const renderSocialLink = (name: string, value: string | null) => {
    const isUrl = value?.startsWith("http");
    return (
      <div className="flex items-center justify-between p-4 bg-card-bg border border-border-base rounded-xl transition-colors duration-200">
        <span className="text-sm font-medium text-foreground">{name}</span>
        {value ? (
          isUrl ? (
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-355 transition-colors">
              点击加入
            </a>
          ) : (
            <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 font-mono select-all">{value}</span>
          )
        ) : (
          <span className="text-xs text-text-light italic">待补充</span>
        )}
      </div>
    );
  };

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto flex-1">
      <div className="space-y-12 animate-fade-up">
        {/* 标题 */}
        <div className="space-y-4 text-center">
          <div className="inline-flex p-3 bg-success-bg border border-success-border rounded-full text-success-text mx-auto">
            <Play className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">加入我们</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto font-light">
            按照以下指引连接到 {siteConfig.serverName}。
          </p>
        </div>

        {/* 连接地址卡片 */}
        <div className="bg-card-bg border border-border-base rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-200">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-foreground">服务器连接地址</h3>
            <p className="text-text-muted text-xs sm:text-sm font-light">
              当前版本：<span className="text-emerald-500 font-semibold">{siteConfig.serverVersionDisplay}</span>
            </p>
            <p className="font-mono text-sm text-code-text bg-code-bg rounded-lg px-3 py-1.5 border border-code-border inline-block">
              {siteConfig.serverAddress}
            </p>
          </div>
          <CopyIpButton ip={siteConfig.serverAddress} className="w-full md:w-auto shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 步骤 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              连接步骤
            </h3>
            <ol className="space-y-3 pl-4 list-decimal text-text-muted text-sm leading-relaxed font-light">
              <li>启动 Minecraft Java Edition 客户端。</li>
              <li>选择游戏版本 <span className="text-foreground font-semibold">{siteConfig.serverVersionDisplay}</span>。</li>
              <li>进入"多人游戏"菜单。</li>
              <li>点击"添加服务器"或"直接连接"。</li>
              <li>输入地址：<code className="text-success-text font-mono text-xs bg-success-bg px-1.5 py-0.5 rounded border border-success-border">{siteConfig.serverAddress}</code></li>
              <li>点击完成，双击进入服务器。</li>
            </ol>
          </div>

          {/* 规则 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-500" />
              基本规则
            </h3>
            <ul className="space-y-3 pl-4 list-disc text-text-muted text-sm leading-relaxed font-light">
              <li>TODO: 填写基本防作弊规则说明</li>
              <li>TODO: 填写玩家间友好交流与建筑保护声明</li>
              <li>请维护良好的游戏社区秩序，严禁违规行为。</li>
              <li>如有疑问或发现违规，请联系管理人员。</li>
            </ul>
          </div>
        </div>

        {/* 社区 */}
        <div className="space-y-4 pt-8 border-t border-border-base">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            社区群聊
          </h3>
          <p className="text-text-light text-xs font-light">加入玩家社区获取公告和互动。</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {renderSocialLink("QQ 交流群", socialLinks.qqGroup)}
            {renderSocialLink("Discord", socialLinks.discord)}
            {renderSocialLink("KOOK", socialLinks.kook)}
            {renderSocialLink("哔哩哔哩", socialLinks.bilibili)}
          </div>
        </div>
      </div>
    </div>
  );
}
