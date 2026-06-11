import { siteConfig } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-border-base bg-card-bg/50 py-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>&copy; {new Date().getFullYear()} {siteConfig.serverName}</p>
          <p>本站与 Mojang / Microsoft 无关</p>
        </div>
      </div>
    </footer>
  );
}
