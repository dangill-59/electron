export const RolesAdmin = {
  async render(container, jwtToken) {
    const res = await fetch('http://localhost:5162/api/roles', {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    const roles = await res.json();
    container.innerHTML = `
      <h3>Roles</h3>
      <ul>
        ${roles.map(r => `<li>${r.name}</li>`).join('')}
      </ul>
    `;
  }
};