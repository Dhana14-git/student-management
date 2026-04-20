'use strict';

const StudentModel    = require('../models/studentModel');
const EnrollmentModel = require('../models/enrollmentModel');

const StudentController = {

  async list(req, res) {
    try {
      const { search='', status='', department_id='', sort='last_name', dir='ASC', page=1, limit=10 } = req.query;
      const result = await StudentModel.list({ search, status, department_id, sort, dir, page: +page, limit: Math.min(+limit, 100) });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const student = await StudentModel.findById(req.params.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      const enrollments = await EnrollmentModel.listByStudent(req.params.id);
      res.json({ ...student, enrollments });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { student_id, email } = req.body;

      const dupeId = await StudentModel.findByStudentId(student_id);
      if (dupeId) return res.status(409).json({ error: 'Student ID already exists' });

      const dupeEmail = await StudentModel.findByEmail(email);
      if (dupeEmail) return res.status(409).json({ error: 'Email already registered' });

      const insertId = await StudentModel.create(req.body);
      const student  = await StudentModel.findById(insertId);
      res.status(201).json({ message: 'Student created', data: student });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await StudentModel.findById(id);
      if (!existing) return res.status(404).json({ error: 'Student not found' });

      const { student_id, email } = req.body;

      if (student_id !== existing.student_id) {
        const dupeId = await StudentModel.findByStudentId(student_id);
        if (dupeId) return res.status(409).json({ error: 'Student ID already in use' });
      }

      if (email !== existing.email) {
        const dupeEmail = await StudentModel.findByEmail(email, id);
        if (dupeEmail) return res.status(409).json({ error: 'Email already in use' });
      }

      await StudentModel.update(id, req.body);
      const updated = await StudentModel.findById(id);
      res.json({ message: 'Student updated', data: updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const student = await StudentModel.findById(req.params.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      await StudentModel.delete(req.params.id);
      res.json({ message: 'Student deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async stats(req, res) {
    try {
      const data = await StudentModel.stats();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = StudentController;
