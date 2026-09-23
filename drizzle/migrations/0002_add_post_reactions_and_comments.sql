CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  client_id text NOT NULL CHECK (char_length(client_id) BETWEEN 16 AND 100),
  reaction_type text NOT NULL CHECK (reaction_type IN ('inspired', 'love', 'insightful', 'encouraged')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, client_id)
);

GRANT SELECT, INSERT, UPDATE ON public.post_reactions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post reactions"
ON public.post_reactions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can add a post reaction"
ON public.post_reactions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can change a post reaction"
ON public.post_reactions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER post_reactions_set_updated_at
BEFORE UPDATE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX post_reactions_post_id_idx ON public.post_reactions(post_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(btrim(author_name)) BETWEEN 2 AND 60),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 2 AND 1000),
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.post_comments TO anon;
GRANT SELECT, INSERT ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved comments"
ON public.post_comments FOR SELECT
TO anon, authenticated
USING (approved = true);

CREATE POLICY "Anyone can leave a comment"
ON public.post_comments FOR INSERT
TO anon, authenticated
WITH CHECK (approved = true);

CREATE INDEX post_comments_post_id_created_at_idx
ON public.post_comments(post_id, created_at DESC);