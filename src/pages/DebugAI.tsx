
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, AlertCircle, Terminal } from 'lucide-react';

const DebugAI = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [diagResult, setDiagResult] = useState<any>(null);
    const [diagLoading, setDiagLoading] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('system_settings').select('*');
            if (error) throw error;
            setSettings(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const testEdgeFunction = async () => {
        setDiagLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-diag');
            setDiagResult(data || { error: 'No data returned' });
            if (error) setDiagResult({ error: error.message });
        } catch (err: any) {
            setDiagResult({ error: err.message });
        } finally {
            setDiagLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const getSetting = (key: string) => settings.find(s => s.key === key)?.value;

    const mask = (val: any) => {
        if (!val) return 'MISSING';
        const s = String(val).replace(/^"|"$/g, '');
        if (s.length === 0) return 'EMPTY';
        return `${s.substring(0, 7)}...${s.substring(s.length - 4)} (Length: ${s.length})`;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Terminal className="h-8 w-8 text-primary" />
                    AI Diagnostic Dashboard
                </h1>
                <Button onClick={fetchSettings} variant="outline">Refresh Settings</Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Settings</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Active AI Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Active Provider:</span>
                            <Badge variant="secondary">{mask(getSetting('active_ai_provider'))}</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Active Model:</span>
                            <Badge variant="outline">{mask(getSetting('active_ai_model'))}</Badge>
                        </div>
                        <div className="mt-4 p-3 bg-muted rounded-md border text-sm text-center">
                            API keys are encrypted and managed securely via Edge Functions. You can update them in the main AI Configuration settings.
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex justify-between items-center">
                            Edge Function Diagnostics
                            <Button size="sm" onClick={testEdgeFunction} disabled={diagLoading}>
                                {diagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Cloud Ping'}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {diagResult ? (
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-auto max-h-[200px]">
                                {JSON.stringify(diagResult, null, 2)}
                            </pre>
                        ) : (
                            <p className="text-sm text-muted-foreground italic text-center py-8">
                                Click "Run Cloud Ping" to test internal backend reachability.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>How to troubleshoot</AlertTitle>
                <AlertDescription className="text-sm">
                    If AI features are failing, verify your API keys are set correctly in the main Admin Settings. If <strong>Active Provider</strong> is not matching the key you provided, generation may fail.
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default DebugAI;
