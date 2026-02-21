import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Crown, 
  User, 
  Settings, 
  Users, 
  CreditCard, 
  Mail, 
  Database,
  BarChart3,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPermission {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AdminRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  color: string;
  canManageUsers: boolean;
  canManageSubscriptions: boolean;
  canManageSystem: boolean;
  canViewAnalytics: boolean;
  canSendNotifications: boolean;
  canManageAdmins: boolean;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role_id: string;
  created_at: string;
  is_active: boolean;
  last_active?: string;
}

interface AdminLevelManagerProps {
  roles: AdminRole[];
  admins: AdminUser[];
  permissions: AdminPermission[];
  onCreateRole: (role: Omit<AdminRole, 'id'>) => void;
  onUpdateRole: (roleId: string, updates: Partial<AdminRole>) => void;
  onDeleteRole: (roleId: string) => void;
  onUpdateAdminRole: (adminId: string, roleId: string) => void;
  onToggleAdminStatus: (adminId: string, isActive: boolean) => void;
}

export const AdminLevelManager: React.FC<AdminLevelManagerProps> = ({
  roles,
  admins,
  permissions,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onUpdateAdminRole,
  onToggleAdminStatus
}) => {
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    level: 1,
    permissions: [] as string[],
    color: 'blue',
    canManageUsers: false,
    canManageSubscriptions: false,
    canManageSystem: false,
    canViewAnalytics: false,
    canSendNotifications: false,
    canManageAdmins: false
  });
  const { toast } = useToast();

  const defaultRoles = [
    {
      name: 'Super Admin',
      level: 10,
      color: 'red',
      permissions: ['all'],
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageSystem: true,
      canViewAnalytics: true,
      canSendNotifications: true,
      canManageAdmins: true
    },
    {
      name: 'Admin',
      level: 8,
      color: 'purple',
      permissions: ['user_management', 'subscription_management', 'analytics'],
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageSystem: false,
      canViewAnalytics: true,
      canSendNotifications: true,
      canManageAdmins: false
    },
    {
      name: 'Moderator',
      level: 5,
      color: 'green',
      permissions: ['user_management', 'notifications'],
      canManageUsers: true,
      canManageSubscriptions: false,
      canManageSystem: false,
      canViewAnalytics: false,
      canSendNotifications: true,
      canManageAdmins: false
    },
    {
      name: 'Support',
      level: 3,
      color: 'blue',
      permissions: ['user_view', 'notifications'],
      canManageUsers: false,
      canManageSubscriptions: false,
      canManageSystem: false,
      canViewAnalytics: false,
      canSendNotifications: true,
      canManageAdmins: false
    }
  ];

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a role name",
        variant: "destructive"
      });
      return;
    }

    onCreateRole(newRole);
    setNewRole({
      name: '',
      level: 1,
      permissions: [],
      color: 'blue',
      canManageUsers: false,
      canManageSubscriptions: false,
      canManageSystem: false,
      canViewAnalytics: false,
      canSendNotifications: false,
      canManageAdmins: false
    });
    setIsCreatingRole(false);
    
    toast({
      title: "Success",
      description: "Admin role created successfully"
    });
  };

  const getRoleIcon = (level: number) => {
    if (level >= 10) return <Crown className="h-4 w-4" />;
    if (level >= 8) return <Shield className="h-4 w-4" />;
    if (level >= 5) return <Settings className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Admin Roles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Roles & Permissions
            </CardTitle>
            <Button onClick={() => setIsCreatingRole(!isCreatingRole)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        
        {isCreatingRole && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Role Name</Label>
                  <Input
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Content Manager"
                  />
                </div>
                
                <div>
                  <Label>Authority Level (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newRole.level}
                    onChange={(e) => setNewRole(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                
                <div>
                  <Label>Color</Label>
                  <select
                    value={newRole.color}
                    onChange={(e) => setNewRole(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                    <option value="yellow">Yellow</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRole.canManageUsers}
                      onCheckedChange={(checked) => setNewRole(prev => ({ ...prev, canManageUsers: checked }))}
                    />
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Management
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRole.canManageSubscriptions}
                      onCheckedChange={(checked) => setNewRole(prev => ({ ...prev, canManageSubscriptions: checked }))}
                    />
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Subscriptions
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRole.canManageSystem}
                      onCheckedChange={(checked) => setNewRole(prev => ({ ...prev, canManageSystem: checked }))}
                    />
                    <Label className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      System Settings
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRole.canViewAnalytics}
                      onCheckedChange={(checked) => setNewRole(prev => ({ ...prev, canViewAnalytics: checked }))}
                    />
                    <Label className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRole.canSendNotifications}
                      onCheckedChange={(checked) => setNewRole(prev => ({ ...prev, canSendNotifications: checked }))}
                    />
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Notifications
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRole.canManageAdmins}
                      onCheckedChange={(checked) => setNewRole(prev => ({ ...prev, canManageAdmins: checked }))}
                    />
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Management
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreatingRole(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRole}>
                  Create Role
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Existing Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className={`border-2 ${getRoleColor(role.color)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRoleIcon(role.level)}
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                <Badge variant="secondary">Level {role.level}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                {role.canManageUsers && <div className="flex items-center gap-2"><Users className="h-3 w-3" /> User Management</div>}
                {role.canManageSubscriptions && <div className="flex items-center gap-2"><CreditCard className="h-3 w-3" /> Subscriptions</div>}
                {role.canManageSystem && <div className="flex items-center gap-2"><Database className="h-3 w-3" /> System Settings</div>}
                {role.canViewAnalytics && <div className="flex items-center gap-2"><BarChart3 className="h-3 w-3" /> Analytics</div>}
                {role.canSendNotifications && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> Notifications</div>}
                {role.canManageAdmins && <div className="flex items-center gap-2"><Shield className="h-3 w-3" /> Admin Management</div>}
              </div>
              
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDeleteRole(role.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Current Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => {
              const role = roles.find(r => r.id === admin.role_id);
              return (
                <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {role && getRoleIcon(role.level)}
                    <div>
                      <div className="font-medium">{admin.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {role?.name} • Joined {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {role && (
                      <Badge className={getRoleColor(role.color)}>
                        {role.name}
                      </Badge>
                    )}
                    <Switch
                      checked={admin.is_active}
                      onCheckedChange={(checked) => onToggleAdminStatus(admin.id, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
