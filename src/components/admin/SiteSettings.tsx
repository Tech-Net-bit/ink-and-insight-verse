
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import ValuesTeamManager from './ValuesTeamManager';

const SiteSettings = () => {
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useSiteSettings();
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings(formData);
      toast({
        title: 'Success',
        description: 'Site settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update site settings',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground">Manage your website configuration and appearance</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Configure your site's basic details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={formData?.site_name || ''}
                      onChange={(e) => handleInputChange('site_name', e.target.value)}
                      placeholder="Enter site name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_description">Site Description</Label>
                    <Textarea
                      id="site_description"
                      value={formData?.site_description || ''}
                      onChange={(e) => handleInputChange('site_description', e.target.value)}
                      placeholder="Enter site description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                  <CardDescription>Connect your social media accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="social_twitter">Twitter</Label>
                    <Input
                      id="social_twitter"
                      value={formData?.social_twitter || ''}
                      onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social_facebook">Facebook</Label>
                    <Input
                      id="social_facebook"
                      value={formData?.social_facebook || ''}
                      onChange={(e) => handleInputChange('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Configure your homepage hero section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={formData?.hero_title || ''}
                    onChange={(e) => handleInputChange('hero_title', e.target.value)}
                    placeholder="Enter hero title"
                  />
                </div>
                <div>
                  <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="hero_subtitle"
                    value={formData?.hero_subtitle || ''}
                    onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                    placeholder="Enter hero subtitle"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Colors & Theme</CardTitle>
                <CardDescription>Customize your brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData?.primary_color || '#000000'}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData?.primary_color || '#000000'}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData?.secondary_color || '#6366f1'}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData?.secondary_color || '#6366f1'}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About Page Content</CardTitle>
                <CardDescription>Configure your about page content and team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="about_content">About Content</Label>
                  <Textarea
                    id="about_content"
                    value={formData?.about_content || ''}
                    onChange={(e) => handleInputChange('about_content', e.target.value)}
                    placeholder="Enter about page content"
                    rows={5}
                  />
                </div>

                <ValuesTeamManager
                  values={formData?.custom_values || []}
                  teamMembers={formData?.custom_team_members || []}
                  showDefaultValues={formData?.show_default_values ?? true}
                  showDefaultTeam={formData?.show_default_team ?? true}
                  onValuesChange={(values) => handleInputChange('custom_values', values)}
                  onTeamChange={(members) => handleInputChange('custom_team_members', members)}
                  onShowDefaultValuesChange={(show) => handleInputChange('show_default_values', show)}
                  onShowDefaultTeamChange={(show) => handleInputChange('show_default_team', show)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
          <Button type="submit" size="lg">
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
