import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload, Plus, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-chrome";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Write a post — Daffodils Nexus Hub Blog" },
      { name: "description", content: "Create and manage posts on The Wholesome Blog." },
      { property: "og:title", content: "Write a post — Daffodils Nexus Hub Blog" },
      { property: "og:description", content: "Admin area for The Wholesome Blog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelClass = "label-caps text-[0.65rem] text-muted-foreground";

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      return Boolean(data);
    },
  });

  const { data: posts, refetch } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(isAdmin),
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Reflections");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [readMinutes, setReadMinutes] = useState(4);
  const [featured, setFeatured] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [saving, setSaving] = useState(false);

  async function uploadFile(file: File, kind: "image" | "video") {
    setUploading(kind);
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("blog-media").upload(path, file);
      if (error) throw error;
      const { data, error: signError } = await supabase.storage
        .from("blog-media")
        .createSignedUrl(path, TEN_YEARS);
      if (signError || !data) throw signError ?? new Error("Could not create link");
      if (kind === "image") setCoverUrl(data.signedUrl);
      else setVideoUrl(data.signedUrl);
      toast.success(kind === "image" ? "Image uploaded" : "Video uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function savePost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("posts").insert({
        title,
        slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
        category,
        excerpt,
        content,
        read_minutes: readMinutes,
        featured,
        cover_image_url: coverUrl || null,
        video_url: videoUrl || null,
        links: links.filter((l) => l.url),
        author_id: userData.user?.id ?? null,
      });
      if (error) throw error;
      if (featured) {
        await supabase.from("posts").update({ featured: false }).neq("title", title);
        await supabase.from("posts").update({ featured: true }).eq("title", title);
      }
      toast.success("Post published");
      setTitle("");
      setExcerpt("");
      setContent("");
      setCoverUrl("");
      setVideoUrl("");
      setLinks([]);
      setFeatured(false);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the post");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
  }

  if (checkingRole) {
    return (
      <SiteShell>
        <p className="py-24 text-center text-muted-foreground">Loading…</p>
      </SiteShell>
    );
  }

  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="script-title text-4xl">No admin access</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This account is signed in but is not a blog admin.
          </p>
          <Link to="/" className="label-caps mt-6 inline-block text-xs text-primary">
            Back to the blog
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-caps text-xs text-primary">Blog admin</p>
            <h1 className="script-title mt-2 text-5xl">Write a post</h1>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="label-caps rounded-md border border-border px-3 py-2 text-[0.65rem]"
          >
            Sign out
          </button>
        </div>

        <form onSubmit={savePost} className="mt-10 space-y-5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Read time (minutes)</label>
              <input
                type="number"
                min={1}
                value={readMinutes}
                onChange={(e) => setReadMinutes(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Short summary</label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Article</label>
            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputClass}
              placeholder="Leave a blank line between paragraphs."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Cover image</label>
              <div className="mt-2 flex items-center gap-3">
                <label className="label-caps inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-[0.65rem]">
                  <Upload className="h-3 w-3" />
                  {uploading === "image" ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadFile(f, "image");
                    }}
                  />
                </label>
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover preview" className="h-12 w-16 rounded object-cover" />
                ) : null}
              </div>
              <input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="…or paste an image link"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Video</label>
              <div className="mt-2 flex items-center gap-3">
                <label className="label-caps inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-[0.65rem]">
                  <Upload className="h-3 w-3" />
                  {uploading === "video" ? "Uploading…" : "Upload video"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadFile(f, "video");
                    }}
                  />
                </label>
              </div>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="…or paste a YouTube / Vimeo link"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Links</label>
            <div className="mt-2 space-y-2">
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={l.label}
                    placeholder="Label"
                    onChange={(e) =>
                      setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                    className="w-1/3 rounded-md border border-input bg-card px-3 py-2 text-sm"
                  />
                  <input
                    value={l.url}
                    placeholder="https://"
                    onChange={(e) =>
                      setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                    }
                    className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    className="rounded-md border border-border px-2"
                    aria-label="Remove link"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks([...links, { label: "", url: "" }])}
                className="label-caps inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[0.65rem]"
              >
                <Plus className="h-3 w-3" /> Add link
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Show this post as the featured story
          </label>

          <button
            type="submit"
            disabled={saving}
            className="label-caps rounded-md bg-primary px-6 py-3 text-xs text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish post"}
          </button>
        </form>

        <div className="mt-16">
          <h2 className="label-caps text-xs text-primary">Your posts</h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {(posts ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.published_at).toLocaleDateString()} · {p.category}
                  </p>
                </div>
                <button
                  onClick={() => void deletePost(p.id)}
                  className="rounded-md border border-border p-2 text-destructive"
                  aria-label={`Delete ${p.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SiteShell>
  );
}
