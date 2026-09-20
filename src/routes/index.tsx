import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Clock, ArrowRight } from "lucide-react";

import { listPosts, type BlogPost } from "@/lib/posts.functions";
import { SiteShell } from "@/components/site-chrome";

const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: () => listPosts(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () => ({
    meta: [
      { title: "The Wholesome Blog — Daffodils Nexus Hub" },
      {
        name: "description",
        content:
          "Reflections on leadership, faith, wholeness, and purposeful living from Daffodils Nexus Hub.",
      },
      { property: "og:title", content: "The Wholesome Blog — Daffodils Nexus Hub" },
      {
        property: "og:description",
        content: "Writings on leadership, faith, wholeness, and building a purposeful life.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <SiteShell>
      <p className="py-24 text-center text-muted-foreground">The blog could not be loaded.</p>
    </SiteShell>
  ),
  component: BlogIndex,
});

function formatDate(value: string) {
  return new Date(value)
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}

function CoverImage({ post, className }: { post: BlogPost; className?: string }) {
  if (!post.cover_image_url) {
    return <div className={`bg-gold-soft/40 ${className ?? ""}`} />;
  }
  return (
    <img
      src={post.cover_image_url}
      alt={post.title}
      className={`object-cover ${className ?? ""}`}
      loading="lazy"
    />
  );
}

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <SiteShell>
      <section className="bg-cream py-20 text-center">
        <p className="label-caps text-xs text-primary">The Wholesome Blog</p>
        <h1 className="script-title mt-3 text-6xl md:text-7xl">Reflections &amp; Insights</h1>
        <p className="mx-auto mt-5 max-w-xl px-6 text-muted-foreground">
          Writings on leadership, faith, wholeness, and the quiet work of building a purposeful
          life.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {!featured ? (
          <p className="py-16 text-center text-muted-foreground">
            No posts yet. Add the first one from the admin page.
          </p>
        ) : (
          <article className="grid overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-cols-2">
            <div className="relative min-h-64">
              <CoverImage post={featured} className="h-full w-full absolute inset-0" />
              <span className="label-caps absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[0.6rem] text-primary-foreground">
                Featured
              </span>
            </div>
            <div className="flex flex-col justify-center p-10">
              <div className="label-caps flex flex-wrap items-center gap-4 text-[0.65rem] text-muted-foreground">
                <span className="text-primary">{featured.category}</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDate(featured.published_at)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {featured.read_minutes} min read
                </span>
              </div>
              <h2 className="script-title mt-4 text-5xl">{featured.title}</h2>
              <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
              <Link
                to="/blog/$slug"
                params={{ slug: featured.slug }}
                className="label-caps mt-6 inline-flex items-center gap-2 text-xs text-primary"
              >
                Read article <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </article>
        )}

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <article
              key={post.id}
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative h-48">
                <CoverImage post={post} className="h-full w-full absolute inset-0" />
                <span className="label-caps absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[0.6rem] text-primary-foreground">
                  {post.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="label-caps flex items-center gap-3 text-[0.65rem] text-muted-foreground">
                  <span>{formatDate(post.published_at)}</span>
                  <span>•</span>
                  <span>{post.read_minutes} min read</span>
                </div>
                <h3 className="script-title mt-3 text-3xl">{post.title}</h3>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="label-caps mt-5 inline-flex items-center gap-2 text-xs text-primary"
                >
                  Read more <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
