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
    html += `<li>
      ${p.name} 
      <button onclick="manageCustomFields(${p.id}, '${p.name}')">Custom Fields</button>
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

// Custom Field Management Functions

async function manageCustomFields(projectId, projectName) {
  try {
    const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/custom-fields`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const customFields = await res.json();
    
    let html = `
      <h3>Custom Fields for Project: ${projectName}</h3>
      <button onclick="showCreateCustomField(${projectId}, '${projectName}')">Add Custom Field</button>
      <button onclick="loadProjects()">Back to Projects</button>
      <ul>
    `;
    
    customFields.forEach(field => {
      html += `<li>
        <strong>${field.name}</strong> (${field.type})
        ${field.options ? `Options: ${field.options}` : ''}
        <button onclick="deleteCustomField(${projectId}, ${field.id}, '${projectName}')">Delete</button>
      </li>`;
    });
    
    html += '</ul>';
    document.getElementById('adminContent').innerHTML = html;
  } catch (error) {
    console.error('Error loading custom fields:', error);
    document.getElementById('adminContent').innerHTML = '<p>Error loading custom fields.</p>';
  }
}

function showCreateCustomField(projectId, projectName) {
  const html = `
    <h3>Add Custom Field to Project: ${projectName}</h3>
    <div>
      <label>Field Name:</label>
      <input type="text" id="customFieldName" required />
    </div>
    <div>
      <label>Field Type:</label>
      <select id="customFieldType" onchange="showOptionsField()">
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="date">Date</option>
        <option value="boolean">Boolean</option>
        <option value="select">Select (Dropdown)</option>
      </select>
    </div>
    <div id="optionsContainer" style="display:none;">
      <label>Options (comma-separated):</label>
      <input type="text" id="customFieldOptions" placeholder="Option 1, Option 2, Option 3" />
      <small>For dropdown fields, enter comma-separated options</small>
    </div>
    <div>
      <button onclick="createCustomField(${projectId}, '${projectName}')">Create Field</button>
      <button onclick="manageCustomFields(${projectId}, '${projectName}')">Cancel</button>
    </div>
  `;
  document.getElementById('adminContent').innerHTML = html;
}

function showOptionsField() {
  const type = document.getElementById('customFieldType').value;
  const container = document.getElementById('optionsContainer');
  container.style.display = type === 'select' ? 'block' : 'none';
}

