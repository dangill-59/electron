import { AdminPanel } from './admin.js';

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
  AdminPanel.init(jwtToken, currentUser);
}

// You can keep your document management and other logic here...

window.showTab = showTab;
window.login = login;
window.loadAdminPanel = loadAdminPanel;