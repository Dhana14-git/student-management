'use strict';

const App = (() => {

  const ROUTES = {
    dashboard:   { label: 'Dashboard',   icon: '📊', page: () => DashboardPage   },
    students:    { label: 'Students',    icon: '🎓', page: () => StudentsPage    },
    departments: { label: 'Departments', icon: '🏛️', page: () => DepartmentsPage },
    courses:     { label: 'Courses',     icon: '📚', page: () => CoursesPage     },
  };

  let currentRoute = null;

  function init() {
    if (!localStorage.getItem('token')) {
      window.location.href = '/login.html';
      return;
    }

    renderShell();
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigate(hash in ROUTES ? hash : 'dashboard');
  }

  function renderShell() {
    document.body.innerHTML = `
      <div id="app">
        <aside id="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">🎓</div>
            <div class="sidebar-brand">Student<span>MS</span></div>
          </div>
          <nav class="sidebar-nav">
            <div class="nav-section">
              <div class="nav-section-label">Menu</div>
              ${Object.entries(ROUTES).map(([key, r]) => `
                <div class="nav-item" data-route="${key}" onclick="App.navigate('${key}')">
                  <span class="nav-icon">${r.icon}</span>
                  <span class="nav-label">${r.label}</span>
                </div>`).join('')}
            </div>
          </nav>
          <div class="sidebar-footer">
            <div class="user-block">
              <div class="user-avatar">A</div>
              <div class="user-info">
                <div class="user-name">Administrator</div>
                <div class="user-role">System Admin</div>
              </div>
              <button class="user-logout" title="Logout" onclick="App.logout()">⏻</button>
            </div>
          </div>
        </aside>

        <div id="sidebar-overlay" onclick="App.closeSidebar()"></div>

        <main id="main">
          <header id="topbar">
            <button class="menu-toggle" id="menuToggle" onclick="App.toggleSidebar()">☰</button>
            <span id="topbarTitle">Dashboard</span>
            <div id="topbarActions"></div>
          </header>
          <div id="content"></div>
        </main>
      </div>
      <div id="toast-container"></div>`;
  }

  function navigate(route) {
    if (!(route in ROUTES)) route = 'dashboard';

    currentRoute = route;
    window.location.hash = route;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });

    // Update topbar title
    const topbarTitle = document.getElementById('topbarTitle');
    if (topbarTitle) topbarTitle.textContent = ROUTES[route].label;

    // Close mobile sidebar
    closeSidebar();

    // Render page
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '';
      const pageModule = ROUTES[route].page();
      pageModule.render(content);
    }
  }

  function toggleSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    const isOpen   = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isOpen);
    overlay.classList.toggle('show', !isOpen);
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('show');
  }

  function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }

  return { init, navigate, toggleSidebar, closeSidebar, logout };
})();

document.addEventListener('DOMContentLoaded', App.init);
