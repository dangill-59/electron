export const RolesAdmin = {
  async render(container, jwtToken) {
    // Fetch roles and projects
    const [rolesRes, projectsRes] = await Promise.all([
      fetch('http://localhost:5162/api/roles', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      }),
      fetch('http://localhost:5162/api/projects', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
    ]);
    
    const roles = await rolesRes.json();
    const projects = await projectsRes.json();
    
    // Get projects for each role
    const rolesWithProjects = await Promise.all(
      roles.map(async (role) => {
        try {
          const projectRes = await fetch(`http://localhost:5162/api/roles/${role.id}/projects`, {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const roleProjectIds = await projectRes.json();
          const roleProjects = projects.filter(p => roleProjectIds.includes(p.id));
          return { ...role, roleProjects, roleProjectIds };
        } catch (e) {
          return { ...role, roleProjects: [], roleProjectIds: [] };
        }
      })
    );

    container.innerHTML = `
      <h3>Roles</h3>
      <button id="createRoleBtn">Create Role</button>
      <ul id="rolesList">
        ${rolesWithProjects.map(r => `
          <li>
            <div>
              <strong>${r.name}</strong>
              <br/>
              <small>Projects: ${r.roleProjects.map(p => p.name).join(', ') || 'None'}</small>
            </div>
            <div>
              <button data-id="${r.id}" class="editRoleProjectsBtn">Edit Projects</button>
              <button data-id="${r.id}" class="deleteRoleBtn">Delete</button>
            </div>
          </li>
        `).join('')}
      </ul>
      <div id="createRoleForm" style="display:none;">
        <h4>Create Role</h4>
        <input id="newRoleName" placeholder="Role Name" />
        <button id="doCreateRole">Create</button>
        <button id="cancelCreateRole">Cancel</button>
      </div>
      <div id="editProjectsForm" style="display:none;">
        <h4>Edit Role Projects</h4>
        <div id="projectCheckboxes">
          ${projects.map(project => `
            <label>
              <input type="checkbox" value="${project.id}" data-project-name="${project.name}"> ${project.name}
            </label><br/>
          `).join('')}
        </div>
        <button id="doUpdateProjects">Update Projects</button>
        <button id="cancelEditProjects">Cancel</button>
      </div>
    `;

    let currentEditRoleId = null;

    document.getElementById('createRoleBtn').onclick = () => {
      document.getElementById('createRoleForm').style.display = 'block';
      document.getElementById('editProjectsForm').style.display = 'none';
    };

    document.getElementById('cancelCreateRole').onclick = () => {
      document.getElementById('createRoleForm').style.display = 'none';
    };

    document.getElementById('cancelEditProjects').onclick = () => {
      document.getElementById('editProjectsForm').style.display = 'none';
      currentEditRoleId = null;
    };

    document.getElementById('doCreateRole').onclick = async () => {
      const name = document.getElementById('newRoleName').value;
      if (!name) return;
      
      await fetch('http://localhost:5162/api/roles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      this.render(container, jwtToken);
    };

    document.getElementById('doUpdateProjects').onclick = async () => {
      if (!currentEditRoleId) return;
      
      const checkboxes = document.querySelectorAll('#projectCheckboxes input[type="checkbox"]:checked');
      const projectIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
      
      await fetch(`http://localhost:5162/api/roles/${currentEditRoleId}/projects`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: currentEditRoleId, projectIds })
      });
      
      this.render(container, jwtToken);
    };

    document.querySelectorAll('.deleteRoleBtn').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('Are you sure you want to delete this role?')) {
          await fetch(`http://localhost:5162/api/roles/${btn.dataset.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          this.render(container, jwtToken);
        }
      };
    });

    document.querySelectorAll('.editRoleProjectsBtn').forEach(btn => {
      btn.onclick = async () => {
        currentEditRoleId = parseInt(btn.dataset.id);
        const role = rolesWithProjects.find(r => r.id == currentEditRoleId);
        
        // Show project editing form
        document.getElementById('createRoleForm').style.display = 'none';
        document.getElementById('editProjectsForm').style.display = 'block';
        
        // Clear all checkboxes first
        document.querySelectorAll('#projectCheckboxes input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        
        // Check boxes for role's current projects
        if (role && role.roleProjectIds) {
          role.roleProjectIds.forEach(projectId => {
            const checkbox = document.querySelector(`#projectCheckboxes input[value="${projectId}"]`);
            if (checkbox) checkbox.checked = true;
          });
        }
      };
    });
  }
};