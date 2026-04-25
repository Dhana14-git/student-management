'use strict';

const DepartmentsPage = (() => {

  let state = {
    search: '', sort: 'name', dir: 'ASC',
    page: 1, limit: 25,
  };

  async function render(container) {
    container.innerHTML = `
      <div class="anim-fade-up">
        <div class="section-header">
          <div>
            <div class="section-eyebrow">Management</div>
            <h2>Departments</h2>
          </div>
          <button class="btn btn-primary" id="btnAddDept">+ Add Department</button>
        </div>

        <div class="filter-bar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input class="form-control search-input" id="deptSearch" placeholder="Search name, code, head…" value="${Utils.escHtml(state.search)}">
          </div>
          <select class="form-control" id="deptSort" style="width:180px">
            <option value="name|ASC">Name A–Z</option>
            <option value="name|DESC">Name Z–A</option>
            <option value="code|ASC">Code A–Z</option>
            <option value="student_count|DESC">Most Students</option>
            <option value="course_count|DESC">Most Courses</option>
            <option value="created_at|DESC">Newest First</option>
          </select>
        </div>

        <div class="card-grid" id="deptGrid">
          ${[...Array(5)].map(() => `
            <div class="dept-card">
              <div class="skeleton" style="height:40px;width:40px;border-radius:var(--r3);margin-bottom:var(--s3)"></div>
              <div class="skeleton" style="height:18px;width:60%;margin-bottom:var(--s2)"></div>
              <div class="skeleton" style="height:12px;width:80%"></div>
            </div>`).join('')}
        </div>
        <div id="deptPagination"></div>
      </div>`;

    const searchEl = container.querySelector('#deptSearch');
    const sortEl   = container.querySelector('#deptSort');

    // Restore current sort state in dropdown
    sortEl.value = `${state.sort}|${state.dir}`;

    searchEl.addEventListener('input', Utils.debounce(e => {
      state.search = e.target.value; state.page = 1; loadDepts();
    }, 350));

    sortEl.addEventListener('change', e => {
      const [col, dir] = e.target.value.split('|');
      state.sort = col; state.dir = dir; state.page = 1; loadDepts();
    });

    document.getElementById('btnAddDept').onclick = () => openDeptModal();
    await loadDepts();
  }

  async function loadDepts() {
    const grid = document.getElementById('deptGrid');
    const pag  = document.getElementById('deptPagination');
    if (!grid) return;

    try {
      const res = await API.departments.list({
        search: state.search,
        sort:   state.sort,
        dir:    state.dir,
        page:   state.page,
        limit:  state.limit,
      });

      if (!res.data.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🏛️</div><h4>No departments found</h4><p>Add your first department or adjust filters.</p></div>`;
        if (pag) pag.innerHTML = '';
        return;
      }

      const icons  = ['💻','📐','🔭','💼','⚙️','🧬','🎨','📖','🌍','🧪'];
      const colors = ['#5d7af6','#34d399','#f59e0b','#f87171','#a78bfa','#38bdf8','#fb7185','#4ade80','#fbbf24','#60a5fa'];

      grid.innerHTML = res.data.map((d, i) => {
        const color = colors[i % colors.length];
        const icon  = icons[i % icons.length];
        return `
          <div class="dept-card">
            <div class="dept-card-header">
              <div class="dept-icon" style="background:${color}22;color:${color}">${icon}</div>
              <span class="dept-code">${Utils.escHtml(d.code)}</span>
            </div>
            <div class="dept-name">${Utils.escHtml(d.name)}</div>
            <div class="dept-head text-muted">👤 ${Utils.escHtml(d.head_name || 'No head assigned')}</div>
            ${d.description ? `<div class="text-xs text-muted mt-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${Utils.escHtml(d.description)}</div>` : ''}
            <div class="dept-meta">
              <div class="dept-stat flex-1">
                <div class="dept-stat-value" style="color:${color}">${d.student_count}</div>
                <div class="dept-stat-label">Students</div>
              </div>
              <div style="width:1px;background:var(--border)"></div>
              <div class="dept-stat flex-1">
                <div class="dept-stat-value" style="color:${color}">${d.course_count}</div>
                <div class="dept-stat-label">Courses</div>
              </div>
              <div style="width:1px;background:var(--border)"></div>
              <div class="dept-stat flex-1">
                <div class="dept-stat-value" style="color:${color}">${Utils.fmtDate(d.created_at).split(' ')[2]||'—'}</div>
                <div class="dept-stat-label">Since</div>
              </div>
            </div>
            <div class="dept-actions">
              <button class="btn btn-sm btn-outline" onclick="DepartmentsPage.edit(${d.id})">✏️ Edit</button>
              <button class="btn btn-sm btn-danger" onclick="DepartmentsPage.remove(${d.id}, '${Utils.escHtml(d.name)}')">🗑️ Delete</button>
            </div>
          </div>`;
      }).join('');

      if (pag) pag.innerHTML = Utils.renderPagination(res, p => { state.page = p; loadDepts(); });

    } catch (err) {
      Utils.Toast.error('Failed to load departments: ' + err.message);
    }
  }

  // ── Form modal ───────────────────────────────────────────────────────────
  function deptFormHTML(d = {}) {
    return `
      <form id="deptForm" autocomplete="off">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Department Name *</label>
            <input class="form-control" name="name" value="${Utils.escHtml(d.name||'')}" placeholder="Computer Science" maxlength="100">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Code * (alphanumeric, max 10)</label>
            <input class="form-control" name="code" value="${Utils.escHtml(d.code||'')}" placeholder="CS" maxlength="10" style="text-transform:uppercase">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Head Name</label>
            <input class="form-control" name="head_name" value="${Utils.escHtml(d.head_name||'')}" placeholder="Dr. Jane Smith" maxlength="100">
            <span class="form-error"></span>
          </div>
          <div class="form-group span-2">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" placeholder="Brief description of the department…">${Utils.escHtml(d.description||'')}</textarea>
            <span class="form-error"></span>
          </div>
        </div>
      </form>`;
  }

  function openDeptModal(dept = null) {
    const isEdit = !!dept;
    const modal  = Utils.Modal.open({
      title: isEdit ? 'Edit Department' : 'Add Department',
      body: deptFormHTML(dept || {}),
      footer: `
        <button class="btn btn-outline" id="deptCancel">Cancel</button>
        <button class="btn btn-primary" id="deptSave">${isEdit ? 'Save Changes' : 'Add Department'}</button>`,
    });

    modal.el.querySelector('#deptCancel').onclick = modal.close;
    modal.el.querySelector('#deptSave').onclick   = async () => {
      const form = modal.el.querySelector('#deptForm');
      const data = Utils.getFormData(form);
      if (!Validate.department(data, form)) return;

      const saveBtn = modal.el.querySelector('#deptSave');
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

      try {
        if (isEdit) {
          await API.departments.update(dept.id, data);
          Utils.Toast.success('Department updated');
        } else {
          await API.departments.create(data);
          Utils.Toast.success('Department added');
        }
        modal.close();
        loadDepts();
      } catch (err) {
        if (err.field) Utils.formError(form.querySelector(`[name="${err.field}"]`), err.message);
        else Utils.Toast.error(err.message);
        saveBtn.disabled = false; saveBtn.textContent = isEdit ? 'Save Changes' : 'Add Department';
      }
    };
  }

  async function edit(id) {
    try {
      const d = await API.departments.get(id);
      openDeptModal(d);
    } catch (err) { Utils.Toast.error(err.message); }
  }

  async function remove(id, name) {
    const ok = await Utils.Modal.confirm({
      title: 'Delete Department',
      icon: '🏛️',
      message: `Delete <span class="confirm-name">${Utils.escHtml(name)}</span>? Departments with students or courses cannot be deleted.`,
    });
    if (!ok) return;
    try {
      await API.departments.delete(id);
      Utils.Toast.success(`${name} deleted`);
      loadDepts();
    } catch (err) { Utils.Toast.error(err.message); }
  }

  return { render, edit, remove };
})();
