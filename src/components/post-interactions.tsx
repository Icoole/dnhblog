import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Lightbulb, Sparkles, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const reactions = [
  { key: "inspired", label: "Inspired", icon: Sparkles },
  { key: "love", label: "Love", icon: Heart },
  { key: "insightful", label: "Insightful", icon: Lightbulb },
  { key: "encouraged", label: "Encouraged", icon: Sprout },
] as const;

type ReactionKey = (typeof reactions)[number]["key"];

function getReaderId() {
  const storageKey = "daffodils-reader-id";
  const current = window.localStorage.getItem(storageKey);
  if (current) return current;
  const created = crypto.randomUUID();
  window.localStorage.setItem(storageKey, created);
  return created;
}

export function PostInteractions({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const [readerId, setReaderId] = useState<string>();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => setReaderId(getReaderId()), []);

  const { data: reactionRows = [] } = useQuery({
    queryKey: ["post-reactions", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_reactions")
        .select("client_id,reaction_type")
        .eq("post_id", postId);
      if (error) throw error;
      return data;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id,author_name,body,created_at")
        .eq("post_id", postId)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selected = reactionRows.find((row) => row.client_id === readerId)?.reaction_type;
  const counts = reactionRows.reduce<Record<string, number>>((total, row) => {
    total[row.reaction_type] = (total[row.reaction_type] ?? 0) + 1;
    return total;
  }, {});

  const reactMutation = useMutation({
    mutationFn: async (reactionType: ReactionKey) => {
      if (!readerId) throw new Error("Please try again");
      const { error } = await supabase.from("post_reactions").upsert(
        { post_id: postId, client_id: readerId, reaction_type: reactionType },
        { onConflict: "post_id,client_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["post-reactions", postId] }),
    onError: () => toast.error("Your reaction could not be saved."),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const cleanName = name.trim();
      const cleanComment = comment.trim();
      if (cleanName.length < 2 || cleanComment.length < 2) {
        throw new Error("Please add your name and a comment.");
      }
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        author_name: cleanName,
        body: cleanComment,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setComment("");
      toast.success("Your comment is now live.");
      await queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Your comment could not be added."),
  });

  return (
    <section className="mt-16 border-t border-border pt-10" aria-labelledby="reader-conversation">
      <div>
        <p className="label-caps text-xs text-primary">How did this meet you?</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {reactions.map(({ key, label, icon: Icon }) => {
            const active = selected === key;
            return (
              <Button
                key={key}
                type="button"
                variant={active ? "default" : "outline"}
                className="h-auto min-h-14 flex-col gap-1 py-2"
                disabled={!readerId || reactMutation.isPending}
                onClick={() => reactMutation.mutate(key)}
                aria-pressed={active}
              >
                <Icon aria-hidden="true" />
                <span className="text-xs">{label} · {counts[key] ?? 0}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-14" id="reader-conversation">
        <p className="label-caps text-xs text-primary">Join the conversation</p>
        <h2 className="script-title mt-2 text-4xl">Leave a comment</h2>
        <form
          className="mt-6 space-y-4 border-y border-border bg-cream/45 px-4 py-6 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault();
            commentMutation.mutate();
          }}
        >
          <label className="block">
            <span className="label-caps text-[0.65rem] text-muted-foreground">Your name</span>
            <input
              required
              minLength={2}
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="label-caps text-[0.65rem] text-muted-foreground">Comment</span>
            <textarea
              required
              minLength={2}
              maxLength={1000}
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-2 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <Button type="submit" disabled={commentMutation.isPending}>
            {commentMutation.isPending ? "Posting…" : "Post comment"}
          </Button>
        </form>

        <div className="mt-8 space-y-6">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Be the first to share a thought.</p>
          ) : (
            comments.map((item) => (
              <article key={item.id} className="border-b border-border pb-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{item.author_name}</h3>
                  <time className="label-caps text-[0.6rem] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item.body}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}