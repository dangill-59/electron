const express = require('express');
const db = require('./db');
const multer = require('multer');
const upload = multer({ dest: process.env.FILE_STORAGE_PATH || 'uploads/' });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

function adminOnly(req, res, next) {
  db.get('SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [req.user.id], (err, row) => {
    if (row && row.name === 'admin') return next();
    res.status(403).json({ error: 'Admin only' });
  });
}

// User registration (admin only)
router.post('/admin/users', auth, adminOnly, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  db.get('SELECT id FROM roles WHERE name = ?', [role], (err, roleRow) => {
    if (!roleRow) return res.status(400).json({ error: 'Invalid role' });
    const hash = bcrypt.hashSync(password, 8);
    db.run('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', [username, hash, roleRow.id], function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, username, role });
    });
  });
});

// User login (returns role)
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE username = ?', [username], (err, user) => {
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, role: user.role });
  });
});

// List users (admin only)
router.get('/admin/users', auth, adminOnly, (req, res) => {
  db.all('SELECT u.id, u.username, r.name as role FROM users u JOIN roles r ON u.role_id = r.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Projects, fields, documents (same as before, plus external_url for images)
router.get('/projects', auth, (req, res) => {
  db.all('SELECT * FROM projects WHERE owner = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
router.post('/projects', auth, (req, res) => {
  const { name, parent_id } = req.body;
  db.run(
    'INSERT INTO projects (name, owner, parent_id) VALUES (?, ?, ?)',
    [name, req.user.id, parent_id || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name });
    }
  );
});
router.post('/projects/:project_id/fields', auth, (req, res) => {
  const { fields } = req.body;
  if (!Array.isArray(fields)) return res.status(400).json({ error: 'fields must be an array' });
  const project_id = req.params.project_id;
  db.run('DELETE FROM project_fields WHERE project_id = ?', [project_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    fields.forEach(field => {
      db.run('INSERT INTO project_fields (project_id, field_name, field_value, field_type) VALUES (?, ?, ?, ?)',
        [project_id, field.field_name, field.field_value, field.field_type]);
    });
    res.json({ success: true });
  });
});
router.get('/projects/:project_id/fields', auth, (req, res) => {
  db.all('SELECT * FROM project_fields WHERE project_id = ?', [req.params.project_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// List documents in a project
router.get('/projects/:project_id/documents', auth, (req, res) => {
  db.all(
    'SELECT * FROM documents WHERE owner = ? AND project_id = ?',
    [req.user.id, req.params.project_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Upload document (image upload, external repo URL, index fields)
router.post('/projects/:project_id/documents/upload', auth, upload.single('file'), (req, res) => {
  const { originalname, path } = req.file;
  const external_url = req.body.external_url || ""; // If uploaded elsewhere, use this URL
  let field_values = {};
  if (req.body.field_values) {
    try {
      field_values = JSON.parse(req.body.field_values);
    } catch (e) {
      field_values = {};
    }
  }
  db.run(
    'INSERT INTO documents (filename, filepath, external_url, owner, project_id) VALUES (?, ?, ?, ?, ?)',
    [originalname, path, external_url, req.user.id, req.params.project_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const document_id = this.lastID;
      Object.entries(field_values).forEach(([field_name, field_value]) => {
        db.run(
          'INSERT INTO document_fields (document_id, field_name, field_value) VALUES (?, ?, ?)',
          [document_id, field_name, field_value]
        );
      });
      res.json({ id: document_id, filename: originalname });
    }
  );
});

// Drag & drop upload, scan upload handled client-side, this is the endpoint
// Get indexed fields for a document
router.get('/documents/:id/fields', auth, (req, res) => {
  db.all('SELECT field_name, field_value FROM document_fields WHERE document_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Download document
router.get('/documents/:id/download', auth, (req, res) => {
  db.get('SELECT * FROM documents WHERE id = ? AND owner = ?', [req.params.id, req.user.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    res.download(row.filepath, row.filename);
  });
});

// Document search
router.get('/search/documents', auth, (req, res) => {
  // Example: ?q=keyword
  const q = req.query.q || '';
  db.all(`
    SELECT d.*, df.field_name, df.field_value
    FROM documents d
    LEFT JOIN document_fields df ON df.document_id = d.id
    WHERE d.owner = ?
      AND (
        d.filename LIKE ? OR
        df.field_value LIKE ?
      )
    GROUP BY d.id
  `, [req.user.id, `%${q}%`, `%${q}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get pages for a document
router.get('/documents/:id/pages', auth, (req, res) => {
  db.all('SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Reorder pages for a document
router.post('/documents/:id/pages/reorder', auth, (req, res) => {
  const { newOrder } = req.body; // Array of page IDs in new order
  if (!Array.isArray(newOrder)) return res.status(400).json({ error: 'newOrder must be array of page IDs' });
  // Update page_number for each page
  newOrder.forEach((pageId, idx) => {
    db.run('UPDATE document_pages SET page_number = ? WHERE id = ?', [idx + 1, pageId]);
  });
  res.json({ success: true });
});

module.exports = router;