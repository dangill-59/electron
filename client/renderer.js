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
    html += `<li>${p.name} 
      <button onclick="manageProjectFields(${p.id}, '${p.name}')">Manage Fields</button>
      <button onclick="deleteProject(${p.id})">Delete</button>
    </li>`;
  });
  html += '</ul>';
  document.getElementById('adminContent').innerHTML = html;
}

function showCreateProject() {
  document.getElementById('adminContent').innerHTML = `
    <h3>Create Project</h3>
    <input id="projectName" placeholder="Name" />
    <div id="customFieldsContainer"></div>
    <button onclick="createProject()">Create</button>
    <button onclick="loadProjects()">Cancel</button>
  `;
  loadAvailableFieldsForCreation();
}

async function loadAvailableFieldsForCreation() {
  // For now, we'll just show a message about fields being manageable after creation
  // In a more advanced implementation, you could have project templates with predefined fields
  document.getElementById('customFieldsContainer').innerHTML = `
    <p><em>Custom fields can be added after creating the project using "Manage Fields"</em></p>
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

// Project Fields Management
async function manageProjectFields(projectId, projectName) {
  const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/fields`, {
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  const fields = await res.json();
  
  let html = `
    <h3>Manage Fields for "${projectName}"</h3>
    <button onclick="loadProjects()">Back to Projects</button>
    <button onclick="showCreateProjectField(${projectId})">Add Field</button>
    <div id="fieldsContainer">
      <h4>Current Fields:</h4>
      <ul>
  `;
  
  if (fields.length === 0) {
    html += '<li>No fields defined</li>';
  } else {
    fields.forEach(field => {
      html += `
        <li>
          <strong>${field.name}</strong> (${field.type})
          ${field.type === 'list' && field.listOptions ? ` - Options: ${field.listOptions}` : ''}
          <button onclick="deleteProjectField(${field.id}, ${projectId}, '${projectName}')">Delete</button>
        </li>
      `;
    });
  }
  
  html += '</ul></div>';
  document.getElementById('adminContent').innerHTML = html;
}

function showCreateProjectField(projectId) {
  const fieldsContainer = document.getElementById('fieldsContainer');
  fieldsContainer.innerHTML = `
    <h4>Add New Field:</h4>
    <div>
      <input id="fieldName" placeholder="Field Name" />
      <select id="fieldType" onchange="toggleListOptions()">
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="date">Date</option>
        <option value="list">List</option>
      </select>
      <div id="listOptionsContainer" style="display:none;">
        <input id="listOptions" placeholder="Options (comma-separated)" />
      </div>
      <button onclick="createProjectField(${projectId})">Create Field</button>
      <button onclick="manageProjectFields(${projectId}, document.querySelector('h3').textContent.split('"')[1])">Cancel</button>
    </div>
  `;
}

function toggleListOptions() {
  const fieldType = document.getElementById('fieldType').value;
  const container = document.getElementById('listOptionsContainer');
  container.style.display = fieldType === 'list' ? 'block' : 'none';
}

async function createProjectField(projectId) {
  const name = document.getElementById('fieldName').value;
  const type = document.getElementById('fieldType').value;
  const listOptions = type === 'list' ? document.getElementById('listOptions').value : null;
  
  if (!name.trim()) {
    alert('Field name is required');
    return;
  }
  
  if (type === 'list' && (!listOptions || !listOptions.trim())) {
    alert('List options are required for list type fields');
    return;
  }
  
  await fetch(`${SERVER_URL}/api/projects/${projectId}/fields`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, listOptions })
  });
  
  // Get project name and refresh the fields view
  const projectName = document.querySelector('h3').textContent.split('"')[1];
  manageProjectFields(projectId, projectName);
}

async function deleteProjectField(fieldId, projectId, projectName) {
  if (confirm('Are you sure you want to delete this field?')) {
    await fetch(`${SERVER_URL}/api/projects/fields/${fieldId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    manageProjectFields(projectId, projectName);
  }
}