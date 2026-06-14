import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "讨论区",
  description: "InfCraft 玩家讨论社区，分享您的游戏心得与建议",
};

export default function DiscussionsPage() {
  return (
    <div className="hidden md:flex flex-col flex-grow border border-border-base rounded-2xl bg-card-bg/25 items-center justify-center p-12 text-center select-none min-h-[450px] animate-fade-in">
      <MessageSquare className="h-10 w-10 text-text-light mb-3 stroke-[1.5]" />
      <p className="text-sm font-medium text-foreground">请在左侧选择一个讨论话题</p>
      <p className="text-xs text-text-muted mt-1 font-normal">
        点击列表中的讨论项，即可在此展示其详细内容和回复
      </p>
    </div>
  );
}
