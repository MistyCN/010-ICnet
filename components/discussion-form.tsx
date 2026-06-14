"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus, Trash2, Image, BarChart4 } from "lucide-react";
import { validateDiscussionTitle, validateDiscussionContent } from "@/lib/validators";

export default function DiscussionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  // Poll states
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollError, setPollError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (val) {
      const check = validateDiscussionTitle(val);
      setTitleError(check.isValid ? null : check.error || "标题长度不符合要求");
    } else {
      setTitleError(null);
    }
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (val) {
      const check = validateDiscussionContent(val);
      setContentError(check.isValid ? null : check.error || "内容长度不符合要求");
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

  const handleAddOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setPollError(null);

    const titleCheck = validateDiscussionTitle(title);
    const contentCheck = validateDiscussionContent(content);

    if (!titleCheck.isValid) {
      setTitleError(titleCheck.error || "标题长度不符合要求");
      return;
    }
    if (!contentCheck.isValid) {
      setContentError(contentCheck.error || "内容长度不符合要求");
      return;
    }

    if (hasPoll) {
      if (!pollQuestion.trim() || pollQuestion.trim().length < 3) {
        setPollError("投票问题不能为空且至少包含 3 个字符");
        return;
      }
      const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setPollError("请填写至少 2 个有效的投票选项");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          ...(hasPoll ? {
            poll: {
              question: pollQuestion.trim(),
              options: pollOptions.map(o => o.trim()).filter(Boolean)
            }
          } : {})
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发布讨论失败，请重试");
        setLoading(false);
      } else {
        router.push(`/discussions/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("请求发送失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {error && (
        <div className="flex items-center gap-2 text-xs bg-danger-bg border border-danger-border text-danger px-3 py-2.5 rounded-lg select-none animate-slide-down">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">标题</label>
          <span className="text-[10px] text-text-light font-normal">4-80 字符</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          disabled={loading}
          placeholder="请输入讨论主题的标题..."
          className={`w-full text-sm px-4 py-2.5 rounded-xl border bg-card-bg text-foreground placeholder-text-light transition-all focus:outline-none focus:ring-1 focus:bg-background
            ${titleError 
              ? "border-danger focus:ring-danger focus:border-danger" 
              : "border-border-base focus:ring-foreground focus:border-foreground"
            }`}
        />
        {titleError && <p className="text-[10px] text-danger mt-1">{titleError}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            内容
            {uploadingImage && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
          </label>
          <span className="text-[10px] text-text-light font-normal flex items-center gap-1 select-none">
            <Image className="h-3 w-3" />
            支持 Ctrl+V 粘贴上传图片 | 2-3000 字符
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onPaste={handlePaste}
          disabled={loading}
          rows={8}
          placeholder="请编写您想要讨论的内容，支持纯文本与 Markdown 格式图片..."
          className={`w-full text-sm px-4 py-3 rounded-xl border bg-card-bg text-foreground placeholder-text-light transition-all focus:outline-none focus:ring-1 focus:bg-background resize-y min-h-[120px]
            ${contentError 
              ? "border-danger focus:ring-danger focus:border-danger" 
              : "border-border-base focus:ring-foreground focus:border-foreground"
            }`}
        />
        {contentError && <p className="text-[10px] text-danger mt-1">{contentError}</p>}
      </div>

      {/* Poll Toggle Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setHasPoll(!hasPoll)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95
            ${hasPoll 
              ? "bg-foreground text-background border-foreground" 
              : "bg-card-bg border-border-base hover:bg-card-hover text-text-muted hover:text-foreground"
            }`}
        >
          <BarChart4 className="h-3.5 w-3.5" />
          <span>{hasPoll ? "取消投票" : "添加投票"}</span>
        </button>
      </div>

      {/* Poll Creation Form */}
      {hasPoll && (
        <div className="p-5 rounded-xl border border-border-base bg-card-bg/50 space-y-4 animate-slide-down">
          <div className="border-b border-border-base/50 pb-3 mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">投票项目设置</h3>
            <span className="text-[10px] text-text-light">可添加 2-6 个选项</span>
          </div>

          {pollError && (
            <div className="flex items-center gap-2 text-xs bg-danger-bg border border-danger-border text-danger px-3 py-2 rounded-lg select-none">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pollError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">投票问题</label>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="例如：您最喜欢新版本的哪项改动？"
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-border-base bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-foreground block">选项</label>
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`选项 ${index + 1}`}
                  className="flex-grow text-sm px-4 py-2.5 rounded-xl border border-border-base bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2.5 rounded-xl border border-border-base bg-card-bg hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition-all cursor-pointer active:scale-95 text-text-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-dashed border-border-base hover:border-border-muted bg-card-bg/25 hover:bg-card-hover/20 text-text-muted hover:text-foreground text-xs font-medium transition-all duration-200 cursor-pointer active:scale-98"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>增加选项</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl border border-border-base bg-card-bg hover:bg-card-hover text-foreground font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>正在发布...</span>
            </>
          ) : (
            <span>发布讨论</span>
          )}
        </button>
      </div>
    </form>
  );
}
