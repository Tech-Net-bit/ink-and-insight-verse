
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReviewSystem from '@/components/ReviewSystem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ArrowLeft, Star } from 'lucide-react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  slug: string;
  created_at: string;
  reading_time: number;
  meta_title: string;
  meta_description: string;
  article_type: string;
  categories: { name: string };
  profiles: { full_name: string };
}

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const { cacheData, getCachedData } = usePerformanceOptimization();

  useEffect(() => {
    if (slug) {
      fetchArticle();
      fetchAverageRating();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      // Check cache first for instant loading
      const cacheKey = `article-${slug}`;
      const cached = getCachedData<Article>(cacheKey);
      
      if (cached) {
        setArticle(cached);
        setLoading(false);
        // Still fetch fresh data in background
        fetchFreshArticle();
        return;
      }

      await fetchFreshArticle();
    } catch (error) {
      console.error('Error fetching article:', error);
      setLoading(false);
    }
  };

  const fetchFreshArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          categories (name),
          profiles (full_name)
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;
      
      // Cache for 1 hour
      const cacheKey = `article-${slug}`;
      cacheData(cacheKey, data, 60 * 60 * 1000);
      
      setArticle(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fresh article:', error);
      setLoading(false);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const cacheKey = `rating-${slug}`;
      const cached = getCachedData<number>(cacheKey);
      
      if (cached) {
        setAverageRating(cached);
        return;
      }

      const { data: articleData } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single();

      if (articleData) {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('article_id', articleData.id);

        if (!error && data && data.length > 0) {
          const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
          const roundedAvg = Math.round(avg * 10) / 10;
          setAverageRating(roundedAvg);
          // Cache rating for 30 minutes
          cacheData(cacheKey, roundedAvg, 30 * 60 * 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching average rating:', error);
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'product_review': return 'default';
      case 'news': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product_review': return 'Product Review';
      case 'news': return 'News';
      default: return 'Blog Post';
    }
  };

  // Show cached content immediately
  if (loading && !article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article && !loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" asChild className="mb-4">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Articles
                </Link>
              </Button>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant={getBadgeVariant(article.article_type)}>
                  {getTypeLabel(article.article_type)}
                </Badge>
                <Badge variant="outline">
                  {article.categories?.name}
                </Badge>
                {averageRating && (
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{averageRating}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>

              <div className="flex items-center gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{article.profiles?.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{article.reading_time || 5} min read</span>
                </div>
              </div>

              {article.featured_image_url && (
                <div className="mb-8">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-96 object-cover rounded-xl"
                  />
                </div>
              )}
            </div>

            <div 
              className="prose prose-lg max-w-none mb-12" 
              dangerouslySetInnerHTML={{ __html: article.content }} 
            />

            <div className="border-t pt-8">
              <ReviewSystem articleId={article.id} />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetail;
