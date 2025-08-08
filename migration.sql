-- Migration script to add many-to-many relationships for RBAC
-- This script creates new tables and migrates existing data

-- Create user_roles table for many-to-many relationship between users and roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- Create role_projects table for many-to-many relationship between roles and projects
CREATE TABLE IF NOT EXISTS role_projects (
    role_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, project_id),
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Seed basic roles if they don't exist
INSERT OR IGNORE INTO roles (name) VALUES ('superadmin');
INSERT OR IGNORE INTO roles (name) VALUES ('admin');
INSERT OR IGNORE INTO roles (name) VALUES ('user');
INSERT OR IGNORE INTO roles (name) VALUES ('viewer');

-- Migrate existing user roles to user_roles table
-- This assumes users have role strings that match role names
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON u.role = r.name
WHERE u.role IS NOT NULL AND u.role != '';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_role_projects_role_id ON role_projects (role_id);
CREATE INDEX IF NOT EXISTS idx_role_projects_project_id ON role_projects (project_id);

-- Note: The original role column in users table is kept for backward compatibility
-- It can be removed in a future migration once all code is updated