async function createCustomField(projectId, projectName) {
  const name = document.getElementById('customFieldName').value;
  const type = document.getElementById('customFieldType').value;
  const optionsInput = document.getElementById('customFieldOptions').value;
  
  if (!name.trim()) {
    alert('Please enter a field name.');
    return;
  }
  
  let options = null;
  if (type === 'select' && optionsInput.trim()) {
    const optionArray = optionsInput.split(',').map(opt => opt.trim()).filter(opt => opt);
    options = JSON.stringify(optionArray);
  }
  
  try {
    const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/custom-fields`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, type, options })
    });

    if (res.ok) {
      alert('Custom field created successfully!');
      manageCustomFields(projectId, projectName);
    } else {
      alert('Error creating custom field.');
    }
  } catch (error) {
    console.error('Error creating custom field:', error);
    alert('Error creating custom field.');
  }
}

async function deleteCustomField(projectId, customFieldId, projectName) {
  if (!confirm('Are you sure you want to delete this custom field? This will also delete all associated values.')) {
    return;
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/custom-fields/${customFieldId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    if (res.ok) {
      alert('Custom field deleted successfully!');
      manageCustomFields(projectId, projectName);
    } else {
      alert('Error deleting custom field.');
    }
  } catch (error) {
    console.error('Error deleting custom field:', error);
    alert('Error deleting custom field.');
  }
}

// Document Management Functions

async function loadDocuments() {
  try {
    const res = await fetch(`${SERVER_URL}/documents`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const documents = await res.json();
    let html = `<h3>Documents</h3><ul>`;
    documents.forEach(doc => {
      html += `<li>
        <strong>${doc.title || 'Untitled'}</strong> - ${doc.filename || 'No file'} 
        ${doc.projectId ? `(Project ID: ${doc.projectId})` : ''}
        <button onclick="downloadDocument(${doc.id})">Download</button>
        <button onclick="deleteDocument(${doc.id})">Delete</button>
      </li>`;
    });
    html += '</ul>';
    document.getElementById('documentContent').innerHTML = html;
  } catch (error) {
    console.error('Error loading documents:', error);
    document.getElementById('documentContent').innerHTML = '<p>Error loading documents.</p>';
  }
}

async function showUploadForm() {
  // First load projects to show in dropdown
  try {
    const res = await fetch(`${SERVER_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const projects = await res.json();
    
    let projectOptions = '<option value="">No Project</option>';
    projects.forEach(p => {
      projectOptions += `<option value="${p.id}">${p.name}</option>`;
    });

    const html = `
      <h3>Upload Document</h3>
      <form id="uploadForm">
        <div>
          <label>Title:</label>
          <input type="text" id="docTitle" required />
        </div>
        <div>
          <label>Description:</label>
          <textarea id="docDescription"></textarea>
        </div>
        <div>
          <label>Owner:</label>
          <input type="text" id="docOwner" required />
        </div>
        <div>
          <label>Project:</label>
          <select id="docProject" onchange="loadCustomFieldsForProject()">${projectOptions}</select>
        </div>
        <div id="customFieldsContainer">
          <!-- Custom fields will be loaded here -->
        </div>
        <div>
          <label>File:</label>
          <input type="file" id="docFile" required />
        </div>
        <button type="button" onclick="uploadDocument()">Upload</button>
        <button type="button" onclick="loadDocuments()">Cancel</button>
      </form>
    `;
    document.getElementById('documentContent').innerHTML = html;
  } catch (error) {
    console.error('Error loading projects:', error);
    document.getElementById('documentContent').innerHTML = '<p>Error loading upload form.</p>';
  }
}

async function loadCustomFieldsForProject() {
  const projectId = document.getElementById('docProject').value;
  const container = document.getElementById('customFieldsContainer');
  
  if (!projectId) {
    container.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/custom-fields`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const customFields = await res.json();
    
    if (customFields.length === 0) {
      container.innerHTML = '<p><em>No custom fields defined for this project.</em></p>';
      return;
    }

    let html = '<h4>Custom Fields</h4>';
    customFields.forEach(field => {
      html += `<div>
        <label>${field.name}:</label>`;
      
      switch (field.type) {
        case 'text':
          html += `<input type="text" id="customField_${field.id}" />`;
          break;
        case 'number':
          html += `<input type="number" id="customField_${field.id}" />`;
          break;
        case 'date':
          html += `<input type="date" id="customField_${field.id}" />`;
          break;
        case 'boolean':
          html += `<input type="checkbox" id="customField_${field.id}" />`;
          break;
        case 'select':
          const options = field.options ? JSON.parse(field.options) : [];
          html += `<select id="customField_${field.id}">`;
          options.forEach(option => {
            html += `<option value="${option}">${option}</option>`;
          });
          html += `</select>`;
          break;
        default:
          html += `<input type="text" id="customField_${field.id}" />`;
      }
      html += `</div>`;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading custom fields:', error);
    container.innerHTML = '<p>Error loading custom fields.</p>';
  }
}

async function uploadDocument() {
  const title = document.getElementById('docTitle').value;
  const description = document.getElementById('docDescription').value;
  const owner = document.getElementById('docOwner').value;
  const projectId = document.getElementById('docProject').value;
  const file = document.getElementById('docFile').files[0];

  if (!title || !owner || !file) {
    alert('Please fill in all required fields and select a file.');
    return;
  }

  // Collect custom field values
  const customFieldValues = {};
  const customFieldInputs = document.querySelectorAll('[id^="customField_"]');
  customFieldInputs.forEach(input => {
    const fieldId = input.id.replace('customField_', '');
    let value = input.type === 'checkbox' ? input.checked.toString() : input.value;
    if (value) {
      customFieldValues[fieldId] = value;
    }
  });

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('owner', owner);
  formData.append('file', file);
  
  if (projectId) {
    formData.append('projectId', projectId);
    formData.append('customFieldValues', JSON.stringify(customFieldValues));
  }

  try {
    const res = await fetch(`${SERVER_URL}/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwtToken}` },
      body: formData
    });

    if (res.ok) {
      alert('Document uploaded successfully!');
      loadDocuments();
    } else {
      alert('Error uploading document.');
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    alert('Error uploading document.');
  }
}

async function downloadDocument(id) {
  try {
    const res = await fetch(`${SERVER_URL}/documents/download/${id}`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `document_${id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      alert('Error downloading document.');
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Error downloading document.');
  }
}

async function deleteDocument(id) {
  if (!confirm('Are you sure you want to delete this document?')) {
    return;
  }

  try {
    const res = await fetch(`${SERVER_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    if (res.ok) {
      alert('Document deleted successfully!');
      loadDocuments();
    } else {
      alert('Error deleting document.');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('Error deleting document.');
  }
}

async function showSearchForm() {
  try {
    const res = await fetch(`${SERVER_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const projects = await res.json();
    
    let projectOptions = '<option value="">Select Project</option>';
    projects.forEach(p => {
      projectOptions += `<option value="${p.id}">${p.name}</option>`;
    });

    const html = `
      <h3>Search Documents by Custom Fields</h3>
      <div>
        <label>Project:</label>
        <select id="searchProject" onchange="loadCustomFieldsForSearch()">${projectOptions}</select>
      </div>
      <div id="searchCustomFieldsContainer">
        <!-- Custom fields will be loaded here -->
      </div>
      <div id="searchResults">
        <!-- Search results will appear here -->
      </div>
      <button onclick="loadDocuments()">Back to All Documents</button>
    `;
    document.getElementById('documentContent').innerHTML = html;
  } catch (error) {
    console.error('Error loading search form:', error);
    document.getElementById('documentContent').innerHTML = '<p>Error loading search form.</p>';
  }
}

async function loadCustomFieldsForSearch() {
  const projectId = document.getElementById('searchProject').value;
  const container = document.getElementById('searchCustomFieldsContainer');
  
  if (!projectId) {
    container.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/custom-fields`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const customFields = await res.json();
    
    if (customFields.length === 0) {
      container.innerHTML = '<p><em>No custom fields defined for this project.</em></p>';
      return;
    }

    let html = '<h4>Search by Custom Fields</h4>';
    customFields.forEach(field => {
      html += `<div>
        <label>${field.name}:</label>
        <input type="text" id="searchField_${field.id}" placeholder="Search value" />
        <button onclick="searchByCustomField(${projectId}, ${field.id})">Search</button>
      </div>`;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading custom fields for search:', error);
    container.innerHTML = '<p>Error loading custom fields.</p>';
  }
}

async function searchByCustomField(projectId, customFieldId) {
  const searchValue = document.getElementById(`searchField_${customFieldId}`).value;
  
  if (!searchValue.trim()) {
    alert('Please enter a search value.');
    return;
  }

  try {
    const res = await fetch(`${SERVER_URL}/documents/search?projectId=${projectId}&customFieldId=${customFieldId}&searchValue=${encodeURIComponent(searchValue)}`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const documents = await res.json();
    
    let html = `<h4>Search Results</h4>`;
    if (documents.length === 0) {
      html += '<p>No documents found matching the search criteria.</p>';
    } else {
      html += '<ul>';
      documents.forEach(doc => {
        html += `<li>
          <strong>${doc.title || 'Untitled'}</strong> - ${doc.filename || 'No file'}
          <button onclick="downloadDocument(${doc.id})">Download</button>
        </li>`;
      });
      html += '</ul>';
    }
    
    document.getElementById('searchResults').innerHTML = html;
  } catch (error) {
    console.error('Error searching documents:', error);
    document.getElementById('searchResults').innerHTML = '<p>Error performing search.</p>';
  }
}

// Load documents when the tab is shown
document.addEventListener('DOMContentLoaded', function() {
  // Auto-load documents when documents tab is shown
  const originalShowTab = showTab;
  showTab = function(tabName) {
    originalShowTab(tabName);
    if (tabName === 'documents' && jwtToken) {
      loadDocuments();
    }
  };
});