
import { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count?: number;
}

// Create context for category filtering
const CategoryContext = createContext<{
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}>({
  activeCategory: 'all',
  setActiveCategory: () => {},
});

export const useCategoryFilter = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCategory, setActiveCategory } = useCategoryFilter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description
        `)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      // Get article counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('published', true);

          return {
            ...category,
            article_count: count || 0,
          };
        })
      );

      // Get total article count for "All"
      const { count: totalCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

      // Add "All" category at the beginning
      const allCategories = [
        { id: 'all', name: 'All', slug: 'all', description: 'All articles', article_count: totalCount || 0 },
        ...categoriesWithCounts,
      ];

      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Create dynamic category grid based on real categories
  const categoryGrid = categories.filter(cat => cat.id !== 'all').map((category, index) => {
    const icons = ['💻', '🤖', '📱', '🎮', '🔧', '🌐', '📊', '🔒'];
    return {
      icon: icons[index % icons.length],
      title: category.name,
      desc: category.description || 'Explore articles',
      slug: category.slug,
      count: category.article_count || 0
    };
  });

  return (
    <section className="py-12 bg-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Explore by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dive deep into your areas of interest with our carefully curated content categories
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.slug ? "default" : "outline"}
              className={`hover:scale-105 transition-all duration-200 ${
                activeCategory === category.slug
                  ? "shadow-lg" 
                  : "hover:bg-accent hover:border-primary/20"
              }`}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.name}
              <Badge 
                variant="secondary" 
                className={`ml-2 ${
                  activeCategory === category.slug
                    ? "bg-primary-foreground text-primary" 
                    : "bg-muted"
                }`}
              >
                {category.article_count}
              </Badge>
            </Button>
          ))}
        </div>

        {categoryGrid.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categoryGrid.map((item) => (
              <div
                key={item.title}
                className={`text-center p-6 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 group cursor-pointer ${
                  activeCategory === item.slug ? 'border-primary shadow-lg' : ''
                }`}
                onClick={() => setActiveCategory(item.slug)}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors duration-200">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                <Badge variant="outline" className="text-xs">
                  {item.count} articles
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
