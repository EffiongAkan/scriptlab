import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Shield, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIModelSelectorProps {
    onUpdateSetting: (key: string, value: any) => Promise<void>;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({ onUpdateSetting }) => {
    const [loading, setLoading] = useState(false);
    const [activeProvider, setActiveProvider] = useState('deepseek');
    const [activeModel, setActiveModel] = useState('deepseek-chat');
    const [apiKeys, setApiKeys] = useState({
        openai: '',
        anthropic: '',
        xai: '',
        deepseek: ''
    });
    const { toast } = useToast();

    const providers = [
        { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
        { id: 'openai', name: 'ChatGPT (OpenAI)', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
        { id: 'anthropic', name: 'Claude (Anthropic)', models: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'] },
        { id: 'xai', name: 'xAI (Grok)', models: ['grok-beta', 'grok-2'] }
    ];

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .in('key', [
                    'active_ai_provider',
                    'active_ai_model',
                    'openai_api_key',
                    'anthropic_api_key',
                    'xai_api_key',
                    'deepseek_api_key'
                ]);

            if (error) throw error;

            const safeParse = (val: any) => {
                if (typeof val !== 'string') return val;
                try {
                    // Try to parse if it looks like a JSON-stringified string (e.g. "\"value\"")
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('{') || val.startsWith('['))) {
                        return JSON.parse(val);
                    }
                } catch (e) {
                    // If parsing fails, return as is (stripped of outer quotes if they exist)
                    return val.replace(/^"|"$/g, '');
                }
                return val;
            };

            data.forEach(setting => {
                const parsedValue = safeParse(setting.value);

                if (setting.key === 'active_ai_provider') {
                    setActiveProvider(parsedValue as string);
                }
                if (setting.key === 'active_ai_model') {
                    setActiveModel(parsedValue as string);
                }
                if (setting.key.endsWith('_api_key')) {
                    const provider = setting.key.replace('_api_key', '');
                    setApiKeys(prev => ({ ...prev, [provider]: (parsedValue as string) || '' }));
                }
            });
        } catch (error: any) {
            console.error('Error fetching AI settings:', error);
            toast({
                title: "Error",
                description: "Failed to fetch AI settings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (key: string, value: any) => {
        try {
            setLoading(true);
            await onUpdateSetting(key, value);
            toast({
                title: "Success",
                description: `Updated ${key.replace(/_/g, ' ')}`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update setting",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAllAtOnce = async () => {
        setLoading(true);
        try {
            await onUpdateSetting('active_ai_provider', activeProvider);
            await onUpdateSetting('active_ai_model', activeModel);
            await onUpdateSetting('openai_api_key', apiKeys.openai);
            await onUpdateSetting('anthropic_api_key', apiKeys.anthropic);
            await onUpdateSetting('xai_api_key', apiKeys.xai);
            await onUpdateSetting('deepseek_api_key', apiKeys.deepseek);

            toast({
                title: "All Settings Saved",
                description: "AI configuration updated successfully"
            });
        } catch (error: any) {
            console.error('Detailed Save AI config error:', error);

            // Try to extract the most descriptive error message from different possible formats
            let errorMessage = "Failed to update AI settings";

            if (error.context?.json?.error) {
                errorMessage = error.context.json.error;
            } else if (error.error_description) {
                errorMessage = error.error_description;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toast({
                title: "Configuration Error",
                description: `${errorMessage}${error.status ? ` (Status: ${error.status})` : ''}`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                Global AI Model Selection
                            </CardTitle>
                            <CardDescription>
                                Select the AI provider and model that will power all script generation features
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="provider">Active AI Provider</Label>
                            <select
                                id="provider"
                                value={activeProvider}
                                onChange={(e) => {
                                    const provider = e.target.value;
                                    setActiveProvider(provider);
                                    const firstModel = providers.find(p => p.id === provider)?.models[0];
                                    if (firstModel) setActiveModel(firstModel);
                                }}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                disabled={loading}
                            >
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">Active AI Model</Label>
                            <div className="flex gap-2">
                                <select
                                    id="model"
                                    value={activeModel}
                                    onChange={(e) => setActiveModel(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-md bg-background"
                                    disabled={loading}
                                >
                                    {providers.find(p => p.id === activeProvider)?.models.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                    <option value="custom">-- Custom Model ID --</option>
                                </select>
                                {activeModel === 'custom' && (
                                    <Input
                                        placeholder="Enter custom model ID"
                                        onChange={(e) => setActiveModel(e.target.value)}
                                        className="flex-1"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            API Provider Credentials
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Configure the API keys for each provider. These are required if not set in environment variables.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>OpenAI API Key</Label>
                                <Input
                                    type="password"
                                    value={apiKeys.openai}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                                    placeholder="sk-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Anthropic API Key</Label>
                                <Input
                                    type="password"
                                    value={apiKeys.anthropic}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                                    placeholder="sk-ant-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>xAI API Key</Label>
                                <Input
                                    type="password"
                                    value={apiKeys.xai}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, xai: e.target.value }))}
                                    placeholder="xai-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>DeepSeek API Key</Label>
                                <Input
                                    type="password"
                                    value={apiKeys.deepseek}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, deepseek: e.target.value }))}
                                    placeholder="sk-..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveAllAtOnce} disabled={loading} className="gap-2">
                            <Save className="h-4 w-4" />
                            Save AI Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
