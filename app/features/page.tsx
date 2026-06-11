import { siteConfig } from "@/config/site";
import FeatureCard from "@/components/feature-card";

export const metadata = {
  title: "玩法特色",
  description: `了解 ${siteConfig.serverName} 服务器的主要玩法与特色内容。`,
};

export default function FeaturesPage() {
  return (
    <div className="py-20 px-6 max-w-4xl mx-auto flex-1">
      <div className="space-y-12 animate-fade-up">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">玩法特色</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto font-light">
            {siteConfig.serverName} 的核心玩法与游戏内容。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {siteConfig.features.map((feature) => (
            <FeatureCard key={feature.id} title={feature.title} description={feature.description} />
          ))}
        </div>
      </div>
    </div>
  );
}
