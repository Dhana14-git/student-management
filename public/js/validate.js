'use strict';

const Validate = (() => {

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\-\d\s().]{7,20}$/;
  const YEAR_NOW = new Date().getFullYear();
  const VALID_SEMESTERS = ['Fall','Spring','Summer','Winter'];

  function student(data, formEl) {
    Utils.clearErrors(formEl);
    let valid = true;

    const check = (field, msg, cond) => {
      if (!cond) {
        Utils.formError(formEl.querySelector(`[name="${field}"]`), msg);
        valid = false;
      }
    };

    check('student_id',  'Student ID is required',           !!data.student_id?.trim());
    check('student_id',  'Student ID max 20 characters',     !data.student_id || data.student_id.trim().length <= 20);
    check('first_name',  'First name is required',           !!data.first_name?.trim());
    check('first_name',  'First name max 50 characters',     !data.first_name || data.first_name.trim().length <= 50);
    check('last_name',   'Last name is required',            !!data.last_name?.trim());
    check('last_name',   'Last name max 50 characters',      !data.last_name || data.last_name.trim().length <= 50);
    check('email',       'Email is required',                !!data.email?.trim());
    check('email',       'Invalid email address',            !data.email || EMAIL_RE.test(data.email.trim()));
    check('email',       'Email max 120 characters',         !data.email || data.email.trim().length <= 120);

    if (data.phone?.trim()) {
      check('phone', 'Invalid phone number format (7-20 digits/symbols)', PHONE_RE.test(data.phone.trim()));
    }

    if (data.date_of_birth?.trim()) {
      const d = new Date(data.date_of_birth);
      const validDate = !isNaN(d.getTime());
      check('date_of_birth', 'Invalid date of birth', validDate);
      if (validDate) {
        check('date_of_birth', `Birth year must be between ${YEAR_NOW - 120} and ${YEAR_NOW - 10}`,
          d.getFullYear() >= YEAR_NOW - 120 && d.getFullYear() <= YEAR_NOW - 10);
      }
    }

    if (data.enrollment_year !== '' && data.enrollment_year !== null && data.enrollment_year !== undefined) {
      const y = Number(data.enrollment_year);
      check('enrollment_year', `Enrollment year must be between 1900 and ${YEAR_NOW + 1}`,
        !isNaN(y) && y >= 1900 && y <= YEAR_NOW + 1);
    }

    if (data.gpa !== null && data.gpa !== '' && data.gpa !== undefined) {
      const g = Number(data.gpa);
      check('gpa', 'GPA must be between 0.00 and 4.00', !isNaN(g) && g >= 0 && g <= 4.0);
    }

    return valid;
  }

  function department(data, formEl) {
    Utils.clearErrors(formEl);
    let valid = true;

    const check = (field, msg, cond) => {
      if (!cond) {
        Utils.formError(formEl.querySelector(`[name="${field}"]`), msg);
        valid = false;
      }
    };

    check('name', 'Department name is required',      !!data.name?.trim());
    check('name', 'Department name max 100 chars',    !data.name || data.name.trim().length <= 100);
    check('code', 'Department code is required',      !!data.code?.trim());
    check('code', 'Code must be ≤ 10 characters',     !data.code || data.code.trim().length <= 10);
    check('code', 'Code must be alphanumeric only',   !data.code || /^[A-Za-z0-9]+$/.test(data.code.trim()));

    if (data.head_name?.trim()) {
      check('head_name', 'Head name max 100 chars', data.head_name.trim().length <= 100);
    }

    return valid;
  }

  function course(data, formEl) {
    Utils.clearErrors(formEl);
    let valid = true;

    const check = (field, msg, cond) => {
      if (!cond) {
        Utils.formError(formEl.querySelector(`[name="${field}"]`), msg);
        valid = false;
      }
    };

    check('course_code', 'Course code is required',       !!data.course_code?.trim());
    check('course_code', 'Course code max 20 chars',      !data.course_code || data.course_code.trim().length <= 20);
    check('title',       'Title is required',             !!data.title?.trim());
    check('title',       'Title max 150 characters',      !data.title || data.title.trim().length <= 150);

    if (data.credits !== null && data.credits !== '') {
      const c = Number(data.credits);
      check('credits', 'Credits must be between 1 and 10', !isNaN(c) && c >= 1 && c <= 10);
    }
    if (data.max_capacity !== null && data.max_capacity !== '') {
      const m = Number(data.max_capacity);
      check('max_capacity', 'Capacity must be between 1 and 1000', !isNaN(m) && m >= 1 && m <= 1000);
    }
    if (data.instructor?.trim()) {
      check('instructor', 'Instructor name max 100 chars', data.instructor.trim().length <= 100);
    }

    return valid;
  }

  function enrollment(data, formEl) {
    Utils.clearErrors(formEl);
    let valid = true;

    const check = (field, msg, cond) => {
      if (!cond) {
        Utils.formError(formEl.querySelector(`[name="${field}"]`), msg);
        valid = false;
      }
    };

    check('student_id', 'Student is required',  !!data.student_id);
    check('semester',   'Semester is required',  !!data.semester?.trim());
    if (data.semester?.trim()) {
      check('semester', `Semester must be one of: ${VALID_SEMESTERS.join(', ')}`,
        VALID_SEMESTERS.includes(data.semester.trim()));
    }
    check('year', 'Year is required', !!data.year);
    if (data.year) {
      const y = Number(data.year);
      check('year', `Year must be between 1900 and ${YEAR_NOW + 1}`,
        !isNaN(y) && y >= 1900 && y <= YEAR_NOW + 1);
    }

    return valid;
  }

  return { student, department, course, enrollment };
})();
