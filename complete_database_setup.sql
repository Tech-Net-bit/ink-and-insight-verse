-- Complete Database Setup for TechFlow Web App
-- Run these commands in order in your new Supabase project

-- 1. Create custom types/enums (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'article_type') THEN
        CREATE TYPE article_type AS ENUM ('blog', 'review', 'news', 'tutorial');
    END IF;
END
$$;

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 3. Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 4. Create articles table
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image_url text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  og_image_url text,
  author_id uuid NOT NULL,
  category_id uuid,
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  article_type article_type DEFAULT 'blog'::article_type,
  reading_time integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 5. Create reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 6. Create site_settings table
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'TechFlow'::text,
  site_description text DEFAULT 'Your source for tech news and reviews'::text,
  hero_title text DEFAULT 'The Future of Technology is Here'::text,
  hero_subtitle text DEFAULT 'Discover the latest breakthroughs, in-depth reviews, and expert insights'::text,
  hero_image_url text,
  hero_layout text DEFAULT 'default'::text,
  primary_color text DEFAULT '#000000'::text,
  secondary_color text DEFAULT '#6366f1'::text,
  meta_title text DEFAULT 'TechFlow - Tech News & Reviews'::text,
  meta_description text DEFAULT 'Stay updated with the latest technology news, in-depth reviews, and expert insights'::text,
  meta_keywords text DEFAULT 'technology, tech news, reviews, gadgets, software'::text,
  favicon_url text,
  logo_url text,
  social_facebook text,
  social_twitter text,
  social_linkedin text,
  social_instagram text,
  about_content text,
  about_mission text,
  about_vision text,
  show_default_values boolean DEFAULT true,
  show_default_team boolean DEFAULT true,
  custom_values jsonb DEFAULT '[]'::jsonb,
  custom_team_members jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 7. Create faqs table
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- 8. Create sql_templates table
CREATE TABLE public.sql_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sql_query text NOT NULL,
  category text DEFAULT 'general'::text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 9. Create usage_limits table
CREATE TABLE public.usage_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  total_articles integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_storage_mb numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 10. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- Articles policies
CREATE POLICY "Anyone can view published articles" ON public.articles
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can manage all articles" ON public.articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Site settings policies
CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- FAQs policies
CREATE POLICY "Allow public read access to FAQs" ON public.faqs
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to FAQs" ON public.faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- 12. Create Functions

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Function to update usage statistics
CREATE OR REPLACE FUNCTION public.update_usage_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.usage_limits SET
    total_articles = (SELECT COUNT(*) FROM public.articles),
    total_users = (SELECT COUNT(*) FROM public.profiles),
    total_comments = (SELECT COUNT(*) FROM public.reviews),
    total_storage_mb = COALESCE((
      SELECT SUM(metadata->>'size')::numeric / (1024*1024) 
      FROM storage.objects 
      WHERE bucket_id = 'article-images'
    ), 0),
    last_updated = now()
  WHERE id = (SELECT id FROM public.usage_limits LIMIT 1);
END;
$$;

-- 13. Create Triggers

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true);

-- 15. Create Storage Policies

-- Policies for article-images bucket
CREATE POLICY "Public Access for article images" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update article images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete article images" ON storage.objects
  FOR DELETE USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');

-- Policies for site-images bucket
CREATE POLICY "Public Access for site images" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-images');

CREATE POLICY "Authenticated users can upload site images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update site images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete site images" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- 16. Insert default data

-- Insert default site settings
INSERT INTO public.site_settings (id) VALUES (gen_random_uuid());

-- Insert default usage limits record
INSERT INTO public.usage_limits (id) VALUES (gen_random_uuid());

-- Insert some sample SQL templates
INSERT INTO public.sql_templates (name, description, sql_query, category) VALUES 
('Get all published articles', 'Retrieve all published articles with basic info', 'SELECT id, title, slug, created_at FROM articles WHERE published = true ORDER BY created_at DESC;', 'articles'),
('Get article stats', 'Get count of articles by status', 'SELECT published, COUNT(*) as count FROM articles GROUP BY published;', 'articles'),
('Get user profiles', 'Get all user profiles', 'SELECT id, full_name, email, role, created_at FROM profiles ORDER BY created_at DESC;', 'users'),
('Get reviews with ratings', 'Get all reviews with article titles', 'SELECT r.*, a.title as article_title FROM reviews r JOIN articles a ON r.article_id = a.id ORDER BY r.created_at DESC;', 'reviews'),
('Storage usage by bucket', 'Get storage usage statistics', 'SELECT bucket_id, COUNT(*) as file_count, SUM((metadata->>''size'')::bigint) as total_size FROM storage.objects GROUP BY bucket_id;', 'storage');

-- Optional: Insert sample categories
INSERT INTO public.categories (name, slug, description) VALUES 
('Technology', 'technology', 'Latest technology news and trends'),
('Reviews', 'reviews', 'In-depth product reviews'),
('Tutorials', 'tutorials', 'Step-by-step guides and tutorials'),
('News', 'news', 'Breaking tech news and announcements');

-- 17. Create indexes for better performance
CREATE INDEX idx_articles_published ON public.articles(published);
CREATE INDEX idx_articles_featured ON public.articles(featured);
CREATE INDEX idx_articles_category ON public.articles(category_id);
CREATE INDEX idx_articles_author ON public.articles(author_id);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_reviews_article ON public.reviews(article_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- Setup complete!
-- Remember to set up authentication providers in your Supabase dashboard
-- and configure your environment variables in your application.