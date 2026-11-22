const Category = require('../models/Category');

async function listCategories(req, res) {
  res.json({ categories: await Category.find().sort({ name: 1 }) });
}
async function createCategory(req, res, next) {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
    const category = await Category.create({ name, slug, description });
    res.status(201).json({ category });
  } catch (error) { next(error); }
}
async function updateCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (error) { next(error); }
}
async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) { next(error); }
}
module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
