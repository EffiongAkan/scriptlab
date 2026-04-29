import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Shield, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIModelSelectorProps {
    apiKeyStatuses?: Record<string, boolean>;
    onUpdateSetting: (key: string, value: any) => Promise<void>;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({ apiKeyStatuses, onUpdateSetting }) => {
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
        {
            id: 'deepseek',
            name: 'DeepSeek',
            models: [
                // DeepSeek V3 (latest chat)
                'deepseek-chat',
                'deepseek-v3',
                // DeepSeek R1 (reasoning)
                'deepseek-reasoner',
                'deepseek-r1',
                'deepseek-r1-zero',
                // DeepSeek R1 Distill — Qwen base
                'deepseek-r1-distill-qwen-32b',
                'deepseek-r1-distill-qwen-14b',
                'deepseek-r1-distill-qwen-7b',
                'deepseek-r1-distill-qwen-1.5b',
                // DeepSeek R1 Distill — Llama base
                'deepseek-r1-distill-llama-70b',
                'deepseek-r1-distill-llama-8b',
                // DeepSeek V2 family
                'deepseek-v2',
                'deepseek-v2.5',
                // Legacy
                'deepseek-coder',
                'deepseek-coder-v2',
            ]
        },
        { id: 'openai', name: 'ChatGPT (OpenAI)', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
        { id: 'anthropic', name: 'Claude (Anthropic)', models: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'] },
        {
            id: 'xai',
            name: 'xAI (Grok)',
            models: [
                // Grok 4 — Latest flagship & reasoning
                'grok-4',
                'grok-4-0709',
                'grok-4-1-fast-reasoning',
                'grok-4.20-0309-reasoning',
                // Grok 3 family
                'grok-3',
                'grok-3-mini',
                'grok-3-fast',
                'grok-3-mini-fast',
                // Grok 2 family
                'grok-2',
                'grok-2-1212',
                'grok-2-vision-1212',
                'grok-2-mini',
                // Legacy
                'grok-beta',
            ]
        }
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

            // Only update keys if they have been typed into
            if (apiKeys.openai) await onUpdateSetting('openai_api_key', apiKeys.openai);
            if (apiKeys.anthropic) await onUpdateSetting('anthropic_api_key', apiKeys.anthropic);
            if (apiKeys.xai) await onUpdateSetting('xai_api_key', apiKeys.xai);
            if (apiKeys.deepseek) await onUpdateSetting('deepseek_api_key', apiKeys.deepseek);

            // Clear the inputs after saving to enforce write-only UI
            setApiKeys({
                openai: '',
                anthropic: '',
                xai: '',
                deepseek: ''
            });

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
                        <p className="text-sm border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-md mb-4 flex items-center gap-2">
                            <Shield className="h-4 w-4 shrink-0" />
                            For security, existing API keys cannot be viewed. Enter a new key below to overwrite an existing one.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    OpenAI API Key
                                    {apiKeyStatuses?.openai_api_key && <span className="text-[10px] text-green-500 font-normal border border-green-500/20 bg-green-500/10 px-1 rounded">Key Configured</span>}
                                </Label>
                                <Input
                                    type="password"
                                    value={apiKeys.openai}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                                    placeholder={apiKeyStatuses?.openai_api_key ? "•••••••••••••••••••• (Enter new key to overwrite)" : "sk-..."}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    Anthropic API Key
                                    {apiKeyStatuses?.anthropic_api_key && <span className="text-[10px] text-green-500 font-normal border border-green-500/20 bg-green-500/10 px-1 rounded">Key Configured</span>}
                                </Label>
                                <Input
                                    type="password"
                                    value={apiKeys.anthropic}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                                    placeholder={apiKeyStatuses?.anthropic_api_key ? "•••••••••••••••••••• (Enter new key to overwrite)" : "sk-ant-..."}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    xAI API Key
                                    {apiKeyStatuses?.xai_api_key && <span className="text-[10px] text-green-500 font-normal border border-green-500/20 bg-green-500/10 px-1 rounded">Key Configured</span>}
                                </Label>
                                <Input
                                    type="password"
                                    value={apiKeys.xai}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, xai: e.target.value }))}
                                    placeholder={apiKeyStatuses?.xai_api_key ? "•••••••••••••••••••• (Enter new key to overwrite)" : "xai-..."}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    DeepSeek API Key
                                    {apiKeyStatuses?.deepseek_api_key && <span className="text-[10px] text-green-500 font-normal border border-green-500/20 bg-green-500/10 px-1 rounded">Key Configured</span>}
                                </Label>
                                <Input
                                    type="password"
                                    value={apiKeys.deepseek}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, deepseek: e.target.value }))}
                                    placeholder={apiKeyStatuses?.deepseek_api_key ? "•••••••••••••••••••• (Enter new key to overwrite)" : "sk-..."}
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
