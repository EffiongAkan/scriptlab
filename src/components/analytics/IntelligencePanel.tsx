
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#008751", "#00a86b", "#FFD700", "#F7921E", "#8B4513"];

interface GenreTrend {
  name: string;
  value: number;
}
interface TrendLanguage {
  name: string;
  value: number;
}
interface AudiencePoll {
  segment: string;
  favorability: number;
}
interface IntelligencePanelProps {
  predictedPerformance: {
    reads: number;
    awardsPotential: string;
    engagementIndex: number;
    predictionExplanation: string;
  };
  trendGenres: GenreTrend[];
  trendLanguages: TrendLanguage[];
  audiencePoll: AudiencePoll[];
  successProbability: number;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  predictedPerformance,
  trendGenres,
  trendLanguages,
  audiencePoll,
  successProbability
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Script Performance Prediction</CardTitle>
        <p className="text-muted-foreground">AI-predicted script metrics</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <span>Predicted Reads</span>
            <span className="font-medium">{predictedPerformance.reads.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Awards Potential</span>
            <span className="font-medium">{predictedPerformance.awardsPotential}</span>
          </div>
          <div className="flex justify-between">
            <span>Engagement Index</span>
            <span className="font-medium">{predictedPerformance.engagementIndex}/100</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground italic">
            {predictedPerformance.predictionExplanation}
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Market Trends Analysis</CardTitle>
        <p className="text-muted-foreground">What's trending now?</p>
      </CardHeader>
      <CardContent>
        <div>
          <strong className="text-sm">Top Genres</strong>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={trendGenres}
              layout="vertical"
              margin={{ top: 12, right: 30, left: 10, bottom: 12 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#008751" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6">
          <strong className="text-sm">Popular Languages</strong>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={trendLanguages}
                cx="50%"
                cy="50%"
                outerRadius={40}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {trendLanguages.map((entry, idx) => (
                  <Cell
                    key={`cell-trend-lang-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Audience Preferences</CardTitle>
        <p className="text-muted-foreground">
          Simulated target audience poll results
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {audiencePoll.map((a) => (
            <div key={a.segment} className="flex justify-between items-center">
              <span>{a.segment}</span>
              <div className="w-2/3 flex items-center gap-2">
                <div className="flex-1">
                  <div
                    className="h-2 bg-green-200 rounded"
                    style={{ width: `${a.favorability}%` }}
                  >
                    <div
                      className="h-2 bg-green-600 rounded"
                      style={{ width: `${a.favorability}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-green-700">{a.favorability}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Younger audiences show the highest favorability score for this script.
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Success Probability Score</CardTitle>
        <p className="text-muted-foreground">
          Overall likelihood of success
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-full flex flex-col items-center">
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle
                cx="46"
                cy="46"
                r="41"
                stroke="#e5e7eb"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="46"
                cy="46"
                r="41"
                stroke="#008751"
                strokeWidth="10"
                fill="none"
                strokeDasharray={2 * Math.PI * 41}
                strokeDashoffset={(1 - successProbability) * 2 * Math.PI * 41}
                strokeLinecap="round"
                transform="rotate(-90 46 46)"
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                fill="#008751"
                fontSize="22"
                fontWeight="bold"
                dy=".35em"
              >
                {(successProbability * 100).toFixed(0)}%
              </text>
            </svg>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            This script has a strong predicted chance of commercial and critical
            success.
            <br />
            Continue to refine characters and pacing for an even higher score.
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default IntelligencePanel;
