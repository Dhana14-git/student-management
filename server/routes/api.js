'use strict';

const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');

const StudentCtrl    = require('../controllers/studentController');
const DepartmentCtrl = require('../controllers/departmentController');
const CourseCtrl     = require('../controllers/courseController');
const Validators     = require('../middleware/validators');
const { loginRateLimit } = require('../middleware/rateLimiter');

// ── JWT auth middleware ───────────────────────────────────────────────────────
function auth(req, res, next) {
  let token = req.headers['authorization'] || '';
  if (token.startsWith('Bearer ')) token = token.slice(7);
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = payload;
    next();
  });
}

// ── Global input sanitization (trim strings) ─────────────────────────────────
router.use(Validators.sanitize);

// ── Login (public, rate-limited) ──────────────────────────────────────────────
router.post('/login', loginRateLimit, (req, res) => {
  const { username, password } = req.body;
  if (username === (process.env.ADMIN_USER || 'admin') &&
      password === (process.env.ADMIN_PASS || '1234')) {
    if (req._onLoginSuccess) req._onLoginSuccess();
    const token = jwt.sign(
      { user: username },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '8h' }
    );
    return res.json({ token });
  }
  if (req._onLoginFailure) req._onLoginFailure();
  res.status(401).json({ error: 'Invalid credentials' });
});

// ── All routes below require auth ─────────────────────────────────────────────
router.use(auth);

// Dashboard stats
router.get('/dashboard/stats', StudentCtrl.stats);

// Students — full CRUD + search/sort/pagination
router.get   ('/students',     StudentCtrl.list);
router.get   ('/students/:id', StudentCtrl.getOne);
router.post  ('/students',     Validators.student, StudentCtrl.create);
router.put   ('/students/:id', Validators.student, StudentCtrl.update);
router.delete('/students/:id', StudentCtrl.remove);

// Departments — full CRUD + search/sort/pagination
router.get   ('/departments',     DepartmentCtrl.list);
router.get   ('/departments/:id', DepartmentCtrl.getOne);
router.post  ('/departments',     Validators.department, DepartmentCtrl.create);
router.put   ('/departments/:id', Validators.department, DepartmentCtrl.update);
router.delete('/departments/:id', DepartmentCtrl.remove);

// Courses — full CRUD + search/sort/pagination
router.get   ('/courses',     CourseCtrl.list);
router.get   ('/courses/:id', CourseCtrl.getOne);
router.post  ('/courses',     Validators.course, CourseCtrl.create);
router.put   ('/courses/:id', Validators.course, CourseCtrl.update);
router.delete('/courses/:id', CourseCtrl.remove);

// Enrollments (nested under courses)
router.post  ('/courses/:id/enrollments',               Validators.enrollment,       CourseCtrl.enroll);
router.put   ('/courses/:id/enrollments/:enrollmentId', Validators.enrollmentUpdate, CourseCtrl.updateEnrollment);
router.delete('/courses/:id/enrollments/:enrollmentId',                              CourseCtrl.deleteEnrollment);

module.exports = router;
