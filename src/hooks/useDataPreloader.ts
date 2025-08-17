
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePerformanceOptimization } from './usePerformanceOptimization';

interface PreloadOptions {
  preloadFeatured?: boolean;
  preloadCategories?: boolean;
  preloadSettings?: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  featured_image_url: string;
  slug: string;
  created_at: string;
  article_type?: string;
  categories: { name: string } | null;
  profiles: { full_name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  favicon_url: string;
  logo_url: string;
  social_twitter: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
  about_content?: string;
  about_mission?: string;
  about_vision?: string;
  custom_values?: any[];
  custom_team_members?: any[];
  show_default_values?: boolean;
  show_default_team?: boolean;
}

export const useDataPreloader = (options: PreloadOptions = {}) => {
  const queryClient = useQueryClient();
  const { cacheData, getCachedData } = usePerformanceOptimization();

  // Preload featured articles with aggressive caching
  const { data: featuredArticles, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-articles-preload'],
    queryFn: async (): Promise<Article[]> => {
      const cached = getCachedData<Article[]>('featured-articles');
      if (cached) return cached;

      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          featured_image_url,
          slug,
          created_at,
          categories (name),
          profiles (full_name)
        `)
        .eq('published', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      const articles = data || [];
      cacheData('featured-articles', articles, 60 * 60 * 1000); // 1 hour cache
      return articles;
    },
    enabled: options.preloadFeatured !== false,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Preload all articles for instant navigation
  const { data: allArticles } = useQuery({
    queryKey: ['all-articles-preload'],
    queryFn: async (): Promise<Article[]> => {
      const cached = getCachedData<Article[]>('all-articles');
      if (cached) return cached;

      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          featured_image_url,
          slug,
          created_at,
          categories (name),
          profiles (full_name)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const articles = data || [];
      cacheData('all-articles', articles, 30 * 60 * 1000); // 30 min cache
      return articles;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  // Preload categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-preload'],
    queryFn: async (): Promise<Category[]> => {
      const cached = getCachedData<Category[]>('categories');
      if (cached) return cached;

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      
      const categoryData = data || [];
      cacheData('categories', categoryData, 60 * 60 * 1000); // 1 hour cache
      return categoryData;
    },
    enabled: options.preloadCategories !== false,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Preload site settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['site-settings-preload'],
    queryFn: async (): Promise<SiteSettings | null> => {
      const cached = getCachedData<SiteSettings>('site-settings');
      if (cached) return cached;

      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Handle JSON data properly
        const typedSettings: SiteSettings = {
          ...data,
          custom_values: Array.isArray(data.custom_values) ? data.custom_values : [],
          custom_team_members: Array.isArray(data.custom_team_members) ? data.custom_team_members : [],
        };
        cacheData('site-settings', typedSettings, 60 * 60 * 1000); // 1 hour cache
        return typedSettings;
      }
      return null;
    },
    enabled: options.preloadSettings !== false,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Preload critical images immediately
  useEffect(() => {
    const preloadImages = async () => {
      const imagesToPreload = [];
      
      if (featuredArticles && Array.isArray(featuredArticles)) {
        featuredArticles.forEach((article: Article) => {
          if (article.featured_image_url) {
            imagesToPreload.push(article.featured_image_url);
          }
        });
      }

      if (allArticles && Array.isArray(allArticles)) {
        allArticles.slice(0, 10).forEach((article: Article) => {
          if (article.featured_image_url) {
            imagesToPreload.push(article.featured_image_url);
          }
        });
      }

      // Preload images in background
      imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };

    if (!featuredLoading && !categoriesLoading && !settingsLoading) {
      preloadImages();
    }
  }, [featuredArticles, allArticles, featuredLoading, categoriesLoading, settingsLoading]);

  return {
    featuredArticles: featuredArticles || [],
    allArticles: allArticles || [],
    categories: categories || [],
    settings,
    isPreloading: featuredLoading || categoriesLoading || settingsLoading,
  };
};
