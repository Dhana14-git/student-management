# 🎓 StudentMS — Student Management System

A full-stack student management system built with Node.js, Express, MySQL, and vanilla JS.

---

## 📁 Project Structure

```
student-mgmt/
├── server/
│   ├── index.js                   # Express entry point
│   ├── config/
│   │   ├── database.js            # MySQL connection pool
│   │   └── setupDatabase.js       # Schema creation + seed data
│   ├── models/
│   │   ├── studentModel.js        # Parameterized queries, pagination, search
│   │   ├── departmentModel.js     # Department CRUD + integrity check
│   │   ├── courseModel.js         # Course CRUD + capacity check
│   │   └── enrollmentModel.js     # Enrollment CRUD + GPA recalc
│   ├── controllers/
│   │   ├── studentController.js   # Input handling, uniqueness checks
│   │   ├── departmentController.js
│   │   └── courseController.js    # Course + enrollment logic
│   ├── middleware/
│   │   └── validators.js          # Backend validation rules
│   └── routes/
│       └── api.js                 # All REST routes
│
└── public/
    ├── index.html                 # Single-page app shell
    ├── login.html                 # Login page
    ├── css/
    │   ├── base.css               # Design tokens, typography, utilities
    │   ├── components.css         # Buttons, forms, tables, modals, toasts
    │   └── layout.css             # Sidebar, topbar, responsive grid
    └── js/
        ├── api.js                 # Centralized fetch client
        ├── utils.js               # Toast, Modal, helpers, paginator
        ├── validate.js            # Client-side validation
        ├── app.js                 # Router + initialization
        └── pages/
            ├── dashboard.js       # Stats + charts
            ├── students.js        # Full CRUD + search/sort/paginate/detail
            ├── departments.js     # Dept CRUD with card grid
            └── courses.js         # Course CRUD + enrollment flow
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Create database + seed data
```bash
npm run setup
```

### 4. Start the server
```bash
npm run dev     # Development with nodemon
npm start       # Production
```

### 5. Open in browser
```
http://localhost:3000
```

**Login:** `admin` / `1234`

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT login, protected routes, auto-redirect |
| **Dashboard** | Stats cards, dept bar chart, status breakdown, recent students |
| **Students** | Full profile CRUD, search, multi-filter, sort, paginate, detail modal with enrollments |
| **Departments** | Card grid view, CRUD, integrity check (blocks delete if linked) |
| **Courses** | Table view, CRUD, capacity bar, enrollment management per course |
| **Enrollments** | Enroll students, grade entry (numeric + letter), GPA auto-recalculation |
| **Validation** | Client + server-side, field-level error messages |
| **UI** | Dark theme, responsive, toasts, confirm dialogs, loading states |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | Authenticate (returns JWT) |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/students` | List with search/filter/sort/paginate |
| GET | `/api/students/:id` | Student detail + enrollments |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Create department |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete (blocks if linked) |
| GET | `/api/courses` | List with search/filter |
| POST | `/api/courses` | Create course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete (blocks if active enrollments) |
| POST | `/api/courses/:id/enrollments` | Enroll student in course |
| PUT | `/api/courses/:id/enrollments/:eid` | Update grade/status |
| DELETE | `/api/courses/:id/enrollments/:eid` | Remove enrollment |
