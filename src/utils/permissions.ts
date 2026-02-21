/**
 * Permission utilities for role-based collaboration access control
 */

export type CollaboratorRole = 'viewer' | 'editor' | 'admin';

export interface PermissionCheck {
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
    role?: CollaboratorRole;
}

/**
 * Check if a role has view permissions
 */
export const canView = (role: CollaboratorRole): boolean => {
    return ['viewer', 'editor', 'admin'].includes(role);
};

/**
 * Check if a role has edit permissions
 */
export const canEdit = (role: CollaboratorRole): boolean => {
    return ['editor', 'admin'].includes(role);
};

/**
 * Check if a role can manage collaborators
 */
export const canManageCollaborators = (role: CollaboratorRole): boolean => {
    return role === 'admin';
};

/**
 * Get human-readable label for a role
 */
export const getRoleLabel = (role: CollaboratorRole): string => {
    const labels: Record<CollaboratorRole, string> = {
        viewer: 'Can View',
        editor: 'Can Edit',
        admin: 'Admin'
    };
    return labels[role];
};

/**
 * Get detailed description for a role
 */
export const getRoleDescription = (role: CollaboratorRole): string => {
    const descriptions: Record<CollaboratorRole, string> = {
        viewer: 'Can view the script and comments but cannot make changes',
        editor: 'Can view and edit the script, add comments, and modify content',
        admin: 'Full access including managing collaborators and script settings'
    };
    return descriptions[role];
};

/**
 * Get all available roles with labels
 */
export const getAllRoles = (): Array<{ value: CollaboratorRole; label: string; description: string }> => {
    return [
        {
            value: 'viewer',
            label: getRoleLabel('viewer'),
            description: getRoleDescription('viewer')
        },
        {
            value: 'editor',
            label: getRoleLabel('editor'),
            description: getRoleDescription('editor')
        },
        {
            value: 'admin',
            label: getRoleLabel('admin'),
            description: getRoleDescription('admin')
        }
    ];
};

/**
 * Get permission check object for a role
 */
export const getPermissions = (role: CollaboratorRole): PermissionCheck => {
    return {
        canView: canView(role),
        canEdit: canEdit(role),
        canManage: canManageCollaborators(role),
        role
    };
};

/**
 * Validate if a role value is valid
 */
export const isValidRole = (role: string): role is CollaboratorRole => {
    return ['viewer', 'editor', 'admin'].includes(role);
};
