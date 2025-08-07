export const UsersAdmin = {
  async render(container, jwtToken) {
    const res = await fetch('http://localhost:5162/api/users', {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    const users = await res.json();
    container.innerHTML = `
      <h3>Users</h3>
      <button id="createUserBtn">Create User</button>
      <ul id="usersList">
        ${users.map(u => `
          <li>
            ${u.username} (${u.role})
            <button data-id="${u.id}" class="deleteUserBtn">Delete</button>
          </li>
        `).join('')}
      </ul>
      <div id="createUserForm" style="display:none;">
        <input id="newUsername" placeholder="Username" />
        <input id="newPassword" type="password" placeholder="Password" />
        <select id="newRole">
          <option>admin</option>
          <option>user</option>
        </select>
        <button id="doCreateUser">Create</button>
      </div>
    `;
    document.getElementById('createUserBtn').onclick = () => {
      document.getElementById('createUserForm').style.display = 'block';
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
    document.querySelectorAll('.deleteUserBtn').forEach(btn => {
      btn.onclick = async () => {
        await fetch(`http://localhost:5162/api/users/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        this.render(container, jwtToken);
      };
    });
  }
};