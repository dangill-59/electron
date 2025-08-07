using Microsoft.Data.Sqlite;
using System.Collections.Generic;

namespace DocumentDmsServer.Services
{
    public class UserDb
    {
        private readonly string _connStr = "Data Source=documentdms.db";
        
        // System admin user constants - this user is permanent and cannot be deleted or modified
        private const string SYSTEM_ADMIN_USERNAME = "sa";
        private const string SYSTEM_ADMIN_PASSWORD = "SR2025$!";
        private const string SYSTEM_ADMIN_ROLE = "admin";
        
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
            
            // Ensure the permanent system admin user 'sa' always exists
            // This user is required for system administration and cannot be deleted or modified
            EnsureSystemAdminUserExists(conn);
        }
        
        /// <summary>
        /// Ensures that the permanent system admin user 'sa' exists in the database.
        /// This user is automatically created on initialization if it doesn't exist and
        /// cannot be deleted or have its password changed through normal user management operations.
        /// </summary>
        private void EnsureSystemAdminUserExists(SqliteConnection conn)
        {
            // Check if 'sa' user already exists
            var checkCmd = conn.CreateCommand();
            checkCmd.CommandText = "SELECT COUNT(*) FROM users WHERE username = $username";
            checkCmd.Parameters.AddWithValue("$username", SYSTEM_ADMIN_USERNAME);
            
            var count = Convert.ToInt32(checkCmd.ExecuteScalar());
            if (count == 0)
            {
                // Create the system admin user
                var insertCmd = conn.CreateCommand();
                insertCmd.CommandText = "INSERT INTO users (username, passwordHash, role) VALUES ($username, $hash, $role)";
                insertCmd.Parameters.AddWithValue("$username", SYSTEM_ADMIN_USERNAME);
                insertCmd.Parameters.AddWithValue("$hash", BCrypt.Net.BCrypt.HashPassword(SYSTEM_ADMIN_PASSWORD));
                insertCmd.Parameters.AddWithValue("$role", SYSTEM_ADMIN_ROLE);
                insertCmd.ExecuteNonQuery();
            }
        }

        /// <summary>
        /// Checks if the specified username is the permanent system admin user.
        /// </summary>
        /// <param name="username">The username to check</param>
        /// <returns>True if the username is the system admin, false otherwise</returns>
        public bool IsSystemAdminUser(string username)
        {
            return string.Equals(username, SYSTEM_ADMIN_USERNAME, StringComparison.OrdinalIgnoreCase);
        }
        
        /// <summary>
        /// Checks if the specified user ID belongs to the permanent system admin user.
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <returns>True if the user ID belongs to the system admin, false otherwise</returns>
        public bool IsSystemAdminUser(int userId)
        {
            var user = GetUserById(userId);
            return user != null && IsSystemAdminUser(user.Username);
        }
        
        /// <summary>
        /// Gets a user by their ID.
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>The user if found, null otherwise</returns>
        public User? GetUserById(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM users WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                return new User
                {
                    Id = reader.GetInt32(0),
                    Username = reader.GetString(1),
                    PasswordHash = reader.GetString(2),
                    Role = reader.GetString(3)
                };
            }
            return null;
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
                return new User
                {
                    Id = reader.GetInt32(0),
                    Username = reader.GetString(1),
                    PasswordHash = reader.GetString(2),
                    Role = reader.GetString(3)
                };
            }
            return null;
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

        /// <summary>
        /// Deletes a user from the database.
        /// Note: The permanent system admin user 'sa' cannot be deleted and will throw an exception.
        /// </summary>
        /// <param name="id">The ID of the user to delete</param>
        /// <exception cref="InvalidOperationException">Thrown when attempting to delete the system admin user</exception>
        public void DeleteUser(int id)
        {
            // Prevent deletion of the system admin user
            if (IsSystemAdminUser(id))
            {
                throw new InvalidOperationException("Cannot delete the permanent system admin user 'sa'.");
            }
            
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM users WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }
    }
}