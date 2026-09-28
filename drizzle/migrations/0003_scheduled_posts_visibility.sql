DROP POLICY IF EXISTS "Published posts are public" ON public.posts;
CREATE POLICY "Published posts are public" ON public.posts FOR SELECT TO anon USING (published = true AND published_at <= now());
DROP POLICY IF EXISTS "Authenticated can read published posts" ON public.posts;
CREATE POLICY "Authenticated can read published posts" ON public.posts FOR SELECT TO authenticated USING ((published = true AND published_at <= now()) OR public.has_role(auth.uid(), 'admin'::app_role));