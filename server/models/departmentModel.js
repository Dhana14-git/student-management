'use strict';

const db = require('../config/database');

const ALLOWED_SORT = new Set(['name','code','head_name','student_count','course_count','created_at']);

const DepartmentModel = {

  async list({ search = '', sort = 'name', dir = 'ASC', page = 1, limit = 25 } = {}) {
    const safeSort = ALLOWED_SORT.has(sort) ? sort : 'name';
    const safeDir  = dir === 'DESC' ? 'DESC' : 'ASC';
    const offset   = (Math.max(1, page) - 1) * limit;

    const where = []; const vals = [];
    if (search) {
      where.push('(d.name LIKE ? OR d.code LIKE ? OR d.head_name LIKE ?)');
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM departments d ${clause}`, vals
    );

    const orderCol = ['student_count','course_count'].includes(safeSort) ? safeSort : `d.${safeSort}`;

    const [rows] = await db.query(
      `SELECT d.*,
         COUNT(DISTINCT s.id) AS student_count,
         COUNT(DISTINCT c.id) AS course_count
       FROM departments d
       LEFT JOIN students s ON s.department_id = d.id
       LEFT JOIN courses  c ON c.department_id = d.id
       ${clause}
       GROUP BY d.id
       ORDER BY ${orderCol} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );
    return { data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [[row]] = await db.query(
      `SELECT d.*,
         COUNT(DISTINCT s.id) AS student_count,
         COUNT(DISTINCT c.id) AS course_count
       FROM departments d
       LEFT JOIN students s ON s.department_id = d.id
       LEFT JOIN courses  c ON c.department_id = d.id
       WHERE d.id = ?
       GROUP BY d.id`,
      [id]
    );
    return row || null;
  },

  async findByCode(code, excludeId = null) {
    if (excludeId) {
      const [[row]] = await db.query('SELECT id FROM departments WHERE code=? AND id!=?', [code.toUpperCase(), excludeId]);
      return row || null;
    }
    const [[row]] = await db.query('SELECT id FROM departments WHERE code=?', [code.toUpperCase()]);
    return row || null;
  },

  async create({ name, code, description = null, head_name = null }) {
    const [r] = await db.query(
      'INSERT INTO departments (name,code,description,head_name) VALUES (?,?,?,?)',
      [name.trim(), code.toUpperCase().trim(), description, head_name]
    );
    return r.insertId;
  },

  async update(id, { name, code, description = null, head_name = null }) {
    await db.query(
      'UPDATE departments SET name=?,code=?,description=?,head_name=? WHERE id=?',
      [name.trim(), code.toUpperCase().trim(), description, head_name, id]
    );
  },

  async delete(id) {
    const [[{ sc }]] = await db.query('SELECT COUNT(*) AS sc FROM students WHERE department_id=?', [id]);
    const [[{ cc }]] = await db.query('SELECT COUNT(*) AS cc FROM courses WHERE department_id=?', [id]);
    if (sc > 0 || cc > 0)
      throw { status: 409, message: `Cannot delete — department has ${sc} student(s) and ${cc} course(s)` };
    await db.query('DELETE FROM departments WHERE id=?', [id]);
  },
};

module.exports = DepartmentModel;
