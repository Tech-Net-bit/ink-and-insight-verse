
import { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import { supabase } from '@/integrations/supabase/client';
import OptimizedImage from './OptimizedImage';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useDataPreloader } from '@/hooks/useDataPreloader';
import { useCategoryFilter } from './Categories';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  featured_image_url: string;
  slug: string;
  created_at: string;
  article_type?: string;
  category_id: string | null;
  categories: { name: string; slug: string } | null;
  profiles: { full_name: string };
}

const ArticleGrid = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { cacheData, getCachedData, checkRateLimit } = usePerformanceOptimization();
  const { allArticles, isPreloading } = useDataPreloader();
  const { activeCategory } = useCategoryFilter();

  useEffect(() => {
    // Use preloaded data if available and ensure article_type is present
    if (allArticles && allArticles.length > 0) {
      const typedArticles = allArticles.map(article => ({
        ...article,
        article_type: article.article_type || 'blog',
        category_id: null, // Set default since preloaded data doesn't have this
        categories: article.categories ? { ...article.categories, slug: article.categories.name.toLowerCase().replace(/\s+/g, '-') } : null
      }));
      setArticles(typedArticles);
      setLoading(false);
      setHasMore(allArticles.length >= 6);
    } else {
      fetchArticles();
    }
  }, [allArticles]);

  // Filter articles based on active category
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => 
        article.categories?.slug === activeCategory || 
        article.category_id === activeCategory
      );
      setFilteredArticles(filtered);
    }
  }, [articles, activeCategory]);

  const fetchArticles = async (pageNum = 1) => {
    if (!checkRateLimit('articles-fetch')) {
      console.warn('Rate limit exceeded for articles fetch');
      return;
    }

    setLoading(pageNum === 1);

    try {
      const cacheKey = `articles-page-${pageNum}`;
      const cached = getCachedData<Article[]>(cacheKey);
      
      if (cached && Array.isArray(cached)) {
        if (pageNum === 1) {
          setArticles(cached);
        } else {
          setArticles(prev => [...prev, ...cached]);
        }
        setLoading(false);
        return;
      }

      const limit = 6;
      const offset = (pageNum - 1) * limit;

      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          featured_image_url,
          slug,
          created_at,
          article_type,
          category_id,
          categories (name, slug),
          profiles (full_name)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching articles:', error);
        return;
      }

      const articleData = (data || []).map(article => ({
        ...article,
        article_type: article.article_type || 'blog'
      }));
      
      // Cache the result for 1 hour
      cacheData(cacheKey, articleData, 60 * 60 * 1000);

      if (pageNum === 1) {
        setArticles(articleData);
      } else {
        setArticles(prev => [...prev, ...articleData]);
      }

      setHasMore(articleData.length === limit);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage);
  };

  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content ? content.split(' ').length : 0;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minutes ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} days ago`;
    }
  };

  // Show cached content immediately if available
  if ((loading && articles.length === 0) || isPreloading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Latest Stories</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest technology news, in-depth reviews, and expert insights
          </p>
        </div>

        {filteredArticles.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No articles found. Check back later for new content!
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt || ''}
                  category={article.categories?.name || 'Uncategorized'}
                  readTime={`${getReadTime(article.excerpt || '')} min read`}
                  publishedAt={getRelativeTime(article.created_at)}
                  imageUrl={article.featured_image_url || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80'}
                  type={article.article_type === 'product_review' ? 'review' : article.article_type === 'news' ? 'news' : 'blog'}
                  articleId={article.id}
                  slug={article.slug}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 hover:scale-105 transform disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Articles'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ArticleGrid;
