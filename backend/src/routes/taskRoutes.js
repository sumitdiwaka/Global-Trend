const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
    createTask, 
    getTasks, 
    getTask, 
    updateTask, 
    deleteTask 
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const taskValidation = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
];

// All task routes require authentication
router.use(protect);

// Routes
router.post('/', taskValidation, createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', taskValidation, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;