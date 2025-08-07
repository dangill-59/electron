export const ProjectsAdmin = {
  async render(container, jwtToken) {
    const res = await fetch('http://localhost:5162/api/projects', {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    const projects = await res.json();
    container.innerHTML = `
      <h3>Projects</h3>
      <button id="createProjectBtn">Create Project</button>
      <ul id="projectsList">
        ${projects.map(p => `
          <li>
            ${p.name}
            <button data-id="${p.id}" class="deleteProjectBtn">Delete</button>
          </li>
        `).join('')}
      </ul>
      <div id="createProjectForm" style="display:none;">
        <input id="projectName" placeholder="Name" />
        <button id="doCreateProject">Create</button>
      </div>
    `;
    document.getElementById('createProjectBtn').onclick = () => {
      document.getElementById('createProjectForm').style.display = 'block';
    };
    document.getElementById('doCreateProject').onclick = async () => {
      const name = document.getElementById('projectName').value;
      await fetch('http://localhost:5162/api/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      this.render(container, jwtToken);
    };
    document.querySelectorAll('.deleteProjectBtn').forEach(btn => {
      btn.onclick = async () => {
        await fetch(`http://localhost:5162/api/projects/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        this.render(container, jwtToken);
      };
    });
  }
};