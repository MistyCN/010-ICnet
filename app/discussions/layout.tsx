"use client";

import { usePathname } from "next/navigation";
import DiscussionList from "@/components/discussion-list";

export default function DiscussionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Segments array from pathname:
  // e.g., "/discussions" -> ["", "discussions"]
  // e.g., "/discussions/123" -> ["", "discussions", "123"]
  // e.g., "/discussions/new" -> ["", "discussions", "new"]
  const segments = pathname.split("/");
  const isNewPage = segments.length > 2 && segments[2] === "new";
  const isDetailPage = segments.length > 2 && segments[2] !== "new";
  const activeId = isDetailPage ? segments[2] : undefined;

  // Keep the create page as a dedicated full-width editor page
  if (isNewPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex-grow bg-background py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left Pane - Discussion List (Sticky and independently scrollable on PC) */}
          <div
            className={`${
              isDetailPage ? "hidden md:block" : "w-full"
            } md:w-[350px] lg:w-[400px] shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto pr-1.5`}
          >
            <DiscussionList activeId={activeId} />
          </div>

          {/* Right Pane - Thread Details or Empty State */}
          <div
            className={`${
              isDetailPage ? "w-full" : "hidden md:block"
            } md:flex-grow`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
