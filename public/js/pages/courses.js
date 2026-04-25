'use strict';

const CoursesPage = (() => {

  let state = {
    search: '', department_id: '',
    sort: 'course_code', dir: 'ASC',
    page: 1, limit: 10,
    departments: [], students: [],
  };

  // ── Render shell ─────────────────────────────────────────────────────────
  async function render(container) {
    [state.departments, state.students] = await Promise.all([loadDepts(), loadStudents()]);

    container.innerHTML = `
      <div class="anim-fade-up">
        <div class="section-header">
          <div>
            <div class="section-eyebrow">Management</div>
            <h2>Courses</h2>
          </div>
          <button class="btn btn-primary" id="btnAddCourse">+ Add Course</button>
        </div>

        <div class="filter-bar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input class="form-control search-input" id="courseSearch" placeholder="Search course, code, instructor…" value="${Utils.escHtml(state.search)}">
          </div>
          <select class="form-control" id="courseDept" style="width:200px">
            <option value="">All Departments</option>
            ${state.departments.map(d => `<option value="${d.id}">${Utils.escHtml(d.name)}</option>`).join('')}
          </select>
          <select class="form-control" id="courseLimit" style="width:100px">
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>

        <div class="card" style="padding:0">
          <div class="table-wrap">
            <div class="table-scroll">
              <table>
                <thead><tr>
                  <th class="sortable" data-col="title">Course <span class="sort-icon"></span></th>
                  <th class="sortable" data-col="course_code">Code <span class="sort-icon"></span></th>
                  <th class="sortable" data-col="department_name">Department <span class="sort-icon"></span></th>
                  <th class="sortable" data-col="instructor">Instructor <span class="sort-icon"></span></th>
                  <th class="sortable" data-col="credits">Credits <span class="sort-icon"></span></th>
                  <th class="sortable" data-col="enrolled_count">Capacity <span class="sort-icon"></span></th>
                  <th style="text-align:right">Actions</th>
                </tr></thead>
                <tbody id="courseTableBody">
                  <tr><td colspan="7"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div id="coursePagination"></div>
        </div>
      </div>`;

    bindEvents(container);
    updateSortHeaders(container);
    await loadCourses();
  }

  function bindEvents(container) {
    const searchEl = container.querySelector('#courseSearch');
    const deptEl   = container.querySelector('#courseDept');
    const limitEl  = container.querySelector('#courseLimit');

    searchEl.value = state.search;
    deptEl.value   = state.department_id;
    limitEl.value  = state.limit;

    searchEl.addEventListener('input', Utils.debounce(e => {
      state.search = e.target.value; state.page = 1; loadCourses();
    }, 350));
    deptEl.addEventListener('change', e => {
      state.department_id = e.target.value; state.page = 1; loadCourses();
    });
    limitEl.addEventListener('change', e => {
      state.limit = Number(e.target.value); state.page = 1; loadCourses();
    });

    container.querySelector('#btnAddCourse').onclick = () => openCourseModal();

    // Sort headers
    container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (state.sort === col) state.dir = state.dir === 'ASC' ? 'DESC' : 'ASC';
        else { state.sort = col; state.dir = 'ASC'; }
        state.page = 1;
        updateSortHeaders(container);
        loadCourses();
      });
    });
  }

  function updateSortHeaders(container) {
    container.querySelectorAll('th.sortable').forEach(th => {
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;
      if (th.dataset.col === state.sort) {
        icon.textContent = state.dir === 'ASC' ? ' ↑' : ' ↓';
        th.classList.add('sort-active');
      } else {
        icon.textContent = '';
        th.classList.remove('sort-active');
      }
    });
  }

  async function loadCourses() {
    const tbody = document.getElementById('courseTableBody');
    const pag   = document.getElementById('coursePagination');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr>`;

    try {
      const res = await API.courses.list({
        search: state.search,
        department_id: state.department_id,
        sort: state.sort,
        dir:  state.dir,
        page: state.page,
        limit: state.limit,
      });

      if (!res.data.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📚</div><h4>No courses found</h4><p>Add your first course or adjust filters</p></div></td></tr>`;
        if (pag) pag.innerHTML = '';
        return;
      }

      tbody.innerHTML = res.data.map(c => {
        const pct = c.max_capacity > 0 ? Math.round(c.enrolled_count / c.max_capacity * 100) : 0;
        const capColor = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)';
        return `
          <tr>
            <td>
              <div class="td-primary">${Utils.escHtml(c.title)}</div>
              ${c.description ? `<div class="text-xs text-muted" style="max-width:240px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">${Utils.escHtml(c.description)}</div>` : ''}
            </td>
            <td class="td-mono">${Utils.escHtml(c.course_code)}</td>
            <td class="text-sm">${Utils.escHtml(c.department_name||'—')}</td>
            <td class="text-sm text-secondary">${Utils.escHtml(c.instructor||'—')}</td>
            <td style="text-align:center"><span class="badge badge-neutral">${c.credits} cr</span></td>
            <td>
              <div style="min-width:100px">
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:3px">
                  <span style="color:${capColor}">${c.enrolled_count}</span>
                  <span class="text-muted">/ ${c.max_capacity}</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${capColor}"></div></div>
              </div>
            </td>
            <td>
              <div style="display:flex;justify-content:flex-end;gap:var(--s2)">
                <button class="btn btn-sm btn-ghost btn-icon" title="Enrollments" onclick="CoursesPage.viewEnrollments(${c.id}, '${Utils.escHtml(c.title)}')">👥</button>
                <button class="btn btn-sm btn-outline btn-icon" title="Edit" onclick="CoursesPage.edit(${c.id})">✏️</button>
                <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="CoursesPage.remove(${c.id}, '${Utils.escHtml(c.title)}')">🗑️</button>
              </div>
            </td>
          </tr>`;
      }).join('');

      // Pagination
      if (pag) pag.innerHTML = Utils.renderPagination(res, p => { state.page = p; loadCourses(); });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-danger" style="text-align:center;padding:var(--s7)">Error: ${Utils.escHtml(err.message)}</td></tr>`;
    }
  }

  // ── Course form ──────────────────────────────────────────────────────────
  function courseFormHTML(c = {}) {
    return `
      <form id="courseForm" autocomplete="off">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Course Code *</label>
            <input class="form-control" name="course_code" value="${Utils.escHtml(c.course_code||'')}" placeholder="CS101" maxlength="20" style="text-transform:uppercase">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Credits (1–10)</label>
            <input class="form-control" name="credits" type="number" min="1" max="10" value="${c.credits||3}">
            <span class="form-error"></span>
          </div>
          <div class="form-group span-2">
            <label class="form-label">Course Title *</label>
            <input class="form-control" name="title" value="${Utils.escHtml(c.title||'')}" placeholder="Introduction to Programming" maxlength="150">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <select class="form-control" name="department_id">
              <option value="">— None —</option>
              ${state.departments.map(d => `<option value="${d.id}" ${c.department_id==d.id?'selected':''}>${Utils.escHtml(d.name)}</option>`).join('')}
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Max Capacity (1–1000)</label>
            <input class="form-control" name="max_capacity" type="number" min="1" max="1000" value="${c.max_capacity||30}">
            <span class="form-error"></span>
          </div>
          <div class="form-group span-2">
            <label class="form-label">Instructor</label>
            <input class="form-control" name="instructor" value="${Utils.escHtml(c.instructor||'')}" placeholder="Prof. Smith" maxlength="100">
            <span class="form-error"></span>
          </div>
          <div class="form-group span-2">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" placeholder="Course description…">${Utils.escHtml(c.description||'')}</textarea>
            <span class="form-error"></span>
          </div>
        </div>
      </form>`;
  }

  function openCourseModal(course = null) {
    const isEdit = !!course;
    const modal  = Utils.Modal.open({
      title: isEdit ? 'Edit Course' : 'Add Course',
      body: courseFormHTML(course || {}),
      footer: `
        <button class="btn btn-outline" id="courseCancel">Cancel</button>
        <button class="btn btn-primary" id="courseSave">${isEdit ? 'Save Changes' : 'Add Course'}</button>`,
    });

    modal.el.querySelector('#courseCancel').onclick = modal.close;
    modal.el.querySelector('#courseSave').onclick   = async () => {
      const form = modal.el.querySelector('#courseForm');
      const data = Utils.getFormData(form);
      if (!Validate.course(data, form)) return;

      const saveBtn = modal.el.querySelector('#courseSave');
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

      try {
        if (isEdit) {
          await API.courses.update(course.id, data);
          Utils.Toast.success('Course updated');
        } else {
          await API.courses.create(data);
          Utils.Toast.success('Course added');
        }
        modal.close();
        loadCourses();
      } catch (err) {
        if (err.field) Utils.formError(form.querySelector(`[name="${err.field}"]`), err.message);
        else Utils.Toast.error(err.message);
        saveBtn.disabled = false; saveBtn.textContent = isEdit ? 'Save Changes' : 'Add Course';
      }
    };
  }

  async function edit(id) {
    try {
      const c = await API.courses.get(id);
      openCourseModal(c);
    } catch (err) { Utils.Toast.error(err.message); }
  }

  async function remove(id, name) {
    const ok = await Utils.Modal.confirm({
      title: 'Delete Course',
      icon: '📚',
      message: `Delete <span class="confirm-name">${Utils.escHtml(name)}</span>? Courses with active enrollments cannot be deleted.`,
    });
    if (!ok) return;
    try {
      await API.courses.delete(id);
      Utils.Toast.success(`${name} deleted`);
      loadCourses();
    } catch (err) { Utils.Toast.error(err.message); }
  }

  // ── Enrollment management ────────────────────────────────────────────────
  async function viewEnrollments(courseId, courseTitle) {
    const modal = Utils.Modal.open({
      title: `Enrollments — ${courseTitle}`,
      size: 'lg',
      body: `<div class="spinner-wrap"><div class="spinner"></div></div>`,
      footer: `
        <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
        <button class="btn btn-primary" id="btnEnroll">+ Enroll Student</button>`,
    });

    const refresh = async () => {
      try {
        const c = await API.courses.get(courseId);
        const enrs = c.enrollments || [];

        modal.setBody(enrs.length ? `
          <div class="table-wrap">
            <div class="table-scroll">
              <table>
                <thead><tr><th>Student</th><th>Semester</th><th>Grade</th><th>Letter</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
                <tbody>
                  ${enrs.map(e => `
                    <tr>
                      <td>
                        <div class="td-primary">${Utils.escHtml(e.first_name)} ${Utils.escHtml(e.last_name)}</div>
                        <div class="text-xs text-muted td-mono">${Utils.escHtml(e.stu_code)}</div>
                      </td>
                      <td class="text-sm">${Utils.escHtml(e.semester)} ${e.year}</td>
                      <td class="td-mono">${e.grade != null ? e.grade : '—'}</td>
                      <td>${e.letter_grade ? `<span class="badge badge-neutral">${e.letter_grade}</span>` : '—'}</td>
                      <td>${Utils.statusBadge(e.status)}</td>
                      <td>
                        <div style="display:flex;justify-content:flex-end;gap:var(--s2)">
                          <button class="btn btn-sm btn-outline" onclick="CoursesPage._editEnrollment(${courseId}, ${e.id}, this)">✏️ Grade</button>
                          <button class="btn btn-sm btn-danger btn-icon" onclick="CoursesPage._removeEnrollment(${courseId}, ${e.id}, '${Utils.escHtml(e.first_name+' '+e.last_name)}', this)">🗑️</button>
                        </div>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>` :
          `<div class="empty-state"><div class="empty-state-icon">👥</div><h4>No enrollments yet</h4><p>Click "Enroll Student" to add the first student.</p></div>`
        );
      } catch (err) {
        modal.setBody(`<div class="empty-state"><div class="empty-state-icon">❌</div><p>${Utils.escHtml(err.message)}</p></div>`);
      }
    };

    await refresh();
    modal.el.querySelector('#btnEnroll').onclick = () => openEnrollModal(courseId, refresh);
  }

  function openEnrollModal(courseId, onSuccess) {
    const semOpts = ['Fall','Spring','Summer','Winter'].map(s => `<option value="${s}">${s}</option>`).join('');
    const stuOpts = state.students.map(s => `<option value="${s.id}">${Utils.escHtml(s.first_name+' '+s.last_name)} (${s.student_id})</option>`).join('');

    const modal = Utils.Modal.open({
      title: 'Enroll Student',
      size: 'sm',
      body: `
        <form id="enrollForm" autocomplete="off">
          <div style="display:flex;flex-direction:column;gap:var(--s4)">
            <div class="form-group">
              <label class="form-label">Student *</label>
              <select class="form-control" name="student_id">
                <option value="">— Select Student —</option>
                ${stuOpts}
              </select>
              <span class="form-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label">Semester *</label>
              <select class="form-control" name="semester">${semOpts}</select>
              <span class="form-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label">Year *</label>
              <input class="form-control" name="year" type="number" value="${new Date().getFullYear()}" min="2000" max="${new Date().getFullYear()+1}">
              <span class="form-error"></span>
            </div>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-outline" id="enrollCancel">Cancel</button>
        <button class="btn btn-primary" id="enrollSave">Enroll</button>`,
    });

    modal.el.querySelector('#enrollCancel').onclick = modal.close;
    modal.el.querySelector('#enrollSave').onclick   = async () => {
      const form = modal.el.querySelector('#enrollForm');
      const data = Utils.getFormData(form);
      if (!Validate.enrollment(data, form)) return;

      const saveBtn = modal.el.querySelector('#enrollSave');
      saveBtn.disabled = true; saveBtn.textContent = 'Enrolling…';

      try {
        await API.enrollments.create(courseId, data);
        Utils.Toast.success('Student enrolled');
        modal.close();
        if (onSuccess) await onSuccess();
        loadCourses();
      } catch (err) {
        if (err.field) Utils.formError(form.querySelector(`[name="${err.field}"]`), err.message);
        else Utils.Toast.error(err.message);
        saveBtn.disabled = false; saveBtn.textContent = 'Enroll';
      }
    };
  }

  async function _editEnrollment(courseId, enrollId, _triggerEl) {
    const letterOpts = ['','A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F','W','I']
      .map(v => `<option value="${v}">${v||'— None —'}</option>`).join('');

    const modal = Utils.Modal.open({
      title: 'Update Grade',
      size: 'sm',
      body: `
        <form id="gradeForm" autocomplete="off">
          <div style="display:flex;flex-direction:column;gap:var(--s4)">
            <div class="form-group">
              <label class="form-label">Numeric Grade (0–100)</label>
              <input class="form-control" name="grade" type="number" min="0" max="100" step="0.5" placeholder="e.g. 88.5">
              <span class="form-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label">Letter Grade</label>
              <select class="form-control" name="letter_grade">${letterOpts}</select>
              <span class="form-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" name="status">
                ${['Enrolled','Completed','Dropped','Withdrawn'].map(v => `<option value="${v}">${v}</option>`).join('')}
              </select>
              <span class="form-error"></span>
            </div>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-outline" id="gradeCancel">Cancel</button>
        <button class="btn btn-primary" id="gradeSave">Save Grade</button>`,
    });

    modal.el.querySelector('#gradeCancel').onclick = modal.close;
    modal.el.querySelector('#gradeSave').onclick   = async () => {
      const form = modal.el.querySelector('#gradeForm');
      const data = Utils.getFormData(form);

      const saveBtn = modal.el.querySelector('#gradeSave');
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

      try {
        await API.enrollments.update(courseId, enrollId, data);
        Utils.Toast.success('Grade updated');
        modal.close();
        loadCourses();
      } catch (err) {
        Utils.Toast.error(err.message);
        saveBtn.disabled = false; saveBtn.textContent = 'Save Grade';
      }
    };
  }

  async function _removeEnrollment(courseId, enrollId, studentName, triggerEl) {
    const ok = await Utils.Modal.confirm({
      title: 'Remove Enrollment',
      icon: '👥',
      message: `Remove <span class="confirm-name">${Utils.escHtml(studentName)}</span> from this course?`,
      confirmText: 'Remove',
    });
    if (!ok) return;
    try {
      await API.enrollments.delete(courseId, enrollId);
      Utils.Toast.success('Enrollment removed');
      const row = triggerEl?.closest('tr');
      if (row) row.remove();
      loadCourses();
    } catch (err) { Utils.Toast.error(err.message); }
  }

  async function loadDepts() {
    try { const r = await API.departments.list(); return r.data || []; } catch { return []; }
  }
  async function loadStudents() {
    try { const r = await API.students.list({ limit: 500 }); return r.data || []; } catch { return []; }
  }

  return { render, edit, remove, viewEnrollments, _editEnrollment, _removeEnrollment };
})();
