import { ProjectsAdmin } from './adminProjects.js';
import { UsersAdmin } from './adminUsers.js';
import { RolesAdmin } from './adminRoles.js';

export const AdminPanel = {
  init(jwtToken, currentUser) {
    this.jwtToken = jwtToken;
    this.currentUser = currentUser;
    this.container = document.getElementById('adminTab');
    if (!jwtToken || !currentUser || !currentUser.isAdmin) {
      this.container.innerHTML = '<p>Admin access required.</p>';
      return;
    }
    this.render();
  },

  render(tab = 'projects') {
    this.container.innerHTML = `
      <h2>Admin Panel</h2>
      <nav>
        <button id="adminProjectsBtn">Projects</button>
        <button id="adminUsersBtn">Users</button>
        <button id="adminRolesBtn">Roles</button>
      </nav>
      <div id="adminContent"></div>
    `;
    document.getElementById('adminProjectsBtn').onclick = () => this.showTab('projects');
    document.getElementById('adminUsersBtn').onclick = () => this.showTab('users');
    document.getElementById('adminRolesBtn').onclick = () => this.showTab('roles');
    this.showTab(tab);
  },

  showTab(tab) {
    const contentEl = document.getElementById('adminContent');
    switch (tab) {
      case 'projects':
        ProjectsAdmin.render(contentEl, this.jwtToken);
        break;
      case 'users':
        UsersAdmin.render(contentEl, this.jwtToken);
        break;
      case 'roles':
        RolesAdmin.render(contentEl, this.jwtToken);
        break;
    }
  }
};