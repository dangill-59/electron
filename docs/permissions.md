# Role-Based Access Control (RBAC) System

## Overview

This system implements a many-to-many role-based access control model where:
- Users can have multiple roles
- Roles can be assigned to multiple projects
- Permission checks verify if user X has role Y for project Z

## Database Schema

### Core Tables

1. **users** - User accounts
   - `id` (PRIMARY KEY)
   - `username` (UNIQUE)
   - `passwordHash`
   - `role` (deprecated, kept for backward compatibility)

2. **roles** - Available roles in the system
   - `id` (PRIMARY KEY)  
   - `name` (role name like 'admin', 'user', 'viewer')

3. **projects** - Projects in the system
   - `id` (PRIMARY KEY)
   - `name` (project name)

### Relationship Tables

4. **user_roles** - Many-to-many relationship between users and roles
   - `user_id` (FOREIGN KEY to users.id)
   - `role_id` (FOREIGN KEY to roles.id)
   - PRIMARY KEY: (user_id, role_id)

5. **role_projects** - Many-to-many relationship between roles and projects  
   - `role_id` (FOREIGN KEY to roles.id)
   - `project_id` (FOREIGN KEY to projects.id)
   - PRIMARY KEY: (role_id, project_id)

## Permission Model

### Role Hierarchy
- **superadmin**: Full system access to all projects
- **admin**: Administrative access to assigned projects
- **user**: Standard user access to assigned projects  
- **viewer**: Read-only access to assigned projects

### Permission Checks

The system checks permissions using the pattern:
```
Does user X have role Y for project Z?
```

This is implemented by querying:
```sql
SELECT COUNT(*) FROM user_roles ur
JOIN role_projects rp ON ur.role_id = rp.role_id  
WHERE ur.user_id = X AND ur.role_id = (SELECT id FROM roles WHERE name = 'Y') 
AND rp.project_id = Z
```

For superadmin roles, project restrictions may be bypassed.

## API Endpoints

### Role Assignment
- `POST /api/users/{userId}/roles` - Assign roles to a user
- `DELETE /api/users/{userId}/roles/{roleId}` - Remove role from user
- `GET /api/users/{userId}/roles` - Get user's roles

### Role-Project Assignment  
- `POST /api/roles/{roleId}/projects` - Assign projects to a role
- `DELETE /api/roles/{roleId}/projects/{projectId}` - Remove project from role
- `GET /api/roles/{roleId}/projects` - Get role's projects

### Permission Checks
- `GET /api/permissions/check?userId={id}&role={name}&projectId={id}` - Check if user has role for project

## JWT Token Structure

JWT tokens now include all user roles:
```json
{
  "sub": "username",
  "UserId": "123",
  "roles": ["admin", "user"],
  "exp": 1234567890
}
```

## Migration from Old System

The migration process:
1. Runs `migration.sql` to create new tables
2. Seeds basic roles (superadmin, admin, user, viewer) 
3. Migrates existing user role strings to user_roles table
4. Preserves original role column for backward compatibility

Existing role strings in the users table are mapped to the new normalized roles during migration.

## Frontend Usage

The admin interface supports:
- Multi-select role assignment for users
- Project assignment to roles
- Visual representation of user permissions per project

## Implementation Notes

- Superadmin users bypass project restrictions
- Role names are case-sensitive
- The system maintains backward compatibility during transition
- Database indexes are created for optimal query performance