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

        public void DeleteUser(int id)
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM users WHERE id = $id";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }
    }
}