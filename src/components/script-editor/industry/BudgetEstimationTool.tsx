
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Calculator, Download, TrendingUp } from 'lucide-react';

interface BudgetEstimationToolProps {
  scriptId: string;
  elements?: any[];
}

export const BudgetEstimationTool: React.FC<BudgetEstimationToolProps> = ({
  scriptId,
  elements = []
}) => {
  const [budget, setBudget] = useState({
    cast: 50000,
    crew: 30000,
    equipment: 20000,
    locations: 15000,
    postProduction: 25000,
    miscellaneous: 10000
  });

  const totalBudget = Object.values(budget).reduce((sum, amount) => sum + amount, 0);

  const handleBudgetChange = (category: keyof typeof budget, value: string) => {
    const numValue = parseInt(value) || 0;
    setBudget(prev => ({ ...prev, [category]: numValue }));
  };

  const budgetCategories = [
    { key: 'cast', label: 'Cast & Acting', icon: '🎭', percentage: (budget.cast / totalBudget) * 100 },
    { key: 'crew', label: 'Crew & Staff', icon: '👥', percentage: (budget.crew / totalBudget) * 100 },
    { key: 'equipment', label: 'Equipment', icon: '📹', percentage: (budget.equipment / totalBudget) * 100 },
    { key: 'locations', label: 'Locations', icon: '📍', percentage: (budget.locations / totalBudget) * 100 },
    { key: 'postProduction', label: 'Post-Production', icon: '🎬', percentage: (budget.postProduction / totalBudget) * 100 },
    { key: 'miscellaneous', label: 'Miscellaneous', icon: '📝', percentage: (budget.miscellaneous / totalBudget) * 100 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Estimation Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ${totalBudget.toLocaleString()}
            </h3>
            <p className="text-gray-600">Total Estimated Budget</p>
          </div>

          <div className="grid gap-4">
            {budgetCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium">
                    <span className="text-lg">{category.icon}</span>
                    {category.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </span>
                    <Input
                      type="number"
                      value={budget[category.key as keyof typeof budget]}
                      onChange={(e) => handleBudgetChange(category.key as keyof typeof budget, e.target.value)}
                      className="w-32 text-right"
                    />
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Script Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {elements.length} script elements analyzed
              </p>
              <p className="text-sm text-muted-foreground">
                {elements.filter(el => el.type === 'heading').length} scenes detected
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">Industry Average</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your budget: ${totalBudget.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Industry avg: $180,000
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Export Options</span>
              </div>
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full">
                  Export PDF
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  Export Excel
                </Button>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
