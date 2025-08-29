# Frontend Architecture Documentation

## Overview

This React TypeScript application implements a Role-Based Access Control (RBAC) system with a clean, modular architecture following DRY principles and modern React patterns.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── shared/          # Reusable UI components
│   ├── layout/          # Layout components
│   ├── pages/           # Page-level components
│   ├── LoginPage.tsx    # Authentication page
│   ├── HomePage.tsx     # Dashboard/home page
│   ├── ProtectedRoute.tsx # Route protection
│   └── Sidebar.tsx      # Navigation sidebar
├── context/
│   └── AuthContext.tsx  # Authentication state management
├── hooks/
│   ├── useMessage.ts    # Message handling hook
│   ├── useApi.ts        # API call hook
│   └── index.ts         # Hooks export
├── services/
│   ├── api.ts           # General API client
│   ├── adminApi.ts      # Admin API client
│   └── index.ts         # Services export
├── types/
│   ├── admin.ts         # Admin-related types
│   └── auth.ts          # Authentication types
├── constants/
│   └── ui.ts            # UI constants and messages
├── utils/               # Utility functions
├── App.tsx              # Main app component
└── index.tsx            # Application entry point
```

## 🧩 Component Architecture

### Shared Components (`/components/shared/`)

Reusable UI components that follow consistent design patterns:

#### Button Component
```tsx
<Button variant="primary" size="md" loading={isLoading} onClick={handleClick}>
  Save Changes
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean - shows spinner when true
- `fullWidth`: boolean - makes button full width

#### Input Component
```tsx
<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Invalid email format"
  required
/>
```

**Features:**
- Built-in label and error handling
- Icon support (left/right)
- Consistent styling and focus states

#### Table Component
```tsx
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' }
];

<Table 
  columns={columns} 
  data={users} 
  renderRow={(user) => (
    <tr key={user.id}>
      <td>{user.name}</td>
      <td>{user.email}</td>
    </tr>
  )}
  loading={isLoading}
  emptyMessage="No users found"
/>
```

**Features:**
- Sortable columns
- Loading and empty states
- Responsive design
- Custom row rendering

#### Card Component
```tsx
<Card 
  title="User Settings" 
  subtitle="Manage your account preferences"
  headerAction={<Button size="sm">Edit</Button>}
>
  <p>Card content goes here</p>
</Card>
```

#### Badge Component
```tsx
<Badge variant="success" dot>Active</Badge>
<Badge variant="danger" size="sm">Inactive</Badge>
```

#### SearchInput Component
```tsx
<SearchInput
  placeholder="Search users..."
  onSearch={(value) => handleSearch(value)}
  debounceMs={300}
/>
```

**Features:**
- Built-in debouncing
- Clear functionality
- Search icon

#### MessageDisplay Component
```tsx
<MessageDisplay
  message="User created successfully"
  type="success"
  onDismiss={() => setMessage('')}
  autoHideDuration={5000}
/>
```

### Layout Components (`/components/layout/`)

#### PageLayout Component
```tsx
<PageLayout 
  title="User Management" 
  subtitle="Manage system users"
  headerAction={<Button>Add User</Button>}
>
  <UserManagement />
</PageLayout>
```

**Features:**
- Consistent page structure
- Responsive sidebar integration
- Header with user welcome message

### Page Components (`/components/pages/`)

#### UserManagement
- User invitation with role selection
- User listing with status indicators
- Search and filtering
- Role assignment interface

#### RoleManagement
- Role creation with permission assignment
- Permission search and selection
- Role listing with assigned permissions

#### PermissionManagement
- View-only permission listing
- Resource/action parsing and color coding
- Search and filtering

## 🎣 Custom Hooks

### useMessage Hook
```tsx
const { message, messageType, showMessage, clearMessage } = useMessage();

showMessage('Success!', 'success');
showMessage('Error occurred', 'error');
```

**Features:**
- Centralized message state management
- Type-safe message types
- Clean API for showing/hiding messages

### useApi Hook
```tsx
const { data, loading, error, execute } = useApi(adminApiClient.getUsers);

useEffect(() => {
  execute();
}, [execute]);
```

**Features:**
- Consistent loading states
- Error handling
- Data fetching patterns

## 🔐 Authentication & Authorization

### AuthContext
Provides global authentication state and permissions:

```tsx
const { user, login, logout, hasResourcePermission } = useAuth();

// Check specific permissions
if (hasResourcePermission('user')) {
  // Show user management
}
```

### ProtectedRoute
```tsx
<ProtectedRoute requiredPermission="user">
  <UserManagement />
</ProtectedRoute>
```

**Features:**
- Authentication checks
- Permission-based access control
- Loading states
- Access denied pages

## 📡 API Layer

### Service Organization
- `api.ts`: General authentication and user APIs
- `adminApi.ts`: Administrative operations
- Centralized axios configuration
- Consistent error handling

### API Client Usage
```tsx
// In components
try {
  const response = await adminApiClient.getUsers();
  setUsers(response.data.data);
} catch (error) {
  showMessage('Failed to fetch users', 'error');
}
```

## 🎨 Styling Strategy

### Tailwind CSS
- Utility-first CSS framework
- Consistent design tokens
- Responsive design built-in
- Custom component styling

### Design System
- **Colors**: Blue (primary), Gray (neutral), Red (danger), Green (success)
- **Spacing**: Consistent padding and margins using Tailwind scale
- **Typography**: Clear hierarchy with proper font weights
- **Shadows**: Subtle elevation for cards and dropdowns

## 🔧 Development Patterns

### Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use composition for flexibility
3. **Props Interface**: Clear, typed props with good defaults
4. **Error Boundaries**: Graceful error handling
5. **Accessibility**: ARIA labels and keyboard navigation

### State Management

1. **Local State**: useState for component-specific state
2. **Context**: useContext for global state (auth, theme)
3. **Custom Hooks**: Encapsulate complex logic
4. **Form State**: Controlled components with validation

### Code Organization

1. **File Naming**: PascalCase for components, camelCase for utilities
2. **Import Organization**: External libs → Internal → Relative imports
3. **Export Strategy**: Named exports for utilities, default for components
4. **Type Safety**: Comprehensive TypeScript coverage

## 📝 Best Practices

### Component Development
```tsx
/**
 * Component Documentation
 * 
 * Brief description of what the component does.
 * Include usage examples and important props.
 */

interface ComponentProps {
  // Well-documented prop types
  title: string;
  optional?: boolean;
}

const Component: React.FC<ComponentProps> = ({ title, optional = false }) => {
  // Component implementation
};
```

### Error Handling
```tsx
try {
  await apiCall();
  showMessage('Success!', 'success');
} catch (error: any) {
  const message = error.response?.data?.message || 'Operation failed';
  showMessage(message, 'error');
}
```

### Performance Optimization
- Use React.memo for expensive components
- Implement proper key props for lists
- Debounce search inputs
- Lazy load routes and components

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm start
```

### Building
```bash
npm run build
```

## 📚 Learning Resources

### React Concepts Used
- **Hooks**: useState, useEffect, useContext, custom hooks
- **Context API**: Global state management
- **React Router**: Client-side routing
- **TypeScript**: Type safety and better DX
- **Composition**: Building complex UIs from simple components

### Key Libraries
- **React Router DOM**: Navigation and routing
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Static type checking

This architecture provides a solid foundation for scalable React applications with clear separation of concerns, reusable components, and maintainable code structure.