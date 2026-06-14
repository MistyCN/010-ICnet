"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Send, Image } from "lucide-react";
import { validateReplyContent } from "@/lib/validators";

interface ReplyFormProps {
  discussionId: string;
  onReplySuccess: (newReply: any) => void;
}

export default function ReplyForm({ discussionId, onReplySuccess }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (val) {
      const check = validateReplyContent(val);
      setContentError(check.isValid ? null : check.error || "回复内容长度不符合要求");
    } else {
      setContentError(null);
    }
  };

  // Clipboard Paste Interception
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let imageFile: File | null = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (imageFile) {
      e.preventDefault();

      setUploadingImage(true);
      const placeholder = `![图片上传中...](${Date.now()})`;
      const textarea = e.currentTarget;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const originalText = textarea.value;

      const newText =
        originalText.substring(0, startPos) +
        placeholder +
        originalText.substring(endPos);
      setContent(newText);

      try {
        const formData = new FormData();
        formData.append("image", imageFile);

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "图片上传失败");
        }

        const markdownImage = `![Image](${data.url})`;
        setContent((prev) => prev.replace(placeholder, markdownImage));
      } catch (err: any) {
        console.error("Paste upload failed:", err);
        setContent((prev) => prev.replace(placeholder, ""));
        setError(err.message || "图片上传失败，请确保您已登录");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const check = validateReplyContent(content);
    if (!check.isValid) {
      setContentError(check.error || "回复内容长度不符合要求");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "回复失败，请重试");
      } else {
        setContent("");
        setContentError(null);
        onReplySuccess(data);
      }
    } catch (err) {
      console.error(err);
      setError("网络请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-xs bg-danger-bg border border-danger-border text-danger px-3 py-2 rounded-lg select-none animate-slide-down">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onPaste={handlePaste}
          disabled={loading}
          rows={3}
          placeholder="写下您的回复... (支持 Ctrl+V 粘贴上传图片，支持 Markdown 格式图片)"
          className={`w-full text-sm px-4 py-3 rounded-xl border bg-card-bg text-foreground placeholder-text-light transition-all focus:outline-none focus:ring-1 focus:bg-background resize-none
            ${contentError 
              ? "border-danger focus:ring-danger focus:border-danger" 
              : "border-border-base focus:ring-foreground focus:border-foreground"
            }`}
        />
        {contentError && <p className="text-[10px] text-danger">{contentError}</p>}
      </div>

      <div className="flex justify-between items-center select-none">
        <span className="text-[10px] text-text-light flex items-center gap-1">
          <Image className="h-3 w-3" />
          {uploadingImage ? "图片上传中..." : "支持 Ctrl+V 粘贴上传图片 | 2-3000 字符"}
        </span>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>回复</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
