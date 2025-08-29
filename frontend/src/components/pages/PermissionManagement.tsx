/**
 * PermissionManagement Page Component
 * 
 * View-only component for displaying system permissions.
 * Uses shared components for consistent UI and follows DRY principles.
 * 
 * Features:
 * - Permission listing with resource/action parsing
 * - Color-coded action types
 * - Search and filtering capabilities
 * - Enhanced visual design with icons
 */

import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../../services';
import { Permission } from '../../types/admin';
import { useMessage } from '../../hooks';
import { 
  Button, 
  Card, 
  Table, 
  Badge, 
  SearchInput,
  MessageDisplay,
  Column 
} from '../shared';
import { UI_MESSAGES, FORM_LABELS } from '../../constants/ui';

interface PermissionManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const PermissionManagement: React.FC<PermissionManagementProps> = ({ 
  showMessage, 
  loading, 
  setLoading 
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionFilter, setPermissionFilter] = useState('');

  const { message, messageType, showMessage: showLocalMessage, clearMessage } = useMessage();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getPermissions(permissionFilter);
      setPermissions(response.data.data || []);
    } catch (err: any) {
      showLocalMessage(err.response?.data?.message || 'Failed to fetch permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionVariant = (action: string): 'success' | 'info' | 'warning' | 'danger' | 'default' => {
    switch (action?.toLowerCase()) {
      case 'create': return 'success';
      case 'view': return 'info';
      case 'update': return 'warning';
      case 'delete': return 'danger';
      default: return 'default';
    }
  };

  const columns: Column[] = [
    { key: 'permission', label: 'Permission', sortable: true },
    { key: 'resource', label: 'Resource', width: '120px' },
    { key: 'action', label: 'Action', width: '100px' },
    { key: 'description', label: FORM_LABELS.DESCRIPTION },
    { key: 'createdAt', label: FORM_LABELS.CREATED_AT, width: '120px' },
  ];

  const renderPermissionRow = (permission: Permission, index: number) => {
    const [resource, action] = permission.name.split('.');
    
    return (
      <tr key={permission.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant="primary" size="sm">
            {resource || 'N/A'}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant={getActionVariant(action)} size="sm">
            {action || 'N/A'}
          </Badge>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-700 max-w-xs">
            {permission.description || 'No description available'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(permission.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </td>
      </tr>
    );
  };

  const summaryFooter = permissions.length > 0 && (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Showing {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
        {permissionFilter && ` matching "${permissionFilter}"`}
      </span>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Badge variant="success" size="sm" className="mr-1">Create</Badge>
        </div>
        <div className="flex items-center">
          <Badge variant="info" size="sm" className="mr-1">View</Badge>
        </div>
        <div className="flex items-center">
          <Badge variant="warning" size="sm" className="mr-1">Update</Badge>
        </div>
        <div className="flex items-center">
          <Badge variant="danger" size="sm" className="mr-1">Delete</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <MessageDisplay
        message={message}
        type={messageType}
        onDismiss={clearMessage}
      />

      {/* Permissions List */}
      <Card 
        title={`System Permissions (${permissions.length})`}
        subtitle="View and manage all system permissions"
        headerAction={
          <div className="flex items-center space-x-3">
            <SearchInput
              placeholder="Filter permissions..."
              onSearch={setPermissionFilter}
              className="w-64"
            />
            <Button 
              variant="primary" 
              size="sm" 
              onClick={fetchPermissions}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
        footer={summaryFooter}
      >
        <Table
          columns={columns}
          data={permissions}
          renderRow={renderPermissionRow}
          emptyMessage={
            permissionFilter 
              ? `No permissions match "${permissionFilter}"` 
              : 'No permissions available in the system'
          }
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default PermissionManagement;
