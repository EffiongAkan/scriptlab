import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  Users,
  User,
  Bell,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  type: 'email' | 'in-app' | 'both';
}

interface NotificationHistory {
  id: string;
  type: 'individual' | 'bulk';
  subject: string;
  recipients: number;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
}

interface NotificationManagerProps {
  users: Array<{ id: string; email: string; full_name?: string }>;
  templates: NotificationTemplate[];
  history: NotificationHistory[];
  onSendNotification: (data: {
    type: 'individual' | 'bulk';
    recipients: string[];
    subject: string;
    message: string;
    notificationType: 'email' | 'in-app' | 'both';
    actionUrl?: string;
  }) => void;
  onSaveTemplate: (template: Omit<NotificationTemplate, 'id'>) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  users,
  templates,
  history,
  onSendNotification,
  onSaveTemplate
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [notificationType, setNotificationType] = useState<'email' | 'in-app' | 'both'>('both');
  const [searchTerm, setSearchTerm] = useState('');

  // Template creation
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');

  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in subject and message",
        variant: "destructive"
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive"
      });
      return;
    }

    const type = selectedUsers.length > 1 ? 'bulk' : 'individual';
    
    onSendNotification({
      type,
      recipients: selectedUsers,
      subject,
      message,
      notificationType,
      actionUrl
    });

    // Reset recipients but keep subject/message if user wants to send again
    setSelectedUsers([]);

    toast({
      title: "Success",
      description: `Notification sent to ${selectedUsers.length} user(s)`
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !templateSubject.trim() || !templateMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all template fields",
        variant: "destructive"
      });
      return;
    }

    onSaveTemplate({
      name: templateName,
      subject: templateSubject,
      message: templateMessage,
      type: notificationType
    });

    // Reset template form
    setTemplateName('');
    setTemplateSubject('');
    setTemplateMessage('');

    toast({
      title: "Success",
      description: "Template saved successfully"
    });
  };

  const loadTemplate = (template: NotificationTemplate) => {
    setSubject(template.subject);
    setMessage(template.message);
    setNotificationType(template.type);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-amber-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Tabs defaultValue="send" className="space-y-6">
      <TabsList>
        <TabsTrigger value="send">Send Notifications</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="send" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Recipients ({selectedUsers.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" onClick={handleSelectAll}>
                  {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <div>
                      <div className="font-medium">{user.full_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notification Type</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    variant={notificationType === 'email' ? 'default' : 'outline'}
                    onClick={() => setNotificationType('email')}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant={notificationType === 'in-app' ? 'default' : 'outline'}
                    onClick={() => setNotificationType('in-app')}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    In-App
                  </Button>
                  <Button
                    size="sm"
                    variant={notificationType === 'both' ? 'default' : 'outline'}
                    onClick={() => setNotificationType('both')}
                  >
                    Both
                  </Button>
                </div>
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Notification subject..."
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message content..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Action URL (Optional)</Label>
                <Input
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="e.g. /premium or /editor/..."
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Users will be redirected here when they click the notification.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSend}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Selected ({selectedUsers.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Templates */}
        {templates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    size="sm"
                    variant="outline"
                    onClick={() => loadTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="templates" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Welcome Message"
              />
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="Welcome to ScriptLab!"
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={templateMessage}
                onChange={(e) => setTemplateMessage(e.target.value)}
                placeholder="Template message content..."
                rows={4}
              />
            </div>

            <Button onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </CardContent>
        </Card>

        {/* Existing Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge>{template.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm">Subject:</Label>
                    <p className="text-sm">{template.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Message:</Label>
                    <p className="text-sm text-muted-foreground line-clamp-3">{template.message}</p>
                  </div>
                  <Button size="sm" onClick={() => loadTemplate(template)}>
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium">{item.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.type === 'bulk' ? `${item.recipients} recipients` : '1 recipient'} • {
                          (() => {
                            try {
                              const date = new Date(item.sent_at);
                              if (isNaN(date.getTime())) throw new Error();
                              return date.toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              return 'Just now';
                            }
                          })()
                        }
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.status === 'sent' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
