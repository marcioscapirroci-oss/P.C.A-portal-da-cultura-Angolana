ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles (lower(category));
CREATE INDEX IF NOT EXISTS articles_status_published_idx ON public.articles (status, published_at DESC);