import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Crown,
  Check,
  X,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    scripts: number;
    aiGenerations: number;
    collaborators: number;
    exports: number;
  };
  isActive: boolean;
  subscriberCount: number;
}

interface SubscriptionPlanManagerProps {
  plans: SubscriptionPlan[];
  onCreatePlan: (plan: Omit<SubscriptionPlan, 'id' | 'subscriberCount'>) => void;
  onUpdatePlan: (planId: string, updates: Partial<SubscriptionPlan>) => void;
  onDeletePlan: (planId: string) => void;
}

export const SubscriptionPlanManager: React.FC<SubscriptionPlanManagerProps> = ({
  plans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: 0,
    interval: 'month' as 'month' | 'year',
    features: [''],
    limits: {
      scripts: 0,
      aiGenerations: 0,
      collaborators: 0,
      exports: 0
    },
    isActive: true
  });
  const { toast } = useToast();

  const handleCreatePlan = () => {
    if (!newPlan.name || newPlan.price < 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const planData = {
      ...newPlan,
      features: newPlan.features.filter(f => f.trim() !== '')
    };

    if (editingPlan) {
      onUpdatePlan(editingPlan, planData);
      toast({
        title: "Success",
        description: "Subscription plan updated successfully"
      });
    } else {
      onCreatePlan(planData);
      toast({
        title: "Success",
        description: "Subscription plan created successfully"
      });
    }

    setNewPlan({
      name: '',
      description: '',
      price: 0,
      interval: 'month',
      features: [''],
      limits: {
        scripts: 0,
        aiGenerations: 0,
        collaborators: 0,
        exports: 0
      },
      isActive: true
    });
    setEditingPlan(null);
    setIsCreating(false);
  };

  const addFeature = () => {
    setNewPlan(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Crown className="h-5 w-5" />
              {editingPlan ? `Edit ${newPlan.name} Plan` : 'Subscription Plans Management'}
            </CardTitle>
            <Button onClick={() => {
              if (isCreating) {
                setEditingPlan(null);
                setNewPlan({
                  name: '',
                  description: '',
                  price: 0,
                  interval: 'month',
                  features: [''],
                  limits: { scripts: 0, aiGenerations: 0, collaborators: 0, exports: 0 },
                  isActive: true
                });
              }
              setIsCreating(!isCreating);
            }}>
              {isCreating ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Plan
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {isCreating && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Professional Plan"
                />
              </div>

              <div>
                <Label>Price</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <Input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    placeholder="19.99"
                  />
                  <select
                    value={newPlan.interval}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, interval: e.target.value as 'month' | 'year' }))}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Perfect for professional scriptwriters..."
              />
            </div>

            {/* Plan Limits */}
            <div>
              <Label>Plan Limits</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <Label className="text-sm">Scripts</Label>
                  <Input
                    type="number"
                    value={newPlan.limits.scripts}
                    onChange={(e) => setNewPlan(prev => ({
                      ...prev,
                      limits: { ...prev.limits, scripts: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="Unlimited = -1"
                  />
                </div>
                <div>
                  <Label className="text-sm">AI Generations</Label>
                  <Input
                    type="number"
                    value={newPlan.limits.aiGenerations}
                    onChange={(e) => setNewPlan(prev => ({
                      ...prev,
                      limits: { ...prev.limits, aiGenerations: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Collaborators</Label>
                  <Input
                    type="number"
                    value={newPlan.limits.collaborators}
                    onChange={(e) => setNewPlan(prev => ({
                      ...prev,
                      limits: { ...prev.limits, collaborators: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Exports</Label>
                  <Input
                    type="number"
                    value={newPlan.limits.exports}
                    onChange={(e) => setNewPlan(prev => ({
                      ...prev,
                      limits: { ...prev.limits, exports: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <Label>Features</Label>
              <div className="space-y-2 mt-2">
                {newPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Feature description"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addFeature}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newPlan.isActive}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active Plan</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan}>
                  Create Plan
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Existing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`${!plan.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingPlan(plan.id);
                      setNewPlan({
                        name: plan.name,
                        description: plan.description,
                        price: plan.price,
                        interval: plan.interval,
                        features: plan.features.length > 0 ? plan.features : [''],
                        limits: { ...plan.limits },
                        isActive: plan.isActive
                      });
                      setIsCreating(true);
                      // Scroll to top to see edit form
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeletePlan(plan.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-2xl font-bold">
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{plan.description}</p>

              {/* Plan Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {plan.subscriberCount} subscribers
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                <div>Scripts: {plan.limits.scripts === -1 ? '∞' : plan.limits.scripts}</div>
                <div>AI Gen: {plan.limits.aiGenerations === -1 ? '∞' : plan.limits.aiGenerations}</div>
                <div>Collab: {plan.limits.collaborators === -1 ? '∞' : plan.limits.collaborators}</div>
                <div>Exports: {plan.limits.exports === -1 ? '∞' : plan.limits.exports}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
