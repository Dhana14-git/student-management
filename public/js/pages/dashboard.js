'use strict';

const DashboardPage = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="anim-fade-up">
        <div class="stats-grid" id="dashStats">
          ${[...Array(6)].map(() => `
            <div class="stat-card">
              <div class="stat-icon skeleton" style="width:44px;height:44px"></div>
              <div class="stat-body">
                <div class="skeleton" style="height:28px;width:60px;margin-bottom:6px"></div>
                <div class="skeleton" style="height:12px;width:100px"></div>
              </div>
            </div>`).join('')}
        </div>
        <div class="dash-grid">
          <div class="card" id="dashDeptChart">
            <div class="card-header"><span class="card-title">Students by Department</span></div>
            <div class="bar-list" id="deptBars"><div class="spinner-wrap"><div class="spinner"></div></div></div>
          </div>
          <div class="card" id="dashStatusChart">
            <div class="card-header"><span class="card-title">Status Breakdown</span></div>
            <div id="statusDonut" style="display:flex;flex-direction:column;gap:var(--s3);margin-top:var(--s2)"></div>
          </div>
        </div>
        <div class="card mt-5">
          <div class="card-header">
            <span class="card-title">Recently Added Students</span>
            <button class="btn btn-sm btn-outline" onclick="App.navigate('students')">View All →</button>
          </div>
          <div class="table-wrap">
            <div class="table-scroll">
              <table>
                <thead><tr>
                  <th>Student</th><th>ID</th><th>Department</th><th>Status</th><th>GPA</th><th>Enrolled</th>
                </tr></thead>
                <tbody id="recentTable"><tr><td colspan="6"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;

    try {
      const d = await API.dashboard.stats();
      renderStats(d);
      renderDeptBars(d.byDept, d.total);
      renderStatus(d.byStatus);
      renderRecent(d.recent);
    } catch (err) {
      Utils.Toast.error('Failed to load dashboard: ' + err.message);
    }
  }

  function renderStats(d) {
    const stats = [
      { label:'Total Students',  value: d.total,           icon:'🎓', color:'var(--accent)',   delta: `${d.active} active` },
      { label:'Active Students', value: d.active,          icon:'✅', color:'var(--success)',  delta: `${d.total ? Math.round(d.active/d.total*100) : 0}% of total` },
      { label:'Graduated',       value: d.graduated,       icon:'🏆', color:'var(--info)',     delta: 'alumni' },
      { label:'Departments',     value: d.byDept.length,   icon:'🏛️', color:'var(--warning)',  delta: 'active departments' },
      { label:'Avg GPA',         value: d.avgGpa ?? '—',   icon:'📊', color:'var(--accent)',   delta: 'across all students' },
      { label:'Enrollments',     value: d.byStatus.reduce((a,b) => a + Number(b.count), 0), icon:'📚', color:'var(--success)', delta: 'total course enrollments' },
    ];

    document.getElementById('dashStats').innerHTML = stats.map(s => `
      <div class="stat-card anim-fade-up">
        <div class="stat-icon" style="background:${s.color}22;color:${s.color}">${s.icon}</div>
        <div class="stat-body">
          <div class="stat-value">${Utils.escHtml(String(s.value))}</div>
          <div class="stat-label">${Utils.escHtml(s.label)}</div>
          <div class="stat-delta text-muted text-xs">${Utils.escHtml(s.delta)}</div>
        </div>
      </div>`).join('');
  }

  function renderDeptBars(byDept, total) {
    if (!byDept.length) {
      document.getElementById('deptBars').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏛️</div><p>No department data</p></div>';
      return;
    }
    const max = Math.max(...byDept.map(d => d.count)) || 1;
    document.getElementById('deptBars').innerHTML = `
      <div class="bar-list">
        ${byDept.map(d => `
          <div class="bar-item">
            <div class="bar-header">
              <span class="text-sm">${Utils.escHtml(d.name)}</span>
              <span class="text-sm text-muted">${d.count} students</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${Math.round(d.count/max*100)}%"></div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function renderStatus(byStatus) {
    const colors = { Active:'var(--success)', Inactive:'var(--text-muted)', Graduated:'var(--info)', Suspended:'var(--danger)' };
    const total  = byStatus.reduce((a,b) => a + Number(b.count), 0) || 1;

    document.getElementById('statusDonut').innerHTML = byStatus.map(s => `
      <div style="display:flex;align-items:center;gap:var(--s3)">
        <div style="width:10px;height:10px;border-radius:50%;background:${colors[s.status]||'var(--text-muted)'};flex-shrink:0"></div>
        <span class="text-sm flex-1">${Utils.escHtml(s.status)}</span>
        <span class="font-mono text-sm" style="color:${colors[s.status]||'var(--text-muted)'}">${s.count}</span>
        <span class="text-xs text-muted" style="width:38px;text-align:right">${Math.round(s.count/total*100)}%</span>
      </div>`).join('');
  }

  function renderRecent(students) {
    if (!students.length) {
      document.getElementById('recentTable').innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👤</div><h4>No students yet</h4></div></td></tr>`;
      return;
    }
    document.getElementById('recentTable').innerHTML = students.map(s => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:var(--s3)">
            <div class="avatar" style="background:${Utils.avatarColors(s.first_name)}22;color:${Utils.avatarColors(s.first_name)}">${Utils.initials(s.first_name, s.last_name)}</div>
            <div>
              <div class="td-primary">${Utils.escHtml(s.first_name)} ${Utils.escHtml(s.last_name)}</div>
              <div class="text-xs text-muted">${Utils.escHtml(s.email)}</div>
            </div>
          </div>
        </td>
        <td class="td-mono">${Utils.escHtml(s.student_id)}</td>
        <td>${Utils.escHtml(s.department_name || '—')}</td>
        <td>${Utils.statusBadge(s.status)}</td>
        <td class="td-mono">${Utils.fmtGpa(s.gpa)}</td>
        <td class="text-muted text-sm">${Utils.fmtDate(s.created_at)}</td>
      </tr>`).join('');
  }

  return { render };
})();
