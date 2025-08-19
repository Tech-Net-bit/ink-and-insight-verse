import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Save, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ArticleTemplates from './ArticleTemplates';
import ImageUpload from './ImageUpload';

// ✅ Import Quill and Better Table
import Quill from 'quill';
import '@/styles/quill-better-table.css'
import QuillBetterTable from 'quill-better-table';
import 'quill-better-table/dist/quill-better-table.css';

// ✅ Register module
Quill.register(
  {
    'modules/better-table': QuillBetterTable,
  },
  true
);

interface ArticleEditorProps {
  articleId?: string | null;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
}

interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category_id: string;
  published: boolean;
  featured: boolean;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string;
  article_type: 'news' | 'product_review' | 'blog';
  reading_time: number;
}

interface Template {
  id: string;
  title: string;
  type: 'blog' | 'news' | 'product_review';
  description: string;
  content: string;
  featured: boolean;
}

const ArticleEditor = ({ articleId, onClose }: ArticleEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showTemplates, setShowTemplates] = useState(!articleId);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'featured' | 'og'>('featured');
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category_id: '',
    published: false,
    featured: false,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_image_url: '',
    article_type: 'blog',
    reading_time: 0,
  });

  // ✅ Quill editor modules configuration with table support
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean'],
      ['table'], // custom placeholder button for table
    ],
    table: true,
    'better-table': {
      operationMenu: {
        items: {
          insertColumnRight: { text: 'Insert column right' },
          insertColumnLeft: { text: 'Insert column left' },
          insertRowAbove: { text: 'Insert row above' },
          insertRowBelow: { text: 'Insert row below' },
          deleteRow: { text: 'Delete row' },
          deleteColumn: { text: 'Delete column' },
          deleteTable: { text: 'Delete table' },
        },
      },
    },
    keyboard: {
      bindings: QuillBetterTable.keyboardBindings,
    },
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'script', 'indent', 'direction',
    'color', 'background', 'align', 'link', 'image', 'video',
    'blockquote', 'code-block', 'table'
  ];

  useEffect(() => {
    fetchCategories();
    if (articleId) {
      fetchArticle();
    }

    // ✅ Add table button manually to toolbar
    const toolbar = document.querySelector('.ql-toolbar');
    if (toolbar && !toolbar.querySelector('.ql-insertTable')) {
      const button = document.createElement('button');
      button.classList.add('ql-insertTable');
      button.innerHTML = 'Table';
      toolbar.appendChild(button);

      button.addEventListener('click', () => {
        const quill = (window as any).quillRef;
        if (quill) {
          quill.getModule('better-table').insertTable(3, 3);
        }
      });
    }
  }, [articleId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  };

  const fetchArticle = async () => {
    if (!articleId) return;

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        featured_image_url: data.featured_image_url || '',
        category_id: data.category_id || '',
        published: data.published || false,
        featured: data.featured || false,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
        og_image_url: data.og_image_url || '',
        article_type: data.article_type || 'blog',
        reading_time: data.reading_time || 0,
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch article',
        variant: 'destructive',
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const handleContentChange = (content: string) => {
    const readingTime = calculateReadingTime(content);
    setFormData(prev => ({
      ...prev,
      content,
      reading_time: readingTime,
    }));
  };

  const handleTemplateSelect = (template: Template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      slug: generateSlug(template.title),
      content: template.content,
      article_type: template.type,
      meta_title: template.title,
      reading_time: calculateReadingTime(template.content),
    }));
    setShowTemplates(false);
  };

  const openImageUpload = (field: 'featured' | 'og') => {
    setCurrentImageField(field);
    setShowImageUpload(true);
  };

  const handleImageUpload = (url: string) => {
    if (currentImageField === 'featured') {
      setFormData(prev => ({ ...prev, featured_image_url: url }));
    } else {
      setFormData(prev => ({ ...prev, og_image_url: url }));
    }
    setShowImageUpload(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create articles',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Content is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt?.trim() || null,
        content: formData.content.trim(),
        featured_image_url: formData.featured_image_url?.trim() || null,
        category_id: formData.category_id || null,
        published: formData.published,
        featured: formData.featured,
        meta_title: formData.meta_title?.trim() || null,
        meta_description: formData.meta_description?.trim() || null,
        meta_keywords: formData.meta_keywords?.trim() || null,
        og_image_url: formData.og_image_url?.trim() || null,
        article_type: formData.article_type,
        reading_time: formData.reading_time,
        author_id: user.id,
        updated_at: new Date().toISOString(),
      };

      console.log('Submitting article data:', articleData);

      if (articleId) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', articleId);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({
          title: 'Success',
          description: 'Article updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast({
          title: 'Success',
          description: 'Article created successfully',
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save article',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (showTemplates) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setShowTemplates(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
        </div>
        <ArticleTemplates onSelectTemplate={handleTemplateSelect} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {articleId ? 'Edit Article' : 'Create Article'}
            </h1>
            <p className="text-muted-foreground">
              {articleId ? 'Update your article' : 'Write a new blog post'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowTemplates(true)} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Browse Templates
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
                <CardDescription>Write your article content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter article title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="article-slug"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="article_type">Article Type</Label>
                  <Select value={formData.article_type} onValueChange={(value: 'news' | 'product_review' | 'blog') => setFormData(prev => ({ ...prev, article_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select article type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="news">News Article</SelectItem>
                      <SelectItem value="product_review">Product Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the article"
                    rows={3}
                  />
                </div>


                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <div className="min-h-[400px]">
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={handleContentChange}
                      modules={modules}
                      formats={formats}
                      placeholder="Write your article content here..."
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Estimated reading time: {formData.reading_time} minute(s)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Dialog open={showImageUpload && currentImageField === 'featured'} onOpenChange={(open) => !open && setShowImageUpload(false)}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openImageUpload('featured')}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <ImageUpload
                          value={formData.featured_image_url}
                          onChange={handleImageUpload}
                          onClose={() => setShowImageUpload(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Meta Tags</CardTitle>
                <CardDescription>Optimize your article for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO optimized title"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500">{formData.meta_title.length}/60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO meta description"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500">{formData.meta_description.length}/160 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Open Graph Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.og_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, og_image_url: e.target.value }))}
                      placeholder="https://example.com/og-image.jpg"
                    />
                    <Dialog open={showImageUpload && currentImageField === 'og'} onOpenChange={(open) => !open && setShowImageUpload(false)}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openImageUpload('og')}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <ImageUpload
                          value={formData.og_image_url}
                          onChange={handleImageUpload}
                          onClose={() => setShowImageUpload(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Settings</CardTitle>
                <CardDescription>Configure article visibility and category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Article'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
