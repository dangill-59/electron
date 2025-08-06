const db = require('./db');
const bcrypt = require('bcryptjs');

// Drop tables for dev
db.run('DROP TABLE IF EXISTS document_fields');
db.run('DROP TABLE IF EXISTS documents');
db.run('DROP TABLE IF EXISTS projects');
db.run('DROP TABLE IF EXISTS project_fields');
db.run('DROP TABLE IF EXISTS users');
db.run('DROP TABLE IF EXISTS roles');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role_id INTEGER,
    FOREIGN KEY(role_id) REFERENCES roles(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    owner INTEGER,
    parent_id INTEGER,
    FOREIGN KEY(owner) REFERENCES users(id),
    FOREIGN KEY(parent_id) REFERENCES projects(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS project_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    field_name TEXT,
    field_value TEXT,
    field_type TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    filepath TEXT,
    external_url TEXT,
    owner INTEGER,
    project_id INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS document_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER,
    field_name TEXT,
    field_value TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS document_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER,
  page_number INTEGER,
  image_url TEXT,
  FOREIGN KEY(document_id) REFERENCES documents(id)
)`);

  // Seed roles
  db.run('INSERT OR IGNORE INTO roles (name) VALUES (?)', ['admin']);
  db.run('INSERT OR IGNORE INTO roles (name) VALUES (?)', ['user']);

  // Seed default admin
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      db.get('SELECT id FROM roles WHERE name = ?', ['admin'], (err, role) => {
        const hash = bcrypt.hashSync('admin123', 8);
        db.run('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', ['admin', hash, role.id], function () {
          db.run('INSERT INTO projects (name, owner, parent_id) VALUES (?, ?, ?)', ['Demo Project', this.lastID, null]);
        });
      });
    }
  });
});