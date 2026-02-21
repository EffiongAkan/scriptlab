import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Download, Search, Filter, BookOpen, Film, Tv, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  author: string;
  preview?: string;
  tags: string[];
  featured?: boolean;
}

export const TemplatesMarketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const { toast } = useToast();

  const templates: Template[] = [
    {
      id: '1',
      title: 'Nigerian Rom-Com Template',
      description: 'Perfect structure for romantic comedies set in Nigeria with cultural authenticity.',
      category: 'Comedy',
      price: 29.99,
      rating: 4.8,
      downloads: 342,
      author: 'Funmi Adebayo',
      tags: ['Romance', 'Comedy', 'Nigerian', 'Nollywood'],
      featured: true
    },
    {
      id: '2',
      title: 'Afrofuturism Sci-Fi Framework',
      description: 'Groundbreaking template blending African culture with futuristic storytelling.',
      category: 'Sci-Fi',
      price: 39.99,
      rating: 4.9,
      downloads: 156,
      author: 'Kwame Asante',
      tags: ['Sci-Fi', 'Afrofuturism', 'Technology', 'Culture'],
      featured: true
    },
    {
      id: '3',
      title: 'Historical Drama Structure',
      description: 'Comprehensive template for period dramas with authentic historical elements.',
      category: 'Drama',
      price: 34.99,
      rating: 4.7,
      downloads: 289,
      author: 'Amara Okafor',
      tags: ['Historical', 'Drama', 'Period', 'Cultural']
    },
    {
      id: '4',
      title: 'Short Film Blueprint',
      description: 'Concise yet powerful structure for impactful short films.',
      category: 'Short Film',
      price: 19.99,
      rating: 4.6,
      downloads: 567,
      author: 'Tunde Kelani',
      tags: ['Short Film', 'Festival', 'Competition']
    },
    {
      id: '5',
      title: 'TV Series Pilot Template',
      description: 'Professional template for creating compelling TV series pilots.',
      category: 'Television',
      price: 49.99,
      rating: 4.8,
      downloads: 203,
      author: 'Ego Boyo',
      tags: ['Television', 'Series', 'Pilot', 'Broadcasting']
    },
    {
      id: '6',
      title: 'Documentary Framework',
      description: 'Structured approach to documentary storytelling and interviews.',
      category: 'Documentary',
      price: 24.99,
      rating: 4.5,
      downloads: 178,
      author: 'Mahmood Ali-Balogun',
      tags: ['Documentary', 'Non-fiction', 'Interview']
    }
  ];

  const categories = ['all', 'Comedy', 'Drama', 'Sci-Fi', 'Television', 'Documentary', 'Short Film'];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'downloads':
        return b.downloads - a.downloads;
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const handlePurchase = async (template: Template) => {
    try {
      const userId = await getCurrentUserId();
      // Insert row in templates_purchases table
      if (userId) {
        const { error } = await (window as any).supabase
          .from('templates_purchases')
          .insert([{ user_id: userId, template_id: template.id, price_paid: template.price }]);
        if (error) throw error;
        toast({
          title: "Template Purchased",
          description: `"${template.title}" has been added to your library!`
        });
      }
    } catch (err) {
      toast({ title: "Purchase Error", description: "Failed to record template purchase.", variant: "destructive" });
    }
  };

  async function getCurrentUserId() {
    if ((window as any).supabase) {
      const { data: { user } } = await (window as any).supabase.auth.getUser();
      return user?.id;
    }
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Television':
        return <Tv className="h-4 w-4" />;
      case 'Documentary':
        return <Mic className="h-4 w-4" />;
      case 'Short Film':
        return <Film className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Professional Templates Marketplace</h2>
        <p className="text-muted-foreground">
          Professionally crafted templates from industry experts to jumpstart your projects
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTemplates.map((template) => (
          <Card key={template.id} className={`relative ${template.featured ? 'border-primary shadow-md' : ''}`}>
            {template.featured && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">${template.price}</div>
                </div>
              </div>
              
              <CardTitle className="text-xl">{template.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{template.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{template.downloads}</span>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">by </span>
                <span className="font-medium">{template.author}</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Preview
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handlePurchase(template)}
                >
                  Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all categories
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
