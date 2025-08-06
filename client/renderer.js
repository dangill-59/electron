const SERVER_URL = 'http://localhost:5162';

let jwtToken = null;
let currentUser = null;

// Utility functions for consistent error handling
function displayError(message, elementId = 'adminContent') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div style="color: red; padding: 10px; margin: 10px 0; border: 1px solid #ff6b6b; border-radius: 4px; background-color: #ffe0e0;">
      <strong>Error:</strong> ${message}
    </div>`;
  }
}

function logError(operation, error) {
  console.error(`Error in ${operation}:`, error);
  console.error('Stack trace:', error.stack);
}

function showTab(tabName) {
  document.getElementById('documentsTab').style.display = tabName === 'documents' ? 'block' : 'none';
  document.getElementById('adminTab').style.display = tabName === 'admin' ? 'block' : 'none';
  document.getElementById('loginTab').style.display = tabName === 'login' ? 'block' : 'none';
}

async function login() {
  try {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
      document.getElementById('loginError').innerText = 'Please enter both username and password';
      return;
    }

    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      jwtToken = data.token;
      currentUser = data.user;
      document.getElementById('loginError').innerText = '';
      showTab('documents');
      loadAdminPanel();
    } else {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || `Login failed (${res.status})`;
      document.getElementById('loginError').innerText = errorMessage;
      logError('login', new Error(`HTTP ${res.status}: ${errorMessage}`));
    }
  } catch (error) {
    const userMessage = 'Unable to connect to server. Please check your connection and try again.';
    document.getElementById('loginError').innerText = userMessage;
    logError('login', error);
  }
}

function loadAdminPanel() {
  if (!jwtToken || !currentUser || !currentUser.isAdmin) {
    document.getElementById('adminTab').innerHTML = '<p>Admin access required.</p>';
    return;
  }
  document.getElementById('adminTab').innerHTML = `
    <h2>Admin Panel</h2>
    <button onclick="loadProjects()">Projects</button>
    <button onclick="loadUsers()">Users</button>
    <button onclick="loadRoles()">Roles</button>
    <div id="adminContent"></div>
  `;
}

async function loadProjects() {
  try {
    const res = await fetch(`${SERVER_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load projects (${res.status})`);
    }
    
    const projects = await res.json();
    let html = `<h3>Projects</h3><button onclick="showCreateProject()">Create Project</button><ul>`;
    projects.forEach(p => {
      html += `<li>${p.name} <button onclick="deleteProject(${p.id})">Delete</button></li>`;
    });
    html += '</ul>';
    document.getElementById('adminContent').innerHTML = html;
  } catch (error) {
    displayError('Failed to load projects. Please try again.', 'adminContent');
    logError('loadProjects', error);
  }
}

function showCreateProject() {
  document.getElementById('adminContent').innerHTML = `
    <h3>Create Project</h3>
    <input id="projectName" placeholder="Name" />
    <button onclick="createProject()">Create</button>
  `;
}

async function createProject() {
  try {
    const name = document.getElementById('projectName').value;
    
    if (!name) {
      displayError('Please enter a project name.', 'adminContent');
      return;
    }
    
    const res = await fetch(`${SERVER_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to create project (${res.status})`;
      throw new Error(errorMessage);
    }
    
    loadProjects();
  } catch (error) {
    displayError('Failed to create project. Please try again.', 'adminContent');
    logError('createProject', error);
  }
}

async function deleteProject(id) {
  try {
    const res = await fetch(`${SERVER_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to delete project (${res.status})`;
      throw new Error(errorMessage);
    }
    
    loadProjects();
  } catch (error) {
    displayError('Failed to delete project. Please try again.', 'adminContent');
    logError('deleteProject', error);
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${SERVER_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load users (${res.status})`);
    }
    
    const users = await res.json();
    let html = `<h3>Users</h3><button onclick="showCreateUser()">Create User</button><ul>`;
    users.forEach(u => {
      html += `<li>${u.username} (${u.role}) <button onclick="deleteUser(${u.id})">Delete</button></li>`;
    });
    html += '</ul>';
    document.getElementById('adminContent').innerHTML = html;
  } catch (error) {
    displayError('Failed to load users. Please try again.', 'adminContent');
    logError('loadUsers', error);
  }
}

function showCreateUser() {
  document.getElementById('adminContent').innerHTML = `
    <h3>Create User</h3>
    <input id="newUsername" placeholder="Username" />
    <input id="newPassword" type="password" placeholder="Password" />
    <select id="newRole"><option>admin</option><option>user</option></select>
    <button onclick="createUser()">Create</button>
  `;
}

async function createUser() {
  try {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !password) {
      displayError('Please enter both username and password.', 'adminContent');
      return;
    }
    
    const res = await fetch(`${SERVER_URL}/api/users`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to create user (${res.status})`;
      throw new Error(errorMessage);
    }
    
    loadUsers();
  } catch (error) {
    displayError('Failed to create user. Please try again.', 'adminContent');
    logError('createUser', error);
  }
}

async function deleteUser(id) {
  try {
    const res = await fetch(`${SERVER_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to delete user (${res.status})`;
      throw new Error(errorMessage);
    }
    
    loadUsers();
  } catch (error) {
    displayError('Failed to delete user. Please try again.', 'adminContent');
    logError('deleteUser', error);
  }
}

async function loadRoles() {
  try {
    const res = await fetch(`${SERVER_URL}/api/roles`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load roles (${res.status})`);
    }
    
    const roles = await res.json();
    let html = `<h3>Roles</h3><ul>`;
    roles.forEach(r => {
      html += `<li>${r.name}</li>`;
    });
    html += '</ul>';
    document.getElementById('adminContent').innerHTML = html;
  } catch (error) {
    displayError('Failed to load roles. Please try again.', 'adminContent');
    logError('loadRoles', error);
  }
}