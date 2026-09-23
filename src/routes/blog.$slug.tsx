import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, LinkIcon } from "lucide-react";

import { getPost } from "@/lib/posts.functions";
import { SiteShell } from "@/components/site-chrome";
import { PostInteractions } from "@/components/post-interactions";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: () => getPost({ data: { slug } }),
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — Daffodils Nexus Hub" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${loaderData.title} — The Wholesome Blog` },
        { name: "description", content: loaderData.excerpt },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData.cover_image_url
          ? [
              { property: "og:image", content: loaderData.cover_image_url },
              { name: "twitter:image", content: loaderData.cover_image_url },
            ]
          : []),
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="script-title text-4xl">Post not found</h1>
        <Link to="/" className="label-caps mt-6 inline-block text-xs text-primary">
          Back to the blog
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <p className="py-24 text-center text-muted-foreground">This post could not be loaded.</p>
    </SiteShell>
  ),
  component: PostPage,
});

type PostLink = { label?: string; url?: string };

function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function PostPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  if (!data) return null;
  const links = (Array.isArray(data.links) ? data.links : []) as PostLink[];
  const embed = data.video_url ? embedUrl(data.video_url) : null;

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="label-caps inline-flex items-center gap-2 text-xs text-primary">
          <ArrowLeft className="h-3 w-3" /> All articles
        </Link>
        <p className="label-caps mt-8 text-xs text-primary">{data.category}</p>
        <h1 className="script-title mt-2 text-5xl md:text-6xl">{data.title}</h1>
        <div className="label-caps mt-4 flex flex-wrap items-center gap-4 text-[0.65rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(data.published_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {data.read_minutes} min read
          </span>
        </div>

        {data.cover_image_url ? (
          <div className="mt-10 flex max-h-[42rem] min-h-64 items-center justify-center overflow-hidden rounded-lg border border-border bg-cream/50 p-2">
            <img
              src={data.cover_image_url}
              alt={data.title}
              className="max-h-[40rem] w-full object-contain"
            />
          </div>
        ) : null}

        <div className="prose-wholesome mt-10 text-base leading-relaxed">
          {data.content.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {data.video_url ? (
          <div className="mt-10">
            {embed ? (
              <iframe
                src={embed}
                title={`${data.title} video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full rounded-lg border border-border"
              />
            ) : (
              <video src={data.video_url} controls className="w-full rounded-lg" />
            )}
          </div>
        ) : null}

        {links.length > 0 ? (
          <div className="mt-12 rounded-lg border border-border bg-cream p-6">
            <p className="label-caps text-xs text-primary">Links &amp; resources</p>
            <ul className="mt-4 space-y-2">
              {links.map((l, i) => (
                <li key={i}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    <LinkIcon className="h-3 w-3" /> {l.label || l.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <PostInteractions postId={data.id} />
      </article>
    </SiteShell>
  );
}
