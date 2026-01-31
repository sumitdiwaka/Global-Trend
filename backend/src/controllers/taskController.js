const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// Create Task
exports.createTask = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { title, description, status } = req.body;

        const task = await Task.create({
            title,
            description: description || '',
            status: status || 'todo',
            user: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error creating task' 
        });
    }
};

// Get All Tasks for User
exports.getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { user: req.user._id };
        
        if (status && ['todo', 'in-progress', 'completed'].includes(status)) {
            filter.status = status;
        }

        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching tasks' 
        });
    }
};

// Get Single Task
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Update Task

exports.updateTask = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        let task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        const { title, description, status, priority, dueDate, progress } = req.body;
        
        // Update only the fields that are provided
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (progress !== undefined) task.progress = progress;

        // If marking as completed and no progress set, set to 100%
        if (status === 'completed' && (progress === undefined || progress < 100)) {
            task.progress = 100;
        }

        await task.save();

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating task' 
        });
    }
};
// exports.updateTask = async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ 
//                 success: false, 
//                 errors: errors.array() 
//             });
//         }

//         let task = await Task.findOne({
//             _id: req.params.id,
//             user: req.user._id
//         });

//         if (!task) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'Task not found' 
//             });
//         }

//         const { title, description, status } = req.body;
        
//         task.title = title || task.title;
//         task.description = description !== undefined ? description : task.description;
//         task.status = status || task.status;

//         await task.save();

//         res.json({
//             success: true,
//             message: 'Task updated successfully',
//             data: task
//         });
//     } catch (error) {
//         console.error('Update task error:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Server error updating task' 
//         });
//     }
// };

// Delete Task
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error deleting task' 
        });
    }
};