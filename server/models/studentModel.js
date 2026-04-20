'use strict';

const db = require('../config/database');

const ALLOWED_SORT = new Set(['first_name','last_name','student_id','email','status','gpa','enrollment_year','created_at']);

const StudentModel = {

  async list({ search='', status='', department_id='', sort='last_name', dir='ASC', page=1, limit=10 }) {
    const safeSort = ALLOWED_SORT.has(sort) ? `s.${sort}` : 's.last_name';
    const safeDir  = dir === 'DESC' ? 'DESC' : 'ASC';
    const offset   = (Math.max(1, page) - 1) * limit;

    const where = []; const vals = [];

    if (search) {
      where.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?)');
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status)        { where.push('s.status = ?');        vals.push(status); }
    if (department_id) { where.push('s.department_id = ?'); vals.push(department_id); }

    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM students s ${clause}`, vals
    );

    const [rows] = await db.query(
      `SELECT s.*, d.name AS department_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       ${clause}
       ORDER BY ${safeSort} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return { data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, d.name AS department_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByStudentId(student_id) {
    const [[row]] = await db.query('SELECT id FROM students WHERE student_id = ?', [student_id]);
    return row || null;
  },

  async findByEmail(email, excludeId = null) {
    if (excludeId) {
      const [[row]] = await db.query('SELECT id FROM students WHERE email = ? AND id != ?', [email, excludeId]);
      return row || null;
    }
    const [[row]] = await db.query('SELECT id FROM students WHERE email = ?', [email]);
    return row || null;
  },

  async create(data) {
    const {
      student_id, first_name, last_name, email,
      phone=null, date_of_birth=null, gender='Prefer not to say',
      address=null, city=null, state=null, postal_code=null,
      department_id=null, enrollment_year=null, status='Active', gpa=null
    } = data;

    const [result] = await db.query(
      `INSERT INTO students
        (student_id,first_name,last_name,email,phone,date_of_birth,gender,
         address,city,state,postal_code,department_id,enrollment_year,status,gpa)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [student_id,first_name,last_name,email,phone,date_of_birth,gender,
       address,city,state,postal_code,department_id||null,enrollment_year||null,status,gpa||null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const {
      student_id, first_name, last_name, email,
      phone=null, date_of_birth=null, gender='Prefer not to say',
      address=null, city=null, state=null, postal_code=null,
      department_id=null, enrollment_year=null, status='Active', gpa=null
    } = data;

    await db.query(
      `UPDATE students SET
        student_id=?,first_name=?,last_name=?,email=?,phone=?,date_of_birth=?,gender=?,
        address=?,city=?,state=?,postal_code=?,department_id=?,enrollment_year=?,status=?,gpa=?
       WHERE id=?`,
      [student_id,first_name,last_name,email,phone,date_of_birth,gender,
       address,city,state,postal_code,department_id||null,enrollment_year||null,status,gpa||null,id]
    );
  },

  async delete(id) {
    await db.query('DELETE FROM students WHERE id=?', [id]);
  },

  async stats() {
    const [[{ total }]]    = await db.query('SELECT COUNT(*) AS total FROM students');
    const [[{ active }]]   = await db.query("SELECT COUNT(*) AS active FROM students WHERE status='Active'");
    const [[{ graduated }]]= await db.query("SELECT COUNT(*) AS graduated FROM students WHERE status='Graduated'");
    const [[{ avgGpa }]]   = await db.query('SELECT ROUND(AVG(gpa),2) AS avgGpa FROM students WHERE gpa IS NOT NULL');

    const [byDept] = await db.query(
      `SELECT d.name, COUNT(s.id) AS count
       FROM departments d LEFT JOIN students s ON s.department_id=d.id
       GROUP BY d.id ORDER BY count DESC`
    );
    const [byStatus] = await db.query(
      `SELECT status, COUNT(*) AS count FROM students GROUP BY status`
    );
    const [recent] = await db.query(
      `SELECT s.*, d.name AS department_name FROM students s
       LEFT JOIN departments d ON s.department_id=d.id
       ORDER BY s.created_at DESC LIMIT 5`
    );

    return { total, active, graduated, avgGpa, byDept, byStatus, recent };
  },
};

module.exports = StudentModel;
