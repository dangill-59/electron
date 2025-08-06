using Microsoft.Data.Sqlite;
using System.Collections.Generic;

namespace DocumentDmsServer.Services
{
    public class RoleDb
    {
        private readonly string _connStr = "Data Source=documentdms.db";
        public RoleDb()
        {
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT)";
            cmd.ExecuteNonQuery();
        }

        public List<Role> GetRoles()
        {
            var list = new List<Role>();
            using var conn = new SqliteConnection(_connStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM roles";
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Role
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1)
                });
            }
            return list;
        }
    }
}