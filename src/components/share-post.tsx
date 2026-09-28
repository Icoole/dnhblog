import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Facebook, Linkedin, MessageCircle, Share2, Twitter } from "lucide-react";

export function SharePost({ title, slug }: { title: string; slug: string }) {
  const [url, setUrl] = useState(`https://dnhblog.lovable.app/blog/${slug}`);
  const [canNative, setCanNative] = useState(false);
  useEffect(() => {
    setUrl(`${window.location.origin}/blog/${slug}`);
    setCanNative(typeof navigator.share === "function");
  }, [slug]);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${t}%20${u}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];
  const btn =
    "label-caps inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[0.65rem] hover:border-primary hover:text-primary";

  return (
    <section className="mt-12 rounded-lg border border-border bg-cream/50 p-5">
      <p className="label-caps text-xs text-primary">Share this post</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {canNative ? (
          <button className={btn} onClick={() => void navigator.share({ title, url }).catch(() => {})}>
            <Share2 className="h-3 w-3" /> Share
          </button>
        ) : null}
        {links.map(({ label, icon: Icon, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={btn}>
            <Icon className="h-3 w-3" /> {label}
          </a>
        ))}
        <button
          className={btn}
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
          }}
        >
          <Copy className="h-3 w-3" /> Copy link
        </button>
      </div>
    </section>
  );
}
