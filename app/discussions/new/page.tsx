import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DiscussionForm from "@/components/discussion-form";

export const metadata = {
  title: "发布讨论",
  description: "发布一个新的讨论主题",
};

export default async function NewDiscussionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/discussions/new");
  }

  return (
    <div className="flex-grow bg-background py-10">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">发布新讨论</h1>
          <p className="text-xs text-text-muted mt-1 font-normal">发起一个新的话题，与大陆上的其他冒险家共同探讨</p>
        </div>

        <div className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm">
          <DiscussionForm />
        </div>
      </div>
    </div>
  );
}
