import Hero from "@/components/hero";
import ServerStatusCard from "@/components/server-status-card";

export default function Home() {
  return (
    <section className="flex-1 flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
          {/* 左: 品牌内容 */}
          <div className="flex-1">
            <Hero />
          </div>
          {/* 右: 状态监控 */}
          <div className="w-full lg:w-auto flex-shrink-0">
            <ServerStatusCard />
          </div>
        </div>
      </div>
    </section>
  );
}
