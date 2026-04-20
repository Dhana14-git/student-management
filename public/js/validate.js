'use strict';

const Validate = (() => {

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const YEAR_NOW = new Date().getFullYear();

  function student(data, formEl) {
    Utils.clearErrors(formEl);
    let valid = true;

    const check = (field, msg, cond) => {
      if (!cond) {
        Utils.formError(formEl.querySelector(`[name="${field}"]`), msg);
        valid = false;
      }
    };

    check('student_id',  'Student ID is required',      !!data.student_id?.trim());
    check('first_name',  'First name is required',       !!data.first_name?.trim());
    check('last_name',   'Last name is required',        !!data.last_name?.trim());
    check('email',       'Email is required',            !!data.email?.trim());
    check('email',       'Invalid email address',        !data.email || EMAIL_RE.test(data.email));

    if (data.enrollment_year) {
      const y = Number(data.enrollment_year);
      check('enrollment_year', 'Invalid enrollment year', !isNaN(y) && y >= 1900 && y <= YEAR_NOW + 1);
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

    check('name', 'Department name is required', !!data.name?.trim());
    check('code', 'Department code is required', !!data.code?.trim());
    check('code', 'Code must be ≤ 10 characters', !data.code || data.code.length <= 10);

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

    check('course_code', 'Course code is required', !!data.course_code?.trim());
    check('title',       'Title is required',        !!data.title?.trim());

    if (data.credits !== null && data.credits !== '') {
      const c = Number(data.credits);
      check('credits', 'Credits must be 1–10', !isNaN(c) && c >= 1 && c <= 10);
    }
    if (data.max_capacity !== null && data.max_capacity !== '') {
      const m = Number(data.max_capacity);
      check('max_capacity', 'Capacity must be 1–1000', !isNaN(m) && m >= 1 && m <= 1000);
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
    check('year',       'Year is required',       !!data.year);

    if (data.year) {
      const y = Number(data.year);
      check('year', 'Invalid year', !isNaN(y) && y >= 1900 && y <= YEAR_NOW + 1);
    }

    return valid;
  }

  return { student, department, course, enrollment };
})();
