'use strict';

const Utils = (() => {

  // ── Toast ──────────────────────────────────────────────────────────────────
  const Toast = (() => {
    function show(msg, type = 'info', duration = 4000) {
      const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;
      el.innerHTML = `
        <span class="toast-icon">${icons[type]||'ℹ'}</span>
        <span class="toast-msg">${escHtml(msg)}</span>
        <button class="toast-close" title="Dismiss">×</button>
      `;
      el.querySelector('.toast-close').onclick = () => remove(el);
      container.appendChild(el);

      const timer = setTimeout(() => remove(el), duration);
      el._timer = timer;
    }

    function remove(el) {
      clearTimeout(el._timer);
      el.classList.add('removing');
      setTimeout(() => el.remove(), 200);
    }

    return {
      success: (m, d) => show(m, 'success', d),
      error:   (m, d) => show(m, 'error',   d),
      warning: (m, d) => show(m, 'warning', d),
      info:    (m, d) => show(m, 'info',    d),
    };
  })();

  // ── Modal ──────────────────────────────────────────────────────────────────
  const Modal = (() => {
    let stack = [];

    function open({ title, body, footer = '', size = '', onClose = null }) {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal ${size ? 'modal-' + size : ''}" role="dialog" aria-modal="true">
          <div class="modal-header">
            <span class="modal-title">${escHtml(title)}</span>
            <button class="modal-close" title="Close">×</button>
          </div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      `;

      const close = () => {
        backdrop.remove();
        stack = stack.filter(s => s !== entry);
        if (onClose) onClose();
      };

      backdrop.querySelector('.modal-close').onclick = close;
      backdrop.addEventListener('mousedown', (e) => {
        if (e.target === backdrop) close();
      });

      const escHandler = (e) => {
        if (e.key === 'Escape' && stack[stack.length-1] === entry) close();
      };
      document.addEventListener('keydown', escHandler);

      const entry = { backdrop, close, escHandler };
      stack.push(entry);
      document.body.appendChild(backdrop);

      // Auto-focus first input
      setTimeout(() => {
        const first = backdrop.querySelector('input, select, textarea');
        if (first) first.focus();
      }, 50);

      return {
        el: backdrop,
        close,
        setTitle: (t) => { backdrop.querySelector('.modal-title').textContent = t; },
        setBody:  (b) => { backdrop.querySelector('.modal-body').innerHTML = b; },
      };
    }

    function confirm({ title, message, confirmText = 'Delete', confirmClass = 'btn-danger', icon = '🗑️' }) {
      return new Promise(resolve => {
        const modal = open({
          title,
          size: 'sm',
          body: `<div class="confirm-icon">${icon}</div><p class="confirm-msg">${message}</p>`,
          footer: `
            <button class="btn btn-outline" id="confirmCancel">Cancel</button>
            <button class="btn ${confirmClass}" id="confirmOk">${escHtml(confirmText)}</button>
          `,
          onClose: () => resolve(false),
        });

        modal.el.querySelector('#confirmCancel').onclick = () => { modal.close(); resolve(false); };
        modal.el.querySelector('#confirmOk').onclick    = () => { modal.close(); resolve(true);  };
      });
    }

    return { open, confirm };
  })();

  // ── Paginator ──────────────────────────────────────────────────────────────
  function paginator(res, onPage) {
    const { page, totalPages, total, data } = res;
    const start = total === 0 ? 0 : (page - 1) * data.length + 1;
    const end   = Math.min(page * data.length, total);

    const pages = [];
    const addPage = (n, label = n, cls = '') =>
      `<button class="page-btn ${n === page ? 'active' : ''} ${cls}" data-page="${n}">${label}</button>`;

    pages.push(`<button class="page-btn" data-page="${page-1}" ${page<=1?'disabled':''}>‹</button>`);

    if (totalPages <= 7) {
      for (let i=1; i<=totalPages; i++) pages.push(addPage(i));
    } else {
      pages.push(addPage(1));
      if (page > 3)  pages.push(`<button class="page-btn dots" disabled>…</button>`);
      for (let i=Math.max(2,page-1); i<=Math.min(totalPages-1,page+1); i++) pages.push(addPage(i));
      if (page < totalPages-2) pages.push(`<button class="page-btn dots" disabled>…</button>`);
      pages.push(addPage(totalPages));
    }

    pages.push(`<button class="page-btn" data-page="${page+1}" ${page>=totalPages?'disabled':''}>›</button>`);

    const html = `
      <div class="pagination">
        <span class="pagination-info">${total === 0 ? 'No results' : `${start}–${end} of ${total}`}</span>
        <div class="pagination-pages" id="paginatorPages">${pages.join('')}</div>
      </div>`;

    // Wire up after insertion via event delegation
    requestAnimationFrame(() => {
      document.querySelectorAll('#paginatorPages .page-btn:not(.active):not(.dots)').forEach(btn => {
        btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
      });
    });

    return html;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function statusBadge(status) {
    const map = {
      'Active':    'active',
      'Inactive':  'inactive',
      'Graduated': 'graduated',
      'Suspended': 'suspended',
      'Enrolled':  'enrolled',
      'Completed': 'completed',
      'Dropped':   'dropped',
      'Withdrawn': 'withdrawn',
    };
    const cls = map[status] || 'neutral';
    return `<span class="badge badge-dot badge-${cls}">${escHtml(status)}</span>`;
  }

  function initials(first, last) {
    return ((first?.[0]||'') + (last?.[0]||'')).toUpperCase() || '?';
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }

  function fmtGpa(g) {
    if (g == null || g === '') return '—';
    return Number(g).toFixed(2);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function avatarColors(str) {
    const colors = ['#5d7af6','#34d399','#f59e0b','#f87171','#a78bfa','#38bdf8','#fb7185','#4ade80'];
    let hash = 0;
    for (const c of (str||'')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  // Form helpers
  function formError(inputEl, msg) {
    const group = inputEl?.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    const errEl = group.querySelector('.form-error');
    if (errEl) errEl.textContent = msg;
  }
  function clearErrors(formEl) {
    formEl.querySelectorAll('.form-group.has-error').forEach(g => {
      g.classList.remove('has-error');
    });
  }
  function getFormData(formEl) {
    const data = {};
    formEl.querySelectorAll('[name]').forEach(el => {
      data[el.name] = el.value.trim() || null;
    });
    return data;
  }

  // Alias: renderPagination is the same as paginator — both render a pagination control
  function renderPagination(res, onPage) { return paginator(res, onPage); }

  return { Toast, Modal, paginator, renderPagination, escHtml, statusBadge, initials, fmtDate, fmtGpa, debounce, avatarColors, formError, clearErrors, getFormData };
})();
