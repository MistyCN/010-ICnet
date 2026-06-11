import { HelpCircle } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
  const isTodo = description.includes("TODO:");

  return (
    <div className={`rounded-2xl p-6 transition-all duration-200 group
      ${isTodo
        ? "bg-card-bg/55 border border-dashed border-border-muted hover:border-border-base"
        : "bg-card-bg border border-border-base hover:bg-card-hover hover:border-border-muted"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-base group-hover:text-emerald-500 transition-colors">
            {title}
          </h3>
          {isTodo && <HelpCircle className="h-4 w-4 text-text-light" />}
        </div>
        {isTodo ? (
          <div className="space-y-2">
            <span className="inline-block text-[10px] text-badge-text bg-badge-bg px-2 py-0.5 border border-badge-border rounded-full">待补充</span>
            <p className="text-text-light text-xs font-mono leading-relaxed">{description}</p>
          </div>
        ) : (
          <p className="text-text-muted text-sm leading-relaxed font-light">{description}</p>
        )}
      </div>
    </div>
  );
}
