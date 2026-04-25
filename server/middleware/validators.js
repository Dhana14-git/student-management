'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\-\d\s().]{7,20}$/;
const YEAR_NOW = new Date().getFullYear();

function err(res, msg, field = null) {
  return res.status(400).json({ error: msg, field });
}

// Sanitize: trim all string fields on req.body in place
function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}

const Validators = {

  student(req, res, next) {
    const {
      student_id, first_name, last_name, email,
      phone, date_of_birth, gender, status, enrollment_year, gpa,
    } = req.body;

    if (!student_id?.trim())   return err(res, 'Student ID is required',   'student_id');
    if (student_id.length > 20) return err(res, 'Student ID max 20 chars', 'student_id');
    if (!first_name?.trim())   return err(res, 'First name is required',   'first_name');
    if (first_name.length > 50) return err(res, 'First name max 50 chars', 'first_name');
    if (!last_name?.trim())    return err(res, 'Last name is required',    'last_name');
    if (last_name.length > 50) return err(res, 'Last name max 50 chars',  'last_name');
    if (!email?.trim())        return err(res, 'Email is required',        'email');
    if (!EMAIL_RE.test(email)) return err(res, 'Invalid email address',    'email');
    if (email.length > 120)    return err(res, 'Email max 120 chars',      'email');

    if (phone && phone.trim()) {
      if (!PHONE_RE.test(phone.trim()))
        return err(res, 'Invalid phone number format', 'phone');
    }

    if (date_of_birth && date_of_birth.trim()) {
      const d = new Date(date_of_birth);
      if (isNaN(d.getTime()))
        return err(res, 'Invalid date of birth', 'date_of_birth');
      const minYear = YEAR_NOW - 120;
      const maxYear = YEAR_NOW - 10;
      if (d.getFullYear() < minYear || d.getFullYear() > maxYear)
        return err(res, `Date of birth must be between ${minYear} and ${maxYear}`, 'date_of_birth');
    }

    if (gender && !['Male','Female','Other','Prefer not to say'].includes(gender))
      return err(res, 'Invalid gender value', 'gender');

    if (status && !['Active','Inactive','Graduated','Suspended'].includes(status))
      return err(res, 'Invalid status value', 'status');

    if (enrollment_year !== undefined && enrollment_year !== null && enrollment_year !== '') {
      const y = Number(enrollment_year);
      if (isNaN(y) || y < 1900 || y > YEAR_NOW + 1)
        return err(res, `Enrollment year must be between 1900 and ${YEAR_NOW + 1}`, 'enrollment_year');
    }

    if (gpa !== undefined && gpa !== null && gpa !== '') {
      const g = Number(gpa);
      if (isNaN(g) || g < 0 || g > 4.0)
        return err(res, 'GPA must be between 0.00 and 4.00', 'gpa');
    }

    next();
  },

  department(req, res, next) {
    const { name, code, head_name } = req.body;
    if (!name?.trim())  return err(res, 'Department name is required', 'name');
    if (name.length > 100) return err(res, 'Name max 100 chars', 'name');
    if (!code?.trim())  return err(res, 'Department code is required', 'code');
    if (code.length > 10) return err(res, 'Code must be ≤ 10 characters', 'code');
    if (!/^[A-Za-z0-9]+$/.test(code.trim()))
      return err(res, 'Code must be alphanumeric only', 'code');
    if (head_name && head_name.length > 100)
      return err(res, 'Head name max 100 chars', 'head_name');
    next();
  },

  course(req, res, next) {
    const { course_code, title, credits, max_capacity, instructor } = req.body;
    if (!course_code?.trim()) return err(res, 'Course code is required', 'course_code');
    if (course_code.length > 20) return err(res, 'Course code max 20 chars', 'course_code');
    if (!title?.trim())       return err(res, 'Title is required',       'title');
    if (title.length > 150)   return err(res, 'Title max 150 chars',     'title');

    if (credits !== undefined && credits !== null && credits !== '') {
      const c = Number(credits);
      if (isNaN(c) || c < 1 || c > 10)
        return err(res, 'Credits must be 1–10', 'credits');
    }
    if (max_capacity !== undefined && max_capacity !== null && max_capacity !== '') {
      const m = Number(max_capacity);
      if (isNaN(m) || m < 1 || m > 1000)
        return err(res, 'Capacity must be 1–1000', 'max_capacity');
    }
    if (instructor && instructor.length > 100)
      return err(res, 'Instructor name max 100 chars', 'instructor');
    next();
  },

  enrollment(req, res, next) {
    const { student_id, semester, year } = req.body;
    if (!student_id)         return err(res, 'Student is required',  'student_id');
    if (!semester?.trim())   return err(res, 'Semester is required', 'semester');
    const VALID_SEMESTERS = ['Fall','Spring','Summer','Winter'];
    if (!VALID_SEMESTERS.includes(semester?.trim()))
      return err(res, `Semester must be one of: ${VALID_SEMESTERS.join(', ')}`, 'semester');
    if (!year)               return err(res, 'Year is required',     'year');
    const y = Number(year);
    if (isNaN(y) || y < 1900 || y > YEAR_NOW + 1)
      return err(res, `Year must be between 1900 and ${YEAR_NOW + 1}`, 'year');
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

// Attach sanitize as a helper middleware to be used globally
Validators.sanitize = sanitize;

module.exports = Validators;
