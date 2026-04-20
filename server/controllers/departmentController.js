'use strict';

const DepartmentModel = require('../models/departmentModel');

const DepartmentController = {

  async list(req, res) {
    try {
      const rows = await DepartmentModel.list();
      res.json({ data: rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const dept = await DepartmentModel.findById(req.params.id);
      if (!dept) return res.status(404).json({ error: 'Department not found' });
      res.json(dept);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { code } = req.body;
      const dupe = await DepartmentModel.findByCode(code);
      if (dupe) return res.status(409).json({ error: 'Department code already exists' });

      const id   = await DepartmentModel.create(req.body);
      const dept = await DepartmentModel.findById(id);
      res.status(201).json({ message: 'Department created', data: dept });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await DepartmentModel.findById(id);
      if (!existing) return res.status(404).json({ error: 'Department not found' });

      const { code } = req.body;
      if (code.toUpperCase() !== existing.code) {
        const dupe = await DepartmentModel.findByCode(code, id);
        if (dupe) return res.status(409).json({ error: 'Department code already in use' });
      }

      await DepartmentModel.update(id, req.body);
      const updated = await DepartmentModel.findById(id);
      res.json({ message: 'Department updated', data: updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      await DepartmentModel.delete(req.params.id);
      res.json({ message: 'Department deleted' });
    } catch (err) {
      const code = err.status || 500;
      res.status(code).json({ error: err.message });
    }
  },
};

module.exports = DepartmentController;
