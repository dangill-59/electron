const SERVER_URL = 'http://localhost:5162';

let jwtToken = null;
let currentUser = null;

function showTab(tabName) {
  document.getElementById('documentsTab').style.display = tabName === 'documents' ? 'block' : 'none';
  document.getElementById('adminTab').style.display = tabName === 'admin' ? 'block' : 'none';
  document.getElementById('loginTab').style.display = tabName === 'login' ? 'block' : 'none';
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
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
    document.getElementById('loginError').innerText = 'Invalid credentials';
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
  const res = await fetch(`${SERVER_URL}/api/projects`, {
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  const projects = await res.json();
  let html = `<h3>Projects</h3><button onclick="showCreateProject()">Create Project</button><ul>`;
  projects.forEach(p => {
    html += `<li>${p.name} <button onclick="deleteProject(${p.id})">Delete</button></li>`;
  });
  html += '</ul>';
  document.getElementById('adminContent').innerHTML = html;
}

function showCreateProject() {
  document.getElementById('adminContent').innerHTML = `
    <h3>Create Project</h3>
    <input id="projectName" placeholder="Name" />
    <button onclick="createProject()">Create</button>
  `;
}

async function createProject() {
  const name = document.getElementById('projectName').value;
  await fetch(`${SERVER_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  loadProjects();
}

async function deleteProject(id) {
  await fetch(`${SERVER_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  loadProjects();
}

async function loadUsers() {
  const res = await fetch(`${SERVER_URL}/api/users`, {
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  const users = await res.json();
  let html = `<h3>Users</h3><button onclick="showCreateUser()">Create User</button><ul>`;
  users.forEach(u => {
    html += `<li>${u.username} (${u.role}) <button onclick="deleteUser(${u.id})">Delete</button></li>`;
  });
  html += '</ul>';
  document.getElementById('adminContent').innerHTML = html;
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
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  await fetch(`${SERVER_URL}/api/users`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });
  loadUsers();
}

async function deleteUser(id) {
  await fetch(`${SERVER_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  loadUsers();
}

async function loadRoles() {
  const res = await fetch(`${SERVER_URL}/api/roles`, {
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  const roles = await res.json();
  let html = `<h3>Roles</h3><ul>`;
  roles.forEach(r => {
    html += `<li>${r.name}</li>`;
  });
  html += '</ul>';
  document.getElementById('adminContent').innerHTML = html;
}