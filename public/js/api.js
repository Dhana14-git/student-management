'use strict';

const API = (() => {

  function getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : '',
    };
  }

  async function request(url, options = {}) {
    let res;
    try {
      res = await fetch(url, { ...options, headers: getHeaders() });
    } catch (err) {
      throw new Error('Network error — server unreachable');
    }

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const e = new Error(body.error || `HTTP ${res.status}`);
      if (body.field) e.field = body.field;
      throw e;
    }

    return body;
  }

  function toQS(params = {}) {
    const entries = Object.entries(params).filter(([,v]) => v !== '' && v !== null && v !== undefined);
    return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  }

  return {

    dashboard: {
      stats() {
        return request('/api/dashboard/stats');
      },
    },

    students: {
      list(params = {}) {
        return request(`/api/students${toQS(params)}`);
      },
      get(id) {
        return request(`/api/students/${id}`);
      },
      create(data) {
        return request('/api/students', { method: 'POST', body: JSON.stringify(data) });
      },
      update(id, data) {
        return request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      },
      delete(id) {
        return request(`/api/students/${id}`, { method: 'DELETE' });
      },
    },

    departments: {
      list(params = {}) {
        return request(`/api/departments${toQS(params)}`);
      },
      get(id) {
        return request(`/api/departments/${id}`);
      },
      create(data) {
        return request('/api/departments', { method: 'POST', body: JSON.stringify(data) });
      },
      update(id, data) {
        return request(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      },
      delete(id) {
        return request(`/api/departments/${id}`, { method: 'DELETE' });
      },
    },

    courses: {
      list(params = {}) {
        return request(`/api/courses${toQS(params)}`);
      },
      get(id) {
        return request(`/api/courses/${id}`);
      },
      create(data) {
        return request('/api/courses', { method: 'POST', body: JSON.stringify(data) });
      },
      update(id, data) {
        return request(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      },
      delete(id) {
        return request(`/api/courses/${id}`, { method: 'DELETE' });
      },
    },

    enrollments: {
      create(courseId, data) {
        return request(`/api/courses/${courseId}/enrollments`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      update(courseId, enrollId, data) {
        return request(`/api/courses/${courseId}/enrollments/${enrollId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      },
      delete(courseId, enrollId) {
        return request(`/api/courses/${courseId}/enrollments/${enrollId}`, {
          method: 'DELETE'
        });
      }
    }
  };
})();

window.API = API;