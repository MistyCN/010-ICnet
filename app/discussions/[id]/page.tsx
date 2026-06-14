"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, MessageSquare, Calendar, User, RefreshCw, AlertCircle, CheckCircle2, BarChart4, Loader2 } from "lucide-react";
import ReplyForm from "@/components/reply-form";
import DiscussionList from "@/components/discussion-list";

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  author: {
    minecraftId: string;
  };
}

interface PollOption {
  id: string;
  text: string;
  _count: {
    votes: number;
  };
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  votes: {
    userId: string;
    optionId: string;
  }[];
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    minecraftId: string;
  };
  replies: Reply[];
  poll?: Poll;
}

export default function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = use(params);

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<Record<string, boolean>>({});

  // Voting states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const fetchDiscussionDetails = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setDiscussion(null);
    }
    setError(null);
    try {
      const res = await fetch(`/api/discussions/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("该讨论不存在或已被删除");
        }
        throw new Error("获取讨论详情失败");
      }
      const data = await res.json();
      setDiscussion(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "加载失败，请检查网络连接");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscussionDetails();
  }, [id]);

  const handleReplySuccess = (newReply: Reply) => {
    if (discussion) {
      setDiscussion({
        ...discussion,
        replies: [...discussion.replies, newReply],
      });
    }
  };

  const handleAvatarError = (id: string) => {
    setAvatarError((prev) => ({ ...prev, [id]: true }));
  };

  const handleVoteSubmit = async () => {
    if (!selectedOption || voting || !discussion?.poll) return;

    setVoting(true);
    setVoteError(null);

    try {
      const res = await fetch(`/api/discussions/${id}/poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selectedOption }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "投票失败");
      }

      if (session?.user?.id) {
        const updatedVotes = [
          ...discussion.poll.votes,
          { userId: session.user.id, optionId: selectedOption }
        ];

        const updatedOptions = discussion.poll.options.map(opt => {
          if (opt.id === selectedOption) {
            return {
              ...opt,
              _count: { votes: opt._count.votes + 1 }
            };
          }
          return opt;
        });

        setDiscussion({
          ...discussion,
          poll: {
            ...discussion.poll,
            options: updatedOptions,
            votes: updatedVotes
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      setVoteError(err.message || "投票失败，请稍后重试");
    } finally {
      setVoting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to parse content and render Markdown images
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {text.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      const altText = match[1] || "Image";
      const imageUrl = match[2];

      parts.push(
        <span key={`img-${matchIndex}`} className="block my-3 select-none">
          <img
            src={imageUrl}
            alt={altText}
            className="rounded-xl border border-border-base max-w-full h-auto object-contain max-h-[400px] shadow-sm hover:scale-[1.01] transition-transform duration-200 cursor-zoom-in"
            onClick={() => window.open(imageUrl, "_blank")}
          />
        </span>
      );

      lastIndex = imageRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <div className="leading-relaxed whitespace-pre-wrap break-words">{parts.length > 0 ? parts : text}</div>;
  };

  if (loading && !discussion) {
    return (
      <div className="space-y-6 animate-fade-in select-none">
        {/* Top Actions Skeleton */}
        <div className="flex justify-between items-center gap-4">
          <div className="h-8 w-24 bg-card-bg border border-border-base rounded-xl animate-pulse" />
          <div className="h-8 w-8 bg-card-bg border border-border-base rounded-xl animate-pulse" />
        </div>

        {/* Discussion Article Skeleton */}
        <div className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm space-y-5">
          <div className="h-6 w-2/3 bg-card-hover rounded-md animate-pulse" />
          
          <div className="flex items-center gap-3 border-b border-border-base/50 pb-4 mb-4 select-none">
            <div className="h-5 w-20 bg-card-hover rounded-sm animate-pulse" />
            <div className="h-5 w-28 bg-card-hover rounded-sm animate-pulse" />
          </div>

          <div className="space-y-2.5">
            <div className="h-4 w-full bg-card-hover rounded-md animate-pulse" />
            <div className="h-4 w-11/12 bg-card-hover rounded-md animate-pulse" />
            <div className="h-4 w-4/5 bg-card-hover rounded-md animate-pulse" />
          </div>
        </div>

        {/* Replies Header Skeleton */}
        <div className="h-5 w-20 bg-card-hover rounded-md animate-pulse ml-1" />

        {/* Replies List Skeleton */}
        <div className="space-y-3">
          <div className="p-5 rounded-2xl bg-card-bg border border-border-base space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-card-hover rounded-sm animate-pulse" />
              <div className="h-4 w-24 bg-card-hover rounded-sm animate-pulse" />
            </div>
            <div className="h-4 w-3/4 bg-card-hover rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => router.push("/discussions")}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground hover:bg-card-hover px-3 py-1.5 border border-border-base rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>
        </div>

        <div className="p-12 border border-border-base rounded-2xl bg-card-bg text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-danger mx-auto animate-bounce" />
          <p className="text-sm font-medium text-foreground">{error || "讨论未找到"}</p>
        </div>
      </div>
    );
  }

  // Voting statistics calculation
  const hasPoll = !!discussion.poll;
  const totalVotes = discussion.poll?.options.reduce((sum, opt) => sum + opt._count.votes, 0) || 0;
  const userVote = discussion.poll?.votes.find(v => v.userId === session?.user?.id);
  const hasUserVoted = !!userVote;
  const isUserLoggedIn = !!session;

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/discussions")}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground hover:bg-card-hover px-3 py-1.5 border border-border-base rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>

          <button
            onClick={() => fetchDiscussionDetails(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center p-2 rounded-xl border border-border-base bg-card-bg text-text-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
            title="刷新回复"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <article className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground leading-snug mb-4">
            {discussion.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-text-muted border-b border-border-base/50 pb-4 mb-4 select-none">
            <Link
              href={`/profile/${discussion.author.minecraftId}`}
              className="flex items-center gap-1.5 hover:text-foreground group cursor-pointer"
            >
              {!avatarError[discussion.id] ? (
                <img
                  src={`https://mc-heads.net/avatar/${discussion.author.minecraftId}/20`}
                  alt={discussion.author.minecraftId}
                  width={20}
                  height={20}
                  className="rounded-sm object-contain group-hover:scale-105 transition-transform duration-200"
                  onError={() => handleAvatarError(discussion.id)}
                />
              ) : (
                <User className="h-4 w-4 text-text-light" />
              )}
              <span className="font-semibold text-text-light group-hover:underline group-hover:text-foreground transition-colors">
                {discussion.author.minecraftId}
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-text-light" />
              <span>
                {discussion.createdAt === discussion.updatedAt
                  ? formatDate(discussion.createdAt)
                  : `${formatDate(discussion.createdAt)} (编辑于 ${formatDate(discussion.updatedAt)})`}
              </span>
            </div>
          </div>

          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {renderFormattedContent(discussion.content)}
          </div>
        </article>

        {/* Poll Presentation Area */}
        {hasPoll && discussion.poll && (
          <div className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border-base/50 pb-3 mb-1 select-none">
              <BarChart4 className="h-4 w-4" />
              <span>本贴发起的投票</span>
            </div>

            {voteError && (
              <div className="flex items-center gap-2 text-xs bg-danger-bg border border-danger-border text-danger px-3 py-2 rounded-lg select-none">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{voteError}</span>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">{discussion.poll.question}</h3>
              <p className="text-[10px] text-text-muted select-none">累计投票次数: {totalVotes} 次</p>
            </div>

            {/* Voting Interface: Voted or Not Logged In (Render Results) */}
            {hasUserVoted || !isUserLoggedIn ? (
              <div className="space-y-3 pt-1">
                {discussion.poll.options.map((opt) => {
                  const voteCount = opt._count.votes;
                  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  const isUserSelection = userVote?.optionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      className={`relative p-3.5 rounded-xl border transition-all select-none
                        ${isUserSelection 
                          ? "border-success-border bg-success-bg/10" 
                          : "border-border-base bg-background/50"
                        }`}
                    >
                      {/* Background progress indicator bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 rounded-l-xl transition-all duration-500
                          ${isUserSelection ? "bg-success-bg/25" : "bg-card-hover"}`}
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2 font-medium">
                          {isUserSelection && (
                            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" />
                          )}
                          <span className={isUserSelection ? "text-success-text font-semibold" : "text-foreground"}>
                            {opt.text}
                          </span>
                        </div>
                        <div className="text-text-muted shrink-0 font-medium">
                          {voteCount} 票 ({percentage}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!isUserLoggedIn && (
                  <p className="text-[10px] text-text-light text-center select-none pt-1">
                    请{" "}
                    <Link href="/login" className="text-foreground hover:underline font-semibold">
                      登录
                    </Link>
                    {" "}后参与投票
                  </p>
                )}
              </div>
            ) : (
              /* Voting Interface: Logged In and Not Voted (Render Form Options) */
              <div className="space-y-3 pt-1">
                {discussion.poll.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border border-border-base bg-background/50 hover:bg-card-hover/20 cursor-pointer transition-all active:scale-[0.99]
                      ${selectedOption === opt.id ? "border-foreground ring-1 ring-foreground bg-card-bg/20" : ""}`}
                  >
                    <input
                      type="radio"
                      name="poll-option"
                      value={opt.id}
                      checked={selectedOption === opt.id}
                      onChange={() => setSelectedOption(opt.id)}
                      disabled={voting}
                      className="sr-only"
                    />
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all
                        ${selectedOption === opt.id ? "border-foreground bg-foreground" : "border-border-base"}`}
                    >
                      {selectedOption === opt.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-background" />
                      )}
                    </div>
                    <span className="text-xs text-foreground font-medium">{opt.text}</span>
                  </label>
                ))}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleVoteSubmit}
                    disabled={!selectedOption || voting}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                  >
                    {voting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>提交投票</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-semibold text-foreground px-1 select-none">
          <MessageSquare className="h-4 w-4" />
          <span>回复 ({discussion.replies.length})</span>
        </div>

        {discussion.replies.length === 0 ? (
          <div className="text-center py-12 border border-border-base rounded-2xl bg-card-bg select-none">
            <p className="text-xs text-text-muted">暂无回复，快来发表您的看法吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discussion.replies.map((reply) => (
              <div
                key={reply.id}
                className="p-5 rounded-2xl bg-card-bg border border-border-base hover:bg-card-hover transition-colors animate-fade-up"
              >
                <div className="flex items-center justify-between gap-4 text-xs text-text-muted mb-3 select-none">
                  <Link
                    href={`/profile/${reply.author.minecraftId}`}
                    className="flex items-center gap-1.5 hover:text-foreground group cursor-pointer"
                  >
                    {!avatarError[reply.id] ? (
                      <img
                        src={`https://mc-heads.net/avatar/${reply.author.minecraftId}/18`}
                        alt={reply.author.minecraftId}
                        width={18}
                        height={18}
                        className="rounded-sm object-contain group-hover:scale-105 transition-transform duration-200"
                        onError={() => handleAvatarError(reply.id)}
                      />
                    ) : (
                      <User className="h-3.5 w-3.5 text-text-light" />
                    )}
                    <span className="font-medium text-text-light group-hover:underline group-hover:text-foreground transition-colors">
                      {reply.author.minecraftId}
                    </span>
                  </Link>
                  <span>{formatDate(reply.createdAt)}</span>
                </div>
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {renderFormattedContent(reply.content)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-card-bg border border-border-base shadow-sm">
          {session ? (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-foreground select-none">发表回复</h3>
              <ReplyForm discussionId={discussion.id} onReplySuccess={handleReplySuccess} />
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-text-muted select-none">
              请{" "}
              <Link href="/login" className="text-foreground font-semibold hover:underline">
                登录
              </Link>
              {" "}后发表回复
            </div>
          )}
        </div>
    </div>
  );
}
