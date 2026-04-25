'use strict';

const CourseModel     = require('../models/courseModel');
const EnrollmentModel = require('../models/enrollmentModel');
const StudentModel    = require('../models/studentModel');

const CourseController = {

  async list(req, res) {
    try {
      const { search='', department_id='', sort='course_code', dir='ASC', page=1, limit=10 } = req.query;
      const result = await CourseModel.list({
        search, department_id,
        sort, dir,
        page: +page, limit: Math.min(+limit, 100),
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const course = await CourseModel.findById(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      const enrollments = await EnrollmentModel.listByCourse(req.params.id);
      res.json({ ...course, enrollments });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { course_code } = req.body;
      const dupe = await CourseModel.findByCode(course_code);
      if (dupe) return res.status(409).json({ error: 'Course code already exists' });

      const id     = await CourseModel.create(req.body);
      const course = await CourseModel.findById(id);
      res.status(201).json({ message: 'Course created', data: course });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await CourseModel.findById(id);
      if (!existing) return res.status(404).json({ error: 'Course not found' });

      const { course_code } = req.body;
      if (course_code.toUpperCase() !== existing.course_code) {
        const dupe = await CourseModel.findByCode(course_code, id);
        if (dupe) return res.status(409).json({ error: 'Course code already in use' });
      }

      await CourseModel.update(id, req.body);
      const updated = await CourseModel.findById(id);
      res.json({ message: 'Course updated', data: updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      await CourseModel.delete(req.params.id);
      res.json({ message: 'Course deleted' });
    } catch (err) {
      const code = err.status || 500;
      res.status(code).json({ error: err.message });
    }
  },

  // Enrollments sub-resource
  async enroll(req, res) {
    try {
      const course_id = Number(req.params.id);
      const { student_id, semester, year, grade=null, letter_grade=null, status='Enrolled' } = req.body;

      const course = await CourseModel.findById(course_id);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const student = await StudentModel.findById(student_id);
      if (!student) return res.status(404).json({ error: 'Student not found' });

      // Capacity check
      const cap = await CourseModel.checkCapacity(course_id);
      if (cap && cap.enrolled_count >= cap.max_capacity)
        return res.status(409).json({ error: `Course is full (${cap.max_capacity} seats)` });

      // Duplicate check
      const dupe = await EnrollmentModel.findDuplicate(student_id, course_id, semester, year);
      if (dupe) return res.status(409).json({ error: 'Student already enrolled in this course/term' });

      const enrId = await EnrollmentModel.create({ student_id, course_id, semester, year, grade, letter_grade, status });
      res.status(201).json({ message: 'Enrolled successfully', id: enrId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateEnrollment(req, res) {
    try {
      const { enrollmentId } = req.params;
      const { grade=null, letter_grade=null, status='Enrolled' } = req.body;
      await EnrollmentModel.update(enrollmentId, { grade, letter_grade, status });
      res.json({ message: 'Enrollment updated' });
    } catch (err) {
      const code = err.status || 500;
      res.status(code).json({ error: err.message });
    }
  },

  async deleteEnrollment(req, res) {
    try {
      await EnrollmentModel.delete(req.params.enrollmentId);
      res.json({ message: 'Enrollment removed' });
    } catch (err) {
      const code = err.status || 500;
      res.status(code).json({ error: err.message });
    }
  },
};

module.exports = CourseController;
