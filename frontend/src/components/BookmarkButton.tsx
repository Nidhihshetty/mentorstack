"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { authAPI } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";

type BookmarkKind = "question" | "article" | "post";

export default function BookmarkButton({
  kind,
  id,
  className,
  onChange,
}: {
  kind: BookmarkKind;
  id: number;
  className?: string;
  onChange?: (bookmarked: boolean) => void;
}) {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const isAuthed = useMemo(() => authAPI.isAuthenticated(), []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isAuthed) return; // don't fetch on server or unauth
      try {
        const data = await authAPI.getMyBookmarks();
        let exists = false;
        if (kind === "question") {
          exists = data.questions.some((q) => q.questionId === id);
        } else if (kind === "article") {
          exists = data.articles.some((a) => a.articleId === id);
        } else {
          exists = data.posts.some((p) => p.postId === id);
        }
        if (mounted) setIsBookmarked(exists);
      } catch (e) {
        // ignore
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [id, kind, isAuthed]);

  const toggle = async () => {
    if (!isAuthed) {
      alert("Please log in to use bookmarks.");
      return;
    }
    setLoading(true);
    const previous = isBookmarked;
    setIsBookmarked(!previous);
    onChange?.(!previous);
    try {
      if (!previous) {
        if (kind === "question") await authAPI.addQuestionBookmark(id);
        else if (kind === "article") await authAPI.addArticleBookmark(id);
        else await authAPI.addCommunityPostBookmark(id);
      } else {
        if (kind === "question") await authAPI.removeQuestionBookmark(id);
        else if (kind === "article") await authAPI.removeArticleBookmark(id);
        else await authAPI.removeCommunityPostBookmark(id);
      }
    } catch (err) {
      // revert on error
      setIsBookmarked(previous);
      onChange?.(previous);
      const msg = err instanceof Error ? err.message : "Bookmark action failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={"outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={[
        // Lighter green styling to match "Summarize Answers" button when active
        isBookmarked
          ? "bg-primary-light hover:bg-primary-light-100 text-white border-transparent"
          : "border-primary text-primary hover:bg-primary-light hover:text-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark className={isBookmarked ? "fill-current" : ""} />
      <span className="hidden sm:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
    </Button>
  );
}
