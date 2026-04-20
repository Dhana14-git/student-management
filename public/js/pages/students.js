'use strict';

const StudentsPage = (() => {

  let state = {
    search: '', status: '', department_id: '', sort: 'last_name', dir: 'ASC',
    page: 1, limit: 10, departments: [],
  };

  // ── Render shell ─────────────────────────────────────────────────────────
  async function render(container) {
    state.departments = await loadDepts();

    container.innerHTML = `
      <div class="anim-fade-up">
        <div class="section-header">
          <div>
            <div class="section-eyebrow">Management</div>
            <h2>Students</h2>
          </div>
          <button class="btn btn-primary" id="btnAddStudent">+ Add Student</button>
        </div>

        <div class="filter-bar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input class="form-control search-input" id="stuSearch" placeholder="Search name, ID, email…" value="${Utils.escHtml(state.search)}">
          </div>
          <select class="form-control" id="stuStatus" style="width:150px">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
            <option value="Suspended">Suspended</option>
          </select>
          <select class="form-control" id="stuDept" style="width:180px">
            <option value="">All Departments</option>
            ${state.departments.map(d => `<option value="${d.id}">${Utils.escHtml(d.name)}</option>`).join('')}
          </select>
          <select class="form-control" id="stuLimit" style="width:100px">
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>

        <div class="card" style="padding:0">
          <div class="table-wrap">
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th class="sortable" data-col="student_id">ID <span class="sort-icon"></span></th>
                    <th class="sortable" data-col="email">Email <span class="sort-icon"></span></th>
                    <th>Department</th>
                    <th class="sortable" data-col="status">Status <span class="sort-icon"></span></th>
                    <th class="sortable" data-col="gpa">GPA <span class="sort-icon"></span></th>
                    <th class="sortable" data-col="enrollment_year">Year <span class="sort-icon"></span></th>
                    <th style="text-align:right">Actions</th>
                  </tr>
                </thead>
                <tbody id="stuTableBody"><tr><td colspan="8"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr></tbody>
              </table>
            </div>
          </div>
          <div id="stuPagination"></div>
        </div>
      </div>`;

    bindEvents(container);
    updateSortHeaders(container);
    await loadStudents();
  }

  function bindEvents(container) {
    const search  = container.querySelector('#stuSearch');
    const status  = container.querySelector('#stuStatus');
    const dept    = container.querySelector('#stuDept');
    const limit   = container.querySelector('#stuLimit');

    search.value  = state.search;
    status.value  = state.status;
    dept.value    = state.department_id;
    limit.value   = state.limit;

    search.addEventListener('input', Utils.debounce(e => {
      state.search = e.target.value; state.page = 1; loadStudents();
    }, 350));

    status.addEventListener('change', e => { state.status = e.target.value; state.page = 1; loadStudents(); });
    dept.addEventListener('change',   e => { state.department_id = e.target.value; state.page = 1; loadStudents(); });
    limit.addEventListener('change',  e => { state.limit = Number(e.target.value); state.page = 1; loadStudents(); });

    container.querySelector('#btnAddStudent').onclick = () => openStudentModal();

    // Sort headers
    container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (state.sort === col) state.dir = state.dir === 'ASC' ? 'DESC' : 'ASC';
        else { state.sort = col; state.dir = 'ASC'; }
        state.page = 1;
        updateSortHeaders(container);
        loadStudents();
      });
    });
  }

  function updateSortHeaders(container) {
    container.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.col === state.sort) th.classList.add(state.dir === 'ASC' ? 'sort-asc' : 'sort-desc');
    });
  }

  async function loadStudents() {
    const tbody = document.getElementById('stuTableBody');
    const pag   = document.getElementById('stuPagination');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr>`;

    try {
      const res = await API.students.list({
        search: state.search, status: state.status,
        department_id: state.department_id,
        sort: state.sort, dir: state.dir,
        page: state.page, limit: state.limit,
      });

      if (!res.data.length) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">🎓</div><h4>No students found</h4><p>Try adjusting your search or filters</p></div></td></tr>`;
        if (pag) pag.innerHTML = '';
        return;
      }

      tbody.innerHTML = res.data.map(s => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:var(--s3)">
              <div class="avatar" style="background:${Utils.avatarColors(s.first_name)}22;color:${Utils.avatarColors(s.first_name)}">${Utils.initials(s.first_name, s.last_name)}</div>
              <div>
                <div class="td-primary" style="cursor:pointer;text-decoration:underline;text-underline-offset:3px" onclick="StudentsPage.viewDetail(${s.id})">${Utils.escHtml(s.first_name)} ${Utils.escHtml(s.last_name)}</div>
                <div class="text-xs text-muted">${s.phone ? Utils.escHtml(s.phone) : ''}</div>
              </div>
            </div>
          </td>
          <td class="td-mono">${Utils.escHtml(s.student_id)}</td>
          <td class="text-sm text-secondary">${Utils.escHtml(s.email)}</td>
          <td class="text-sm">${Utils.escHtml(s.department_name || '—')}</td>
          <td>${Utils.statusBadge(s.status)}</td>
          <td class="td-mono">${Utils.fmtGpa(s.gpa)}</td>
          <td class="text-sm text-muted">${s.enrollment_year || '—'}</td>
          <td>
            <div style="display:flex;justify-content:flex-end;gap:var(--s2)">
              <button class="btn btn-sm btn-ghost btn-icon" title="View" onclick="StudentsPage.viewDetail(${s.id})">👁</button>
              <button class="btn btn-sm btn-outline btn-icon" title="Edit" onclick="StudentsPage.edit(${s.id})">✏️</button>
              <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="StudentsPage.remove(${s.id}, '${Utils.escHtml(s.first_name+' '+s.last_name)}')">🗑️</button>
            </div>
          </td>
        </tr>`).join('');

      if (pag) pag.innerHTML = Utils.paginator(res, p => { state.page = p; loadStudents(); });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-danger" style="text-align:center;padding:var(--s7)">Error: ${Utils.escHtml(err.message)}</td></tr>`;
    }
  }

  // ── Student form modal ───────────────────────────────────────────────────
  function studentFormHTML(s = {}) {
    const deptOpts = state.departments.map(d =>
      `<option value="${d.id}" ${s.department_id == d.id ? 'selected' : ''}>${Utils.escHtml(d.name)}</option>`
    ).join('');

    return `
      <form id="stuForm" autocomplete="off">
        <div class="form-grid">
          <div class="form-section-title">Basic Information</div>

          <div class="form-group">
            <label class="form-label">Student ID *</label>
            <input class="form-control" name="student_id" value="${Utils.escHtml(s.student_id||'')}" placeholder="e.g. STU001">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" name="status">
              ${['Active','Inactive','Graduated','Suspended'].map(v => `<option value="${v}" ${s.status===v||(!s.status&&v==='Active')?'selected':''}>${v}</option>`).join('')}
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input class="form-control" name="first_name" value="${Utils.escHtml(s.first_name||'')}" placeholder="Alice">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Last Name *</label>
            <input class="form-control" name="last_name" value="${Utils.escHtml(s.last_name||'')}" placeholder="Johnson">
            <span class="form-error"></span>
          </div>
          <div class="form-group span-2">
            <label class="form-label">Email *</label>
            <input class="form-control" name="email" type="email" value="${Utils.escHtml(s.email||'')}" placeholder="alice@university.edu">
            <span class="form-error"></span>
          </div>

          <div class="form-section-title">Personal Details</div>

          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-control" name="phone" value="${Utils.escHtml(s.phone||'')}" placeholder="555-0101">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <input class="form-control" name="date_of_birth" type="date" value="${s.date_of_birth ? s.date_of_birth.split('T')[0] : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-control" name="gender">
              ${['Prefer not to say','Male','Female','Other'].map(v => `<option value="${v}" ${s.gender===v?'selected':''}>${v}</option>`).join('')}
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">GPA</label>
            <input class="form-control" name="gpa" type="number" step="0.01" min="0" max="4" value="${s.gpa != null ? s.gpa : ''}" placeholder="0.00 – 4.00">
            <span class="form-error"></span>
          </div>

          <div class="form-section-title">Academic</div>

          <div class="form-group">
            <label class="form-label">Department</label>
            <select class="form-control" name="department_id">
              <option value="">— None —</option>
              ${deptOpts}
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Enrollment Year</label>
            <input class="form-control" name="enrollment_year" type="number" min="1900" max="${new Date().getFullYear()+1}" value="${s.enrollment_year||''}" placeholder="${new Date().getFullYear()}">
            <span class="form-error"></span>
          </div>

          <div class="form-section-title">Address</div>

          <div class="form-group span-2">
            <label class="form-label">Street Address</label>
            <input class="form-control" name="address" value="${Utils.escHtml(s.address||'')}" placeholder="123 Main St">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input class="form-control" name="city" value="${Utils.escHtml(s.city||'')}" placeholder="Springfield">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">State</label>
            <input class="form-control" name="state" value="${Utils.escHtml(s.state||'')}" placeholder="IL">
            <span class="form-error"></span>
          </div>
        </div>
      </form>`;
  }

  function openStudentModal(student = null) {
    const isEdit = !!student;
    const modal  = Utils.Modal.open({
      title: isEdit ? 'Edit Student' : 'Add Student',
      size: 'lg',
      body: studentFormHTML(student || {}),
      footer: `
        <button class="btn btn-outline" id="stuCancel">Cancel</button>
        <button class="btn btn-primary" id="stuSave">${isEdit ? 'Save Changes' : 'Add Student'}</button>`,
    });

    modal.el.querySelector('#stuCancel').onclick = modal.close;
    modal.el.querySelector('#stuSave').onclick   = async () => {
      const form  = modal.el.querySelector('#stuForm');
      const data  = Utils.getFormData(form);
      if (!Validate.student(data, form)) return;

      const saveBtn = modal.el.querySelector('#stuSave');
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

      try {
        if (isEdit) {
          await API.students.update(student.id, data);
          Utils.Toast.success('Student updated successfully');
        } else {
          await API.students.create(data);
          Utils.Toast.success('Student added successfully');
        }
        modal.close();
        loadStudents();
      } catch (err) {
        if (err.field) Utils.formError(form.querySelector(`[name="${err.field}"]`), err.message);
        else Utils.Toast.error(err.message);
        saveBtn.disabled = false; saveBtn.textContent = isEdit ? 'Save Changes' : 'Add Student';
      }
    };
  }

  async function edit(id) {
    try {
      const s = await API.students.get(id);
      openStudentModal(s);
    } catch (err) { Utils.Toast.error(err.message); }
  }

  async function remove(id, name) {
    const ok = await Utils.Modal.confirm({
      title: 'Delete Student',
      message: `Are you sure you want to delete <span class="confirm-name">${Utils.escHtml(name)}</span>? This will also remove all their enrollments.`,
    });
    if (!ok) return;
    try {
      await API.students.delete(id);
      Utils.Toast.success(`${name} deleted`);
      loadStudents();
    } catch (err) { Utils.Toast.error(err.message); }
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  async function viewDetail(id) {
    const modal = Utils.Modal.open({
      title: 'Student Profile',
      size: 'lg',
      body: `<div class="spinner-wrap"><div class="spinner"></div></div>`,
      footer: `
        <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
        <button class="btn btn-primary" id="detailEdit">Edit Student</button>`,
    });

    try {
      const s = await API.students.get(id);
      modal.setTitle(`${s.first_name} ${s.last_name}`);

      const color = Utils.avatarColors(s.first_name);
      modal.setBody(`
        <div style="display:flex;align-items:center;gap:var(--s5);margin-bottom:var(--s6)">
          <div class="avatar avatar-lg" style="background:${color}22;color:${color};font-size:1.4rem">${Utils.initials(s.first_name,s.last_name)}</div>
          <div>
            <h3>${Utils.escHtml(s.first_name)} ${Utils.escHtml(s.last_name)}</h3>
            <div class="text-muted text-sm">${Utils.escHtml(s.email)}</div>
            <div style="margin-top:var(--s2)">${Utils.statusBadge(s.status)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s5);margin-bottom:var(--s6)">
          <div class="card" style="padding:var(--s4)">
            <div class="form-section-title" style="margin-bottom:var(--s3)">Personal</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Student ID</span><span class="detail-value td-mono">${Utils.escHtml(s.student_id)}</span></div>
              <div class="detail-item"><span class="detail-label">Gender</span><span class="detail-value">${Utils.escHtml(s.gender||'—')}</span></div>
              <div class="detail-item"><span class="detail-label">Date of Birth</span><span class="detail-value">${Utils.fmtDate(s.date_of_birth)}</span></div>
              <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${Utils.escHtml(s.phone||'—')}</span></div>
            </div>
          </div>
          <div class="card" style="padding:var(--s4)">
            <div class="form-section-title" style="margin-bottom:var(--s3)">Academic</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Department</span><span class="detail-value">${Utils.escHtml(s.department_name||'—')}</span></div>
              <div class="detail-item"><span class="detail-label">Enroll Year</span><span class="detail-value">${s.enrollment_year||'—'}</span></div>
              <div class="detail-item"><span class="detail-label">GPA</span><span class="detail-value td-mono" style="color:var(--accent-light);font-size:1.2rem">${Utils.fmtGpa(s.gpa)}</span></div>
              <div class="detail-item"><span class="detail-label">Added</span><span class="detail-value">${Utils.fmtDate(s.created_at)}</span></div>
            </div>
          </div>
        </div>

        ${s.address ? `
          <div class="card" style="padding:var(--s4);margin-bottom:var(--s5)">
            <div class="form-section-title" style="margin-bottom:var(--s2)">Address</div>
            <div class="text-sm text-secondary">
              ${[s.address, s.city, s.state, s.postal_code].filter(Boolean).map(Utils.escHtml).join(', ')}
            </div>
          </div>` : ''}

        <div>
          <div class="form-section-title" style="margin-bottom:var(--s3)">Course Enrollments (${s.enrollments?.length||0})</div>
          ${s.enrollments?.length ? `
            <div class="table-wrap">
              <div class="table-scroll">
                <table>
                  <thead><tr><th>Course</th><th>Code</th><th>Semester</th><th>Grade</th><th>Status</th></tr></thead>
                  <tbody>
                    ${s.enrollments.map(e => `
                      <tr>
                        <td class="td-primary">${Utils.escHtml(e.course_title)}</td>
                        <td class="td-mono">${Utils.escHtml(e.course_code)}</td>
                        <td>${Utils.escHtml(e.semester)} ${e.year}</td>
                        <td class="td-mono">${e.letter_grade ? `<span class="badge badge-neutral">${e.letter_grade}</span>` : '—'}</td>
                        <td>${Utils.statusBadge(e.status)}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>` : '<div class="empty-state" style="padding:var(--s7)"><div class="empty-state-icon">📚</div><p>No enrollments yet</p></div>'}
        </div>`);

      modal.el.querySelector('#detailEdit').onclick = () => { modal.close(); edit(id); };

    } catch (err) {
      modal.setBody(`<div class="empty-state"><div class="empty-state-icon">❌</div><p>${Utils.escHtml(err.message)}</p></div>`);
    }
  }

  async function loadDepts() {
    try {
      const res = await API.departments.list();
      return res.data || [];
    } catch { return []; }
  }

  return { render, edit, remove, viewDetail };
})();
