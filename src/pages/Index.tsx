
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Categories, { CategoryProvider } from '@/components/Categories';
import ArticleGrid from '@/components/ArticleGrid';
import Footer from '@/components/Footer';

// New Newsletter section component
const Newsletter = () => {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest tech insights, reviews, and trends delivered directly to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <CategoryProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Hero />
          <Categories />
          <ArticleGrid />
          <Newsletter />
        </main>
        <Footer />
      </div>
    </CategoryProvider>
  );
};

export default Index;
