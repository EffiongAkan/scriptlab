import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Bug, Clock, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  metadata: {
    type: string;
    value: string;
  };
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  level: string;
  isUnhandled: boolean;
}

export const SentryErrorViewer = () => {
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get org and project from env variables
      const orgSlug = import.meta.env.VITE_SENTRY_ORG;
      const projectSlug = import.meta.env.VITE_SENTRY_PROJECT;

      if (!orgSlug || !projectSlug) {
        throw new Error('Sentry Org or Project slug is missing in environment variables (.env).');
      }

      const { data, error: funcError } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'get_sentry_issues',
          data: {
            orgSlug,
            projectSlug
          }
        }
      });

      if (funcError) throw funcError;

      if (data.error) {
         throw new Error(data.error);
      }

      setIssues(data.issues || []);
    } catch (err: any) {
      console.error('Error fetching sentry issues:', err);
      setError(err.message || 'Failed to fetch issues. Make sure SENTRY_AUTH_TOKEN is set in Supabase Secrets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'fatal': return 'text-red-600 bg-red-600/10 border-red-600/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="h-6 w-6 text-purple-400" />
            System Errors (Sentry)
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Real-time error tracking and crash reporting
          </p>
        </div>
        <button
          onClick={fetchIssues}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Failed to load errors</h3>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <RefreshCw className="h-8 w-8 animate-spin mb-4 text-purple-400" />
          <p>Fetching latest issues from Sentry...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/50 bg-white/5 rounded-2xl border border-white/10">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <Bug className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No Unresolved Issues!</h3>
          <p>Your application is running smoothly.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <div 
              key={issue.id}
              className="bg-[#1C1C1E] border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-medium uppercase tracking-wider ${getLevelColor(issue.level)}`}>
                      {issue.level}
                    </span>
                    {issue.isUnhandled && (
                      <span className="text-xs px-2 py-0.5 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 font-medium">
                        Unhandled
                      </span>
                    )}
                    <span className="text-white/40 text-xs font-mono">{issue.shortId}</span>
                  </div>
                  <h3 className="text-white font-medium text-lg truncate">
                    {issue.title}
                  </h3>
                  <p className="text-white/60 text-sm mt-1 line-clamp-2">
                    {issue.metadata?.value || 'No additional details provided.'}
                  </p>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:gap-2 shrink-0">
                  <div className="flex items-center gap-4 text-white/50 text-sm">
                    <div className="flex items-center gap-1.5" title="Event Count">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{issue.count}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Last Seen">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <a 
                    href={issue.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg"
                  >
                    View Stack Trace
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
