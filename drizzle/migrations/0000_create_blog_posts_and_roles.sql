CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'Reflections',
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  video_url text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_minutes integer NOT NULL DEFAULT 4,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  author_id uuid,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are public" ON public.posts FOR SELECT TO anon USING (published = true);
CREATE POLICY "Authenticated can read published posts" ON public.posts FOR SELECT TO authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update posts" ON public.posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete posts" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER posts_set_updated_at BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- First signed-up user becomes admin, so the blog owner can start posting.
CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_grant_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

INSERT INTO public.posts (title, slug, category, excerpt, content, read_minutes, featured, published_at) VALUES
('The Seed', 'the-seed', 'Capacity', 'If life feels quiet right now, breathe.', E'If life feels quiet right now, breathe.\n\nSeasons of stillness are not seasons of waste. The seed does its most important work underground, where no one claps and nothing looks like progress.\n\nStay planted. Stay watered. The harvest is a matter of time, not of noise.', 4, true, '2026-08-08'),
('The Five Pillars of Wholeness', 'five-pillars-of-wholeness', 'Wholeness', 'How spiritual, emotional, physical, social, and professional growth work together to shape a balanced, purpose-filled life.', E'Wholeness is not a single achievement — it is five quiet disciplines held together.\n\nSpiritual. Emotional. Physical. Social. Professional. Neglect one and the others begin to strain.', 6, false, '2026-07-20'),
('Leading With Purpose in a Noisy World', 'leading-with-purpose', 'Leadership', 'Practical reflections on cultivating clarity, conviction, and calm leadership when everything competes for your attention.', E'Clarity is a leadership discipline. Conviction is a daily choice. Calm is a gift you give your team.', 5, false, '2026-07-06'),
('Faith at Work: Bringing Your Whole Self', 'faith-at-work', 'Faith', 'Why integrating faith and professional life is the foundation for integrity, resilience, and meaningful impact.', E'You do not leave your convictions at the office door. Integrity travels with you.', 7, false, '2026-06-22'),
('Building Capacity That Lasts', 'building-capacity-that-lasts', 'Capacity Building', 'What it really takes to move from one-off training days to institutions that keep learning long after we leave.', E'A workshop changes a week. A system changes a decade.', 6, false, '2026-06-08'),
('Women Rising: The Case for Quiet Leadership', 'women-rising', 'Leadership', 'Not every rise is loud. Some of the most transformative women leaders lead through steady presence, deep listening, and precise action.', E'Presence. Listening. Precision. These are not soft skills — they are the hardest ones to master.', 5, false, '2026-05-25');