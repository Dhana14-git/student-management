'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YEAR_NOW = new Date().getFullYear();

function err(res, msg, field = null) {
  return res.status(400).json({ error: msg, field });
}

const Validators = {

  student(req, res, next) {
    const {
      student_id, first_name, last_name, email,
      gender, status, enrollment_year, gpa,
    } = req.body;

    if (!student_id?.trim())  return err(res, 'Student ID is required',   'student_id');
    if (!first_name?.trim())  return err(res, 'First name is required',   'first_name');
    if (!last_name?.trim())   return err(res, 'Last name is required',    'last_name');
    if (!email?.trim())       return err(res, 'Email is required',        'email');
    if (!EMAIL_RE.test(email)) return err(res, 'Invalid email address',   'email');

    if (gender && !['Male','Female','Other','Prefer not to say'].includes(gender))
      return err(res, 'Invalid gender value', 'gender');

    if (status && !['Active','Inactive','Graduated','Suspended'].includes(status))
      return err(res, 'Invalid status value', 'status');

    if (enrollment_year) {
      const y = Number(enrollment_year);
      if (isNaN(y) || y < 1900 || y > YEAR_NOW + 1)
        return err(res, 'Invalid enrollment year', 'enrollment_year');
    }

    if (gpa !== undefined && gpa !== null && gpa !== '') {
      const g = Number(gpa);
      if (isNaN(g) || g < 0 || g > 4.0)
        return err(res, 'GPA must be between 0.00 and 4.00', 'gpa');
    }

    next();
  },

  department(req, res, next) {
    const { name, code } = req.body;
    if (!name?.trim()) return err(res, 'Department name is required', 'name');
    if (!code?.trim()) return err(res, 'Department code is required', 'code');
    if (code.length > 10) return err(res, 'Code must be ≤ 10 characters', 'code');
    next();
  },

  course(req, res, next) {
    const { course_code, title, credits, max_capacity } = req.body;
    if (!course_code?.trim()) return err(res, 'Course code is required', 'course_code');
    if (!title?.trim())       return err(res, 'Title is required',       'title');
    if (credits !== undefined) {
      const c = Number(credits);
      if (isNaN(c) || c < 1 || c > 10)
        return err(res, 'Credits must be 1–10', 'credits');
    }
    if (max_capacity !== undefined) {
      const m = Number(max_capacity);
      if (isNaN(m) || m < 1 || m > 1000)
        return err(res, 'Capacity must be 1–1000', 'max_capacity');
    }
    next();
  },

  enrollment(req, res, next) {
    const { student_id, semester, year } = req.body;
    if (!student_id)         return err(res, 'Student is required',  'student_id');
    if (!semester?.trim())   return err(res, 'Semester is required', 'semester');
    if (!year)               return err(res, 'Year is required',     'year');
    const y = Number(year);
    if (isNaN(y) || y < 1900 || y > YEAR_NOW + 1)
      return err(res, 'Invalid year', 'year');
    next();
  },

  enrollmentUpdate(req, res, next) {
    const { grade, letter_grade, status } = req.body;
    const validStatuses = ['Enrolled','Completed','Dropped','Withdrawn'];
    if (status && !validStatuses.includes(status))
      return err(res, 'Invalid enrollment status', 'status');
    if (grade !== undefined && grade !== null && grade !== '') {
      const g = Number(grade);
      if (isNaN(g) || g < 0 || g > 100)
        return err(res, 'Grade must be 0–100', 'grade');
    }
    const validLetters = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F','W','I'];
    if (letter_grade && !validLetters.includes(letter_grade))
      return err(res, 'Invalid letter grade', 'letter_grade');
    next();
  },
};

module.exports = Validators;
