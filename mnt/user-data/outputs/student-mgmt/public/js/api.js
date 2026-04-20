'use strict';

const API = (() => {

  function token() {
    return localStorage.getItem('token') || '';
  }

  async function request(method, url, body = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    };
    if (body !== null) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.field = data.field || null;
      err.status = res.status;
      throw err;
    }

    return data;
  }

  const get    = (url)         => request('GET',    url);
  const post   = (url, body)   => request('POST',   url, body);
  const put    = (url, body)   => request('PUT',    url, body);
  const del    = (url)         => request('DELETE', url);

  return {
    auth: {
      login: (u, p) => post('/api/login', { username: u, password: p }),
    },

    dashboard: {
      stats: () => get('/api/dashboard/stats'),
    },

    students: {
      list:   (params = {}) => get('/api/students?' + new URLSearchParams(params)),
      get:    (id)          => get(`/api/students/${id}`),
      create: (data)        => post('/api/students', data),
      update: (id, data)    => put(`/api/students/${id}`, data),
      delete: (id)          => del(`/api/students/${id}`),
    },

    departments: {
      list:   ()         => get('/api/departments'),
      get:    (id)       => get(`/api/departments/${id}`),
      create: (data)     => post('/api/departments', data),
      update: (id, data) => put(`/api/departments/${id}`, data),
      delete: (id)       => del(`/api/departments/${id}`),
    },

    courses: {
      list:   (params = {}) => get('/api/courses?' + new URLSearchParams(params)),
      get:    (id)          => get(`/api/courses/${id}`),
      create: (data)        => post('/api/courses', data),
      update: (id, data)    => put(`/api/courses/${id}`, data),
      delete: (id)          => del(`/api/courses/${id}`),
    },

    enrollments: {
      create:   (courseId, data) => post(`/api/courses/${courseId}/enrollments`, data),
      update:   (courseId, enrollId, data) => put(`/api/courses/${courseId}/enrollments/${enrollId}`, data),
      delete:   (courseId, enrollId)       => del(`/api/courses/${courseId}/enrollments/${enrollId}`),
    },
  };
})();
