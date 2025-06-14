
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ArticleCard from './ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  published: boolean;
  created_at: string;
  reading_time: number | null;
  category: {
    name: string;
    slug: string;
  } | null;
  author: {
    full_name: string;
  } | null;
}

interface ArticleGridProps {
  featured?: boolean;
  categorySlug?: string;
  limit?: number;
}

const ArticleGrid = ({ featured = false, categorySlug, limit }: ArticleGridProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [featured, categorySlug, limit]);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          published,
          created_at,
          reading_time,
          category:categories(name, slug),
          author:profiles(full_name)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (featured) {
        query = query.eq('featured', true);
      }

      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No articles found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          id={article.id}
          title={article.title}
          slug={article.slug}
          excerpt={article.excerpt}
          featuredImage={article.featured_image_url}
          createdAt={article.created_at}
          readingTime={article.reading_time}
          category={article.category}
          author={article.author}
        />
      ))}
    </div>
  );
};

export default ArticleGrid;
