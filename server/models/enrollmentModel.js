'use strict';

const db = require('../config/database');

// Grade → GPA point mapping
const GRADE_POINTS = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const EnrollmentModel = {

  async listByStudent(studentId) {
    const [rows] = await db.query(
      `SELECT e.*, c.title AS course_title, c.course_code, c.credits, d.name AS dept_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE e.student_id = ?
       ORDER BY e.year DESC, e.semester`,
      [studentId]
    );
    return rows;
  },

  async listByCourse(courseId) {
    const [rows] = await db.query(
      `SELECT e.*, s.first_name, s.last_name, s.student_id AS stu_code
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.course_id = ?
       ORDER BY s.last_name, s.first_name`,
      [courseId]
    );
    return rows;
  },

  async findDuplicate(studentId, courseId, semester, year) {
    const [[row]] = await db.query(
      'SELECT id FROM enrollments WHERE student_id=? AND course_id=? AND semester=? AND year=?',
      [studentId, courseId, semester, year]
    );
    return row || null;
  },

  async create({ student_id, course_id, semester, year, grade=null, letter_grade=null, status='Enrolled' }) {
    const [r] = await db.query(
      `INSERT INTO enrollments (student_id,course_id,semester,year,grade,letter_grade,status)
       VALUES (?,?,?,?,?,?,?)`,
      [student_id, course_id, semester, year, grade, letter_grade, status]
    );
    await EnrollmentModel._recalcGpa(student_id);
    return r.insertId;
  },

  async update(id, { grade=null, letter_grade=null, status='Enrolled' }) {
    const [[enr]] = await db.query('SELECT student_id FROM enrollments WHERE id=?', [id]);
    if (!enr) throw { status: 404, message: 'Enrollment not found' };

    await db.query(
      'UPDATE enrollments SET grade=?,letter_grade=?,status=? WHERE id=?',
      [grade, letter_grade, status, id]
    );
    await EnrollmentModel._recalcGpa(enr.student_id);
  },

  async delete(id) {
    const [[enr]] = await db.query('SELECT student_id FROM enrollments WHERE id=?', [id]);
    if (!enr) throw { status: 404, message: 'Enrollment not found' };
    await db.query('DELETE FROM enrollments WHERE id=?', [id]);
    await EnrollmentModel._recalcGpa(enr.student_id);
  },

  // Recalculate and persist GPA for a student based on completed grades
  async _recalcGpa(studentId) {
    const [rows] = await db.query(
      `SELECT e.letter_grade, c.credits
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id=? AND e.status='Completed' AND e.letter_grade IS NOT NULL`,
      [studentId]
    );

    if (!rows.length) return; // no completed grades yet

    let totalPoints = 0, totalCredits = 0;
    for (const { letter_grade, credits } of rows) {
      const pts = GRADE_POINTS[letter_grade];
      if (pts !== undefined) {
        totalPoints  += pts * credits;
        totalCredits += credits;
      }
    }

    const gpa = totalCredits > 0 ? Math.min(4.0, Math.round((totalPoints / totalCredits) * 100) / 100) : null;
    await db.query('UPDATE students SET gpa=? WHERE id=?', [gpa, studentId]);
  },
};

module.exports = EnrollmentModel;
