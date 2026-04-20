'use strict';

const db = require('../config/database');

const DepartmentModel = {

  async list() {
    const [rows] = await db.query(
      `SELECT d.*,
         COUNT(DISTINCT s.id) AS student_count,
         COUNT(DISTINCT c.id) AS course_count
       FROM departments d
       LEFT JOIN students s ON s.department_id = d.id
       LEFT JOIN courses  c ON c.department_id = d.id
       GROUP BY d.id
       ORDER BY d.name`
    );
    return rows;
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
      const [[row]] = await db.query('SELECT id FROM departments WHERE code=? AND id!=?', [code, excludeId]);
      return row || null;
    }
    const [[row]] = await db.query('SELECT id FROM departments WHERE code=?', [code]);
    return row || null;
  },

  async create({ name, code, description = null, head_name = null }) {
    const [r] = await db.query(
      'INSERT INTO departments (name,code,description,head_name) VALUES (?,?,?,?)',
      [name, code.toUpperCase(), description, head_name]
    );
    return r.insertId;
  },

  async update(id, { name, code, description = null, head_name = null }) {
    await db.query(
      'UPDATE departments SET name=?,code=?,description=?,head_name=? WHERE id=?',
      [name, code.toUpperCase(), description, head_name, id]
    );
  },

  async delete(id) {
    // Check integrity — cannot delete if students or courses are linked
    const [[{ sc }]] = await db.query('SELECT COUNT(*) AS sc FROM students WHERE department_id=?', [id]);
    const [[{ cc }]] = await db.query('SELECT COUNT(*) AS cc FROM courses WHERE department_id=?', [id]);
    if (sc > 0 || cc > 0) throw { status: 409, message: `Cannot delete — department has ${sc} student(s) and ${cc} course(s)` };
    await db.query('DELETE FROM departments WHERE id=?', [id]);
  },
};

module.exports = DepartmentModel;
