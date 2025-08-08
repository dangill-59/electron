export const UsersAdmin = {
  async render(container, jwtToken) {
    // Fetch users and roles
    const [usersRes, rolesRes] = await Promise.all([
      fetch('http://localhost:5162/api/users', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      }),
      fetch('http://localhost:5162/api/roles', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
    ]);
    
    const users = await usersRes.json();
    const roles = await rolesRes.json();
    
    // Get user roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        try {
          const roleRes = await fetch(`http://localhost:5162/api/users/${user.id}/roles`, {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const userRoles = await roleRes.json();
          return { ...user, userRoles };
        } catch (e) {
          return { ...user, userRoles: [] };
        }
      })
    );

    container.innerHTML = `
      <h3>Users</h3>
      <button id="createUserBtn">Create User</button>
      <ul id="usersList">
        ${usersWithRoles.map(u => `
          <li>
            <div>
              <strong>${u.username}</strong> 
              <span style="color: #666;">(Legacy: ${u.role})</span>
              <br/>
              <small>Roles: ${u.userRoles.map(r => r.name).join(', ') || 'None'}</small>
            </div>
            <div>
              <button data-id="${u.id}" class="editUserRolesBtn">Edit Roles</button>
              <button data-id="${u.id}" class="deleteUserBtn">Delete</button>
            </div>
          </li>
        `).join('')}
      </ul>
      <div id="createUserForm" style="display:none;">
        <h4>Create User</h4>
        <input id="newUsername" placeholder="Username" />
        <input id="newPassword" type="password" placeholder="Password" />
        <select id="newRole">
          <option>admin</option>
          <option>user</option>
        </select>
        <button id="doCreateUser">Create</button>
        <button id="cancelCreateUser">Cancel</button>
      </div>
      <div id="editRolesForm" style="display:none;">
        <h4>Edit User Roles</h4>
        <div id="roleCheckboxes">
          ${roles.map(role => `
            <label>
              <input type="checkbox" value="${role.id}" data-role-name="${role.name}"> ${role.name}
            </label><br/>
          `).join('')}
        </div>
        <button id="doUpdateRoles">Update Roles</button>
        <button id="cancelEditRoles">Cancel</button>
      </div>
    `;

    let currentEditUserId = null;

    document.getElementById('createUserBtn').onclick = () => {
      document.getElementById('createUserForm').style.display = 'block';
      document.getElementById('editRolesForm').style.display = 'none';
    };

    document.getElementById('cancelCreateUser').onclick = () => {
      document.getElementById('createUserForm').style.display = 'none';
    };

    document.getElementById('cancelEditRoles').onclick = () => {
      document.getElementById('editRolesForm').style.display = 'none';
      currentEditUserId = null;
    };

    document.getElementById('doCreateUser').onclick = async () => {
      const username = document.getElementById('newUsername').value;
      const password = document.getElementById('newPassword').value;
      const role = document.getElementById('newRole').value;
      
      await fetch('http://localhost:5162/api/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      
      this.render(container, jwtToken);
    };

    document.getElementById('doUpdateRoles').onclick = async () => {
      if (!currentEditUserId) return;
      
      const checkboxes = document.querySelectorAll('#roleCheckboxes input[type="checkbox"]:checked');
      const roleIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
      
      await fetch(`http://localhost:5162/api/users/${currentEditUserId}/roles`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentEditUserId, roleIds })
      });
      
      this.render(container, jwtToken);
    };

    document.querySelectorAll('.deleteUserBtn').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('Are you sure you want to delete this user?')) {
          await fetch(`http://localhost:5162/api/users/${btn.dataset.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          this.render(container, jwtToken);
        }
      };
    });

    document.querySelectorAll('.editUserRolesBtn').forEach(btn => {
      btn.onclick = async () => {
        currentEditUserId = parseInt(btn.dataset.id);
        const user = usersWithRoles.find(u => u.id == currentEditUserId);
        
        // Show role editing form
        document.getElementById('createUserForm').style.display = 'none';
        document.getElementById('editRolesForm').style.display = 'block';
        
        // Clear all checkboxes first
        document.querySelectorAll('#roleCheckboxes input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        
        // Check boxes for user's current roles
        if (user && user.userRoles) {
          user.userRoles.forEach(role => {
            const checkbox = document.querySelector(`#roleCheckboxes input[value="${role.id}"]`);
            if (checkbox) checkbox.checked = true;
          });
        }
      };
    });
  }
};