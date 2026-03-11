import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Shield,
    Key,
    Cpu,
    AlertTriangle,
    Eye,
    Save,
    Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSettingsManagerProps {
    settings: Record<string, any>;
    apiKeyStatuses: Record<string, boolean>;
    onUpdateSetting: (key: string, value: any) => Promise<void>;
}

export const SystemSettingsManager: React.FC<SystemSettingsManagerProps> = ({
    settings,
    apiKeyStatuses,
    onUpdateSetting
}) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState<string | null>(null);

    const handleSave = async (key: string, value: any) => {
        try {
            setIsSaving(key);
            await onUpdateSetting(key, value);
            toast({
                title: "Setting Saved",
                description: `${key} has been updated successfully.`,
            });
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.message || "An error occurred while saving.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(null);
        }
    };

    const renderApiKeyItem = (label: string, key: string) => {
        // We no longer read the value from settings because RLS blocks it.
        // We rely on the parent component to tell us if a key exists via `apiKeyStatuses`.
        // However, we need to add that prop first. For now, we assume it exists if it's in the original settings (which it won't be soon).
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
                    <Badge variant="outline" className="text-[10px] h-5 bg-muted/50">Write-Only</Badge>
                </div>
                <div className="flex gap-2">
                    <Input
                        id={key}
                        type="password"
                        onChange={(e) => { }} // Local state would be better for bulk save, but following dashboard pattern
                        onBlur={(e) => {
                            if (e.target.value) {
                                handleSave(key, e.target.value);
                                e.target.value = ''; // Clear after save attempt
                            }
                        }}
                        placeholder="•••••••••••••••••••• (Enter new key to overwrite)"
                        className="font-mono text-sm placeholder:text-muted-foreground/50"
                    />
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={isSaving === key}
                        onClick={() => {
                            const input = document.getElementById(key) as HTMLInputElement;
                            if (input.value) {
                                handleSave(key, input.value);
                                input.value = ''; // Clear after save attempt
                            }
                        }}
                    >
                        <Save className={`h-4 w-4 ${isSaving === key ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> For security, existing keys cannot be viewed.
                </p>
            </div>
        );
    };

    return (
        <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>System Administration</CardTitle>
                        <CardDescription>Securely manage global configuration and sensitive integration keys</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="ai" className="flex items-center gap-2">
                            <Cpu className="h-4 w-4" /> AI Configuration
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" /> General
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Security
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai" className="space-y-6">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3 mb-6">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-800 dark:text-amber-400">Security Warning</p>
                                <p className="text-amber-700/80 dark:text-amber-400/80">
                                    Ensure keys are never shared or committed to source control. Changes to these keys affect AI generation system-wide.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b">
                                    <Key className="h-4 w-4" /> API Credentials
                                </h3>
                                {renderApiKeyItem("DeepSeek API Key", "deepseek_api_key")}
                                {renderApiKeyItem("OpenAI API Key", "openai_api_key")}
                                {renderApiKeyItem("Anthropic API Key", "anthropic_api_key")}
                                {renderApiKeyItem("xAI API Key", "xai_api_key")}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b">
                                    <Cpu className="h-4 w-4" /> Runtime Parameters
                                </h3>
                                <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="stream-ai" className="cursor-pointer">Enable AI Streaming</Label>
                                        <Switch
                                            id="stream-ai"
                                            checked={settings.enable_ai_streaming !== false}
                                            onCheckedChange={(checked) => handleSave('enable_ai_streaming', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="log-ai" className="cursor-pointer">Detailed AI Logging</Label>
                                        <Switch
                                            id="log-ai"
                                            checked={settings.verbose_ai_logging === true}
                                            onCheckedChange={(checked) => handleSave('verbose_ai_logging', checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="general" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b">
                                    System State
                                </h3>
                                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-destructive font-bold">Maintenance Mode</Label>
                                            <p className="text-xs text-muted-foreground">Force-disable access for all non-admins</p>
                                        </div>
                                        <Switch
                                            checked={settings.maintenance_mode === true}
                                            onCheckedChange={(checked) => handleSave('maintenance_mode', checked)}
                                            className="data-[state=checked]:bg-destructive"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b">
                                    Branding & Identity
                                </h3>
                                <div className="space-y-2">
                                    <Label>Application Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="ScriptLab"
                                            defaultValue={settings.site_name || 'ScriptLab'}
                                            onBlur={(e) => handleSave('site_name', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b">
                                Access Control
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Public Registration</Label>
                                        <p className="text-xs text-muted-foreground">Allow new users to create accounts</p>
                                    </div>
                                    <Switch
                                        checked={settings.allow_registration !== false}
                                        onCheckedChange={(checked) => handleSave('allow_registration', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Email Verification</Label>
                                        <p className="text-xs text-muted-foreground">Require email confirmation for new signups</p>
                                    </div>
                                    <Switch
                                        checked={settings.require_email_verification === true}
                                        onCheckedChange={(checked) => handleSave('require_email_verification', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
