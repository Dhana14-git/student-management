'use strict';

const db = require('../config/database');

const ALLOWED_SORT = new Set(['course_code','title','credits','instructor','enrolled_count','department_name']);

const CourseModel = {

  async list({ search = '', department_id = '', sort = 'course_code', dir = 'ASC', page = 1, limit = 10 } = {}) {
    const safeSort = ALLOWED_SORT.has(sort) ? sort : 'course_code';
    const safeDir  = dir === 'DESC' ? 'DESC' : 'ASC';
    const offset   = (Math.max(1, page) - 1) * limit;

    const where = []; const vals = [];
    if (search) {
      where.push('(c.title LIKE ? OR c.course_code LIKE ? OR c.instructor LIKE ? OR c.description LIKE ?)');
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department_id) { where.push('c.department_id=?'); vals.push(department_id); }

    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Count total (without pagination)
    const [[{ total }]] = await db.query(
      `SELECT COUNT(DISTINCT c.id) AS total FROM courses c ${clause}`, vals
    );

    // Determine ORDER BY — enrolled_count and department_name come from aliases
    const orderCol = ['enrolled_count','department_name'].includes(safeSort)
      ? safeSort
      : `c.${safeSort}`;

    const [rows] = await db.query(
      `SELECT c.*, d.name AS department_name,
         COUNT(e.id) AS enrolled_count
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.status='Enrolled'
       ${clause}
       GROUP BY c.id
       ORDER BY ${orderCol} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );
    return { data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [[row]] = await db.query(
      `SELECT c.*, d.name AS department_name,
         COUNT(e.id) AS enrolled_count
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.status='Enrolled'
       WHERE c.id=?
       GROUP BY c.id`,
      [id]
    );
    return row || null;
  },

  async findByCode(code, excludeId = null) {
    if (excludeId) {
      const [[r]] = await db.query('SELECT id FROM courses WHERE course_code=? AND id!=?', [code.toUpperCase(), excludeId]);
      return r || null;
    }
    const [[r]] = await db.query('SELECT id FROM courses WHERE course_code=?', [code.toUpperCase()]);
    return r || null;
  },

  async create({ course_code, title, description=null, credits=3, department_id=null, instructor=null, max_capacity=30 }) {
    const [r] = await db.query(
      `INSERT INTO courses (course_code,title,description,credits,department_id,instructor,max_capacity)
       VALUES (?,?,?,?,?,?,?)`,
      [course_code.toUpperCase(), title.trim(), description, Number(credits), department_id||null, instructor, Number(max_capacity)]
    );
    return r.insertId;
  },

  async update(id, { course_code, title, description=null, credits=3, department_id=null, instructor=null, max_capacity=30 }) {
    await db.query(
      `UPDATE courses SET course_code=?,title=?,description=?,credits=?,department_id=?,instructor=?,max_capacity=? WHERE id=?`,
      [course_code.toUpperCase(), title.trim(), description, Number(credits), department_id||null, instructor, Number(max_capacity), id]
    );
  },

  async delete(id) {
    const [[{ ec }]] = await db.query("SELECT COUNT(*) AS ec FROM enrollments WHERE course_id=? AND status='Enrolled'", [id]);
    if (ec > 0) throw { status: 409, message: `Cannot delete — course has ${ec} active enrollment(s)` };
    await db.query('DELETE FROM courses WHERE id=?', [id]);
  },

  async checkCapacity(courseId) {
    const [[row]] = await db.query(
      `SELECT c.max_capacity, COUNT(e.id) AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id=c.id AND e.status='Enrolled'
       WHERE c.id=? GROUP BY c.id`,
      [courseId]
    );
    return row || null;
  },
};

module.exports = CourseModel;
