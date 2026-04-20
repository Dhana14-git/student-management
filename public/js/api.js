// public/js/api.js

const API = {

  // 🔐 headers
  getHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": token ? "Bearer " + token : ""
    };
  },

  // 🔹 Base request
  async request(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: this.getHeaders()
    });

    if (res.status === 401 || res.status === 403) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return;
    }

    return res.json();
  },

  // =========================
  // 📊 DASHBOARD API
  // =========================
  dashboard: {
    async stats() {
      return API.request("/api/dashboard/stats");
    }
  },

  // =========================
  // 👨‍🎓 STUDENTS API
  // =========================
  students: {
    list() {
      return API.request("/api/students");
    },

    get(id) {
      return API.request(`/api/students/${id}`);
    },

    create(data) {
      return API.request("/api/students", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return API.request(`/api/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return API.request(`/api/students/${id}`, {
        method: "DELETE"
      });
    }
  }, // ✅ FIXED (comma added)

  // =========================
  // 🏫 DEPARTMENTS API
  // =========================
  departments: {
    list() {
      return API.request("/api/departments");
    },

    create(data) {
      return API.request("/api/departments", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  },

  // =========================
  // 📚 COURSES API
  // =========================
  courses: {
    list() {
      return API.request("/api/courses");
    },

    create(data) {
      return API.request("/api/courses", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  }

};

// 🔥 VERY IMPORTANT
window.API = API;