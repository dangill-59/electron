using Microsoft.Data.Sqlite;
using System.Collections.Generic;

namespace DocumentDmsServer.Services
{
    public class UserDb
    {
        private readonly string _connStr = "Data Source=documentdms.db";
        public UserDb()
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                username TEXT UNIQUE, 
                passwordHash TEXT, 
                role TEXT)";
            cmd.ExecuteNonQuery();

            // Create user_roles table for many-to-many relationships
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, role_id),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE)";
            cmd.ExecuteNonQuery();

            // Create indexes for performance
            cmd.CommandText = @"CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id)";
            cmd.ExecuteNonQuery();
            cmd.CommandText = @"CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id)";
            cmd.ExecuteNonQuery();
        }

        public void AddUser(string username, string password, string role)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT INTO users (username, passwordHash, role) VALUES ($username, $hash, $role)";
            cmd.Parameters.AddWithValue("$username", username);
            cmd.Parameters.AddWithValue("$hash", BCrypt.Net.BCrypt.HashPassword(password));
            cmd.Parameters.AddWithValue("$role", role);
            cmd.ExecuteNonQuery();
        }

        public User? GetUserByUsername(string username)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM users WHERE username = $username";
            cmd.Parameters.AddWithValue("$username", username);
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                var user = new User
                {
                    Id = reader.GetInt32(0),
                    Username = reader.GetString(1),
                    PasswordHash = reader.GetString(2),
                    Role = reader.GetString(3)
                };
                return user;
            }
            return null;
        }

        public User? GetUserWithRoles(int userId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            
            // Get user
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM users WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", userId);
            
            User? user = null;
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                user = new User
                {
                    Id = reader.GetInt32(0),
                    Username = reader.GetString(1),
                    PasswordHash = reader.GetString(2),
                    Role = reader.GetString(3)
                };
            }
            reader.Close();
            
            if (user == null) return null;

            // Get user's roles
            cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT r.id, r.name FROM roles r 
                               JOIN user_roles ur ON r.id = ur.role_id 
                               WHERE ur.user_id = $userId";
            cmd.Parameters.AddWithValue("$userId", userId);
            
            using var roleReader = cmd.ExecuteReader();
            while (roleReader.Read())
            {
                user.Roles.Add(new Role
                {
                    Id = roleReader.GetInt32(0),
                    Name = roleReader.GetString(1)
                });
            }
            
            return user;
        }

        public List<User> GetUsers()
        {
            var list = new List<User>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM users";
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new User
                {
                    Id = reader.GetInt32(0),
                    Username = reader.GetString(1),
                    PasswordHash = reader.GetString(2),
                    Role = reader.GetString(3)
                });
            }
            return list;
        }

        public void DeleteUser(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM users WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }

        // New methods for many-to-many user-role relationships

        public void AssignRolesToUser(int userId, List<int> roleIds)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            
            // First remove existing roles for this user
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM user_roles WHERE user_id = $userId";
            cmd.Parameters.AddWithValue("$userId", userId);
            cmd.ExecuteNonQuery();

            // Add new roles
            foreach (int roleId in roleIds)
            {
                cmd = conn.CreateCommand();
                cmd.CommandText = "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES ($userId, $roleId)";
                cmd.Parameters.AddWithValue("$userId", userId);
                cmd.Parameters.AddWithValue("$roleId", roleId);
                cmd.ExecuteNonQuery();
            }
        }

        public void AddRoleToUser(int userId, int roleId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES ($userId, $roleId)";
            cmd.Parameters.AddWithValue("$userId", userId);
            cmd.Parameters.AddWithValue("$roleId", roleId);
            cmd.ExecuteNonQuery();
        }

        public void RemoveRoleFromUser(int userId, int roleId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM user_roles WHERE user_id = $userId AND role_id = $roleId";
            cmd.Parameters.AddWithValue("$userId", userId);
            cmd.Parameters.AddWithValue("$roleId", roleId);
            cmd.ExecuteNonQuery();
        }

        public List<Role> GetUserRoles(int userId)
        {
            var roles = new List<Role>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT r.id, r.name FROM roles r 
                               JOIN user_roles ur ON r.id = ur.role_id 
                               WHERE ur.user_id = $userId";
            cmd.Parameters.AddWithValue("$userId", userId);
            
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                roles.Add(new Role
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                });
            }
            return roles;
        }

        public bool UserHasRoleForProject(int userId, string roleName, int projectId)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            
            // Check if user has the specified role for the specified project
            cmd.CommandText = @"SELECT COUNT(*) FROM user_roles ur
                               JOIN roles r ON ur.role_id = r.id
                               JOIN role_projects rp ON r.id = rp.role_id
                               WHERE ur.user_id = $userId AND r.name = $roleName AND rp.project_id = $projectId";
            cmd.Parameters.AddWithValue("$userId", userId);
            cmd.Parameters.AddWithValue("$roleName", roleName);
            cmd.Parameters.AddWithValue("$projectId", projectId);
            
            var result = cmd.ExecuteScalar();
            return result != null && (long)result > 0;
        }

        public bool UserHasRole(int userId, string roleName)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            
            // Check if user has the specified role (regardless of project)
            cmd.CommandText = @"SELECT COUNT(*) FROM user_roles ur
                               JOIN roles r ON ur.role_id = r.id
                               WHERE ur.user_id = $userId AND r.name = $roleName";
            cmd.Parameters.AddWithValue("$userId", userId);
            cmd.Parameters.AddWithValue("$roleName", roleName);
            
            var result = cmd.ExecuteScalar();
            return result != null && (long)result > 0;
        }
    }
}