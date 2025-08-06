window.addEventListener('DOMContentLoaded', () => {
  let token = null;
  let userRole = null;
  let projects = [];
  let currentProject = null;
  let projectFields = [];

  // Auth
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginStatus = document.getElementById('loginStatus');
  const registerBtn = document.getElementById('registerBtn');
  const regUsername = document.getElementById('regUsername');
  const regPassword = document.getElementById('regPassword');
  const regRole = document.getElementById('regRole');
  const registerStatus = document.getElementById('registerStatus');

  // Admin
  const adminPanel = document.getElementById('adminPanel');
  const usersTable = document.getElementById('usersTable');
  const loadUsersBtn = document.getElementById('loadUsersBtn');

  // Projects
  const projectsList = document.getElementById('projectsList');
  const newProjectName = document.getElementById('newProjectName');
  const createProjectBtn = document.getElementById('createProjectBtn');
  const currentProjectName = document.getElementById('currentProjectName');
  const currentProjectName2 = document.getElementById('currentProjectName2');

  // Fields
  const projectFieldsDiv = document.getElementById('projectFields');
  const addFieldBtn = document.getElementById('addFieldBtn');
  const saveFieldsBtn = document.getElementById('saveFieldsBtn');
  const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "list", label: "List (comma separated)" }
  ];

  // Docs
  const docFieldInputs = document.getElementById('docFieldInputs');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const listDocsBtn = document.getElementById('listDocsBtn');
  const docsList = document.getElementById('docsList');
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const uploadBtn = document.getElementById('uploadBtn');
  const externalUrlInput = document.getElementById('externalUrlInput');

  // Page Reordering
  const pagesList = document.getElementById('pagesList');
  const savePageOrderBtn = document.getElementById('savePageOrderBtn');
  let currentDocumentId = null;

  loginBtn.onclick = async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    loginStatus.textContent = 'Logging in...';
    const res = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      token = data.token;
      userRole = data.role;
      loginStatus.textContent = `Logged in as ${userRole}`;
      createProjectBtn.disabled = false;
      addFieldBtn.disabled = false;
      saveFieldsBtn.disabled = false;
      listDocsBtn.disabled = false;
      fileInput.disabled = false;
      uploadBtn.disabled = false;
      externalUrlInput.disabled = false;
      dropZone.style.display = "block";
      adminPanel.style.display = userRole === "admin" ? "block" : "none";
      await loadProjects();
    } else {
      loginStatus.textContent = data.error || 'Login failed';
    }
  };

  registerBtn.onclick = async () => {
    // Only admin can register
    if (userRole !== "admin") return alert("Admin only");
    const username = regUsername.value;
    const password = regPassword.value;
    const role = regRole.value;
    registerStatus.textContent = 'Registering...';
    const res = await fetch('http://localhost:5000/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      registerStatus.textContent = `User created: ${data.username}`;
      regUsername.value = "";
      regPassword.value = "";
      regRole.value = "user";
      await loadUsers();
    } else {
      registerStatus.textContent = data.error || 'Registration failed';
    }
  };

  loadUsersBtn.onclick = loadUsers;

  async function loadUsers() {
    const res = await fetch('http://localhost:5000/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();
    let html = '<tr><th>ID</th><th>Username</th><th>Role</th></tr>';
    users.forEach(u => {
      html += `<tr><td>${u.id}</td><td>${u.username}</td><td>${u.role}</td></tr>`;
    });
    usersTable.innerHTML = html;
  }

  async function loadProjects() {
    const res = await fetch('http://localhost:5000/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    projects = await res.json();
    projectsList.innerHTML = projects.map(
      p => `<li>
        <button onclick="selectProject(${p.id})">${p.name}</button>
      </li>`
    ).join('');
    if (projects.length > 0) selectProject(projects[0].id);
  }

  window.selectProject = async (projectId) => {
    currentProject = projects.find(p => p.id === projectId);
    currentProjectName.textContent = currentProject ? currentProject.name : '';
    currentProjectName2.textContent = currentProject ? currentProject.name : '';
    await loadFields();
    await listDocuments();
    // Optionally clear pages display
    pagesList.innerHTML = '';
    savePageOrderBtn.disabled = true;
    currentDocumentId = null;
  };

  createProjectBtn.onclick = async () => {
    const name = newProjectName.value.trim();
    if (!name) return alert('Project name required');
    const parent_id = currentProject ? currentProject.id : null;
    const res = await fetch('http://localhost:5000/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, parent_id })
    });
    if (res.ok) {
      await loadProjects();
      newProjectName.value = '';
    } else {
      alert('Project creation failed');
    }
  };

  async function loadFields() {
    if (!currentProject) return;
    const res = await fetch(`http://localhost:5000/projects/${currentProject.id}/fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    projectFields = await res.json();
    renderFields();
  }

  function renderFields() {
    let html = '';
    projectFields.forEach((f, idx) => {
      html += `
        <div class="fieldRow">
          <input type="text" value="${f.field_name}" placeholder="Field Name" data-idx="${idx}" class="fieldName">
          <input type="text" value="${f.field_value}" placeholder="Field Value" data-idx="${idx}" class="fieldValue">
          <select class="fieldTypeDropdown" data-idx="${idx}">
            ${FIELD_TYPES.map(ft =>
              `<option value="${ft.value}"${ft.value === f.field_type ? " selected":""}>${ft.label}</option>`
            ).join('')}
          </select>
          <button type="button" class="removeFieldBtn" data-idx="${idx}">Remove</button>
        </div>
      `;
    });
    projectFieldsDiv.innerHTML = html;

    // Attach remove handlers
    document.querySelectorAll('.removeFieldBtn').forEach(btn => {
      btn.onclick = function() {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (idx < projectFields.length) {
          projectFields.splice(idx, 1);
          renderFields();
          renderDocFieldInputs();
        }
      };
    });
    renderDocFieldInputs();
  }

  addFieldBtn.onclick = () => {
    projectFields.push({ field_name: "", field_value: "", field_type: "text" });
    renderFields();
  };

  saveFieldsBtn.onclick = async () => {
    if (!currentProject) return;
    const fieldRows = document.querySelectorAll('.fieldRow');
    const fields = [];
    fieldRows.forEach(row => {
      const name = row.querySelector('.fieldName')?.value.trim();
      const value = row.querySelector('.fieldValue')?.value.trim();
      const type = row.querySelector('.fieldTypeDropdown')?.value;
      if (name) fields.push({ field_name: name, field_value: value, field_type: type });
    });
    const res = await fetch(`http://localhost:5000/projects/${currentProject.id}/fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fields })
    });
    if (res.ok) {
      await loadFields();
      alert('Fields saved');
    } else {
      alert('Saving fields failed');
    }
  };

  function renderDocFieldInputs() {
    if (!projectFields) return;
    let html = '';
    projectFields.forEach((f, idx) => {
      html += `
        <div>
          <label>${f.field_name || 'Field'} (${f.field_type}): </label>
          <input type="text" id="docField_${idx}" placeholder="Value">
        </div>
      `;
    });
    docFieldInputs.innerHTML = html;
  }

  // Drag & drop support
  dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
  dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); };
  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (!currentProject) return alert('Select a project first');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      alert('File ready for upload');
    }
  };

  searchBtn.onclick = async () => {
    const q = searchInput.value.trim();
    if (!q) return;
    const res = await fetch(`http://localhost:5000/search/documents?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const docs = await res.json();
    docsList.innerHTML = docs.map(
      d => `<li>
        ${d.filename} 
        <a href="http://localhost:5000/documents/${d.id}/download" onclick="event.preventDefault(); downloadDoc(${d.id}, '${d.filename}')">Download</a>
        <button onclick="showDocFields(${d.id})">Fields</button>
        ${d.external_url ? `<a href="${d.external_url}" target="_blank">External Image</a>` : ""}
        <button onclick="loadDocumentPages(${d.id})">Pages</button>
        <div id="docFields_${d.id}" style="margin-left: 2em;"></div>
        <button onclick="printDoc('${d.filepath}')">Print</button>
        <button onclick="emailDoc('${d.filename}')">Email</button>
      </li>`).join('');
  };

  listDocsBtn.onclick = listDocuments;
  async function listDocuments() {
    if (!currentProject) return;
    docsList.innerHTML = 'Loading...';
    const res = await fetch(`http://localhost:5000/projects/${currentProject.id}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const docs = await res.json();
    docsList.innerHTML = docs.map(
      d => `<li>
        ${d.filename} 
        <a href="http://localhost:5000/documents/${d.id}/download" onclick="event.preventDefault(); downloadDoc(${d.id}, '${d.filename}')">Download</a>
        <button onclick="showDocFields(${d.id})">Fields</button>
        ${d.external_url ? `<a href="${d.external_url}" target="_blank">External Image</a>` : ""}
        <button onclick="loadDocumentPages(${d.id})">Pages</button>
        <div id="docFields_${d.id}" style="margin-left: 2em;"></div>
        <button onclick="printDoc('${d.filepath}')">Print</button>
        <button onclick="emailDoc('${d.filename}')">Email</button>
      </li>`).join('');
  }

  window.downloadDoc = async (id, filename) => {
    window.open(`http://localhost:5000/documents/${id}/download`, '_blank');
  };

  window.showDocFields = async (id) => {
    const res = await fetch(`http://localhost:5000/documents/${id}/fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fields = await res.json();
    let html = "<ul>";
    fields.forEach(f => {
      html += `<li>${f.field_name}: ${f.field_value}</li>`;
    });
    html += "</ul>";
    document.getElementById(`docFields_${id}`).innerHTML = html;
  };

  window.printDoc = (filepath) => {
    // In Electron, open file in new BrowserWindow and print
    window.open(filepath, '_blank').print();
  };

  window.emailDoc = (filename) => {
    // Opens mailto link
    window.open(`mailto:?subject=Document: ${filename}&body=Attached is the document: ${filename}`);
  };

  uploadBtn.onclick = async () => {
    if (!currentProject) return alert('Select a project');
    const file = fileInput.files[0];
    if (!file && !externalUrlInput.value) return alert('No file or external URL');
    const field_values = {};
    projectFields.forEach((f, idx) => {
      field_values[f.field_name] = document.getElementById(`docField_${idx}`).value;
    });

    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('external_url', externalUrlInput.value);
    formData.append('field_values', JSON.stringify(field_values));

    const res = await fetch(`http://localhost:5000/projects/${currentProject.id}/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      alert('Uploaded');
      await listDocuments();
    } else {
      alert('Upload failed');
    }
  };

  // ===== PAGE REORDERING LOGIC =====

  // Load document pages for reordering
  window.loadDocumentPages = async (documentId) => {
    currentDocumentId = documentId;
    const res = await fetch(`http://localhost:5000/documents/${documentId}/pages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pages = await res.json();
    // pages: [{id, page_number, image_url}]
    pagesList.innerHTML = pages.map((p, idx) =>
      `<li draggable="true" data-pageid="${p.id}">${p.page_number}: <img src="${p.image_url}" width="100"></li>`
    ).join('');
    savePageOrderBtn.disabled = pages.length === 0;
    addDragAndDropHandlers();
  };

  function addDragAndDropHandlers() {
    let dragged = null;
    pagesList.querySelectorAll('li').forEach(li => {
      li.ondragstart = (e) => {
        dragged = li;
      };
      li.ondragover = (e) => {
        e.preventDefault();
      };
      li.ondrop = (e) => {
        e.preventDefault();
        if (dragged && dragged !== li) {
          pagesList.insertBefore(dragged, li.nextSibling);
        }
      };
    });
  }

  savePageOrderBtn.onclick = async () => {
    const newOrder = Array.from(pagesList.children).map(li => parseInt(li.getAttribute('data-pageid')));
    if (!currentDocumentId || newOrder.length === 0) return;
    const res = await fetch(`http://localhost:5000/documents/${currentDocumentId}/pages/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newOrder })
    });
    if (res.ok) {
      alert('Page order saved!');
      await window.loadDocumentPages(currentDocumentId);
    } else {
      alert('Failed to save page order');
    }
  };

});