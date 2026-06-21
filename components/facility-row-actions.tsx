"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface FacilityRowActionsProps {
  id: string;
  authorId: string;
}

// 仅在当前登录用户是该设施登记人时显示编辑/删除
export default function FacilityRowActions({ id, authorId }: FacilityRowActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const canManage = session?.user?.id === authorId || session?.user?.role === "OP";

  if (!canManage) {
    return null;
  }

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("确定删除这条公共设施登记吗？")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "删除失败");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      window.alert("网络错误，请稍后重试");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/facilities/${id}/edit`}
        className="inline-flex items-center justify-center p-2 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 cursor-pointer active:scale-95"
        title="编辑"
        aria-label="编辑设施"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center justify-center p-2 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-danger hover:border-danger transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
        title="删除"
        aria-label="删除设施"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
