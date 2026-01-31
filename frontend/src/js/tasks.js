class TaskManager {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/tasks' ||  'https://global-trend-0kt7.onrender.com';
        this.auth = window.auth;
        this.currentFilter = 'all';
        this.tasks = [];
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.stats = {
            total: 0,
            todo: 0,
            inProgress: 0,
            completed: 0
        };
        this.init();
    }

    init() {
        if (!this.auth.isAuthenticated()) {
            console.warn('User not authenticated');
            this.auth.logout();
            return;
        }
        
        this.loadTasks();
        this.bindEvents();
        this.updateUserInfo();
        this.renderCalendar();
        this.setupSearch();
        this.updateUserAvatar();
        
        // Bind Create First Task button
        this.bindCreateFirstTaskButton();
    }

    bindEvents() {
        // Add task button
        document.getElementById('addTaskBtn')?.addEventListener('click', () => this.showTaskModal());
        
        // Calendar navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.prevMonth());
        document.getElementById('nextMonth')?.addEventListener('click', () => this.nextMonth());
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());
        
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Task form submission
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sortTasks');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSort(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.auth.logout();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Cancel task button
        const cancelTaskBtn = document.getElementById('cancelTaskBtn');
        if (cancelTaskBtn) {
            cancelTaskBtn.addEventListener('click', () => {
                document.getElementById('taskModal').classList.remove('active');
                document.getElementById('taskForm').reset();
                const progressSlider = document.getElementById('taskProgress');
                const progressValue = document.getElementById('progressValue');
                if (progressSlider && progressValue) {
                    progressSlider.value = 0;
                    progressValue.textContent = '0%';
                }
            });
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });

        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        // Task progress slider
        const progressSlider = document.getElementById('taskProgress');
        const progressValue = document.getElementById('progressValue');
        if (progressSlider && progressValue) {
            progressSlider.addEventListener('input', function() {
                progressValue.textContent = this.value + '%';
            });
        }
    }

    bindCreateFirstTaskButton() {
        // This will be called after tasks are loaded to bind the button
        setTimeout(() => {
            const createFirstBtn = document.getElementById('createFirstTask');
            if (createFirstBtn) {
                createFirstBtn.addEventListener('click', () => this.showTaskModal());
            }
        }, 100);
    }

    async loadTasks(filter = 'all') {
        try {
            this.showLoading('Loading tasks...');
            
            let url = this.baseURL;
            if (filter !== 'all') {
                url += `?status=${filter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getAuthToken()}`
                }
            });

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.tasks = data.data;
                this.calculateStats();
                this.renderTasks(data.data);
                this.updateStatsCards();
                this.renderCalendar();
                this.updateProgressBar();
                this.updateCalendarTasksCount();
                
                // Re-bind Create First Task button after tasks are loaded
                this.bindCreateFirstTaskButton();
            } else {
                this.showToast(data.message || 'Failed to load tasks', 'error');
            }
        } catch (error) {
            console.error('Load tasks error:', error);
            
            // Handle specific error cases
            if (error.message.includes('401') || error.message.includes('token')) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    this.auth.logout();
                }, 2000);
            } else if (error.message.includes('Network error')) {
                this.showToast('Network error. Please check your connection.', 'error');
            } else {
                this.showToast(error.message || 'Failed to load tasks. Please try again.', 'error');
            }
            
            // Still render empty state even if there's an error
            this.renderTasks([]);
        } finally {
            this.hideLoading();
        }
    }

    calculateStats() {
        this.stats = {
            total: this.tasks.length,
            todo: this.tasks.filter(t => t.status === 'todo').length,
            inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };
    }

    updateStatsCards() {
        document.querySelectorAll('.stat-total').forEach(el => el.textContent = this.stats.total);
        document.querySelectorAll('.stat-todo').forEach(el => el.textContent = this.stats.todo);
        document.querySelectorAll('.stat-progress').forEach(el => el.textContent = this.stats.inProgress);
        document.querySelectorAll('.stat-completed').forEach(el => el.textContent = this.stats.completed);

        const taskCountElement = document.getElementById('taskCount');
        if (taskCountElement) {
            taskCountElement.textContent = `${this.stats.total} ${this.stats.total === 1 ? 'task' : 'tasks'}`;
        }
    }

    updateProgressBar() {
        const progressPercent = this.stats.total > 0 
            ? (this.stats.completed / this.stats.total) * 100 
            : 0;
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) progressFill.style.width = `${progressPercent}%`;
        if (progressText) progressText.textContent = `${Math.round(progressPercent)}%`;
    }

    updateCalendarTasksCount() {
        const calendarTasksCount = document.getElementById('calendarTasksCount');
        if (calendarTasksCount) {
            const tasksWithDueDate = this.tasks.filter(task => task.dueDate).length;
            calendarTasksCount.textContent = tasksWithDueDate;
        }
    }

    renderTasks(tasks) {
        const container = document.getElementById('tasksContainer');
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        const sortBy = document.getElementById('sortTasks')?.value || 'date-desc';
        const sortedTasks = this.sortTasks(tasks, sortBy);

        container.innerHTML = sortedTasks.map((task, index) => 
            this.createTaskCard(task, index)
        ).join('');
        
        this.bindTaskEvents();
        this.updateBulkActionsBar();
    }

    createTaskCard(task, index) {
        const statusClass = task.status;
        const statusText = this.getStatusText(task.status);
        const priority = task.priority || 'medium';
        const priorityText = this.getPriorityText(priority);
        
        const createdAt = new Date(task.createdAt);
        const createdDate = createdAt.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let daysLeft = null;
        let dueDateText = '';
        let dueDateClass = '';
        let dueDateBadge = '';
        
        if (dueDate) {
            const dueDateOnly = new Date(dueDate);
            dueDateOnly.setHours(0, 0, 0, 0);
            
            daysLeft = Math.ceil((dueDateOnly - today) / (1000 * 60 * 60 * 24));
            dueDateText = dueDateOnly.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: dueDateOnly.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
            
            if (daysLeft < 0) {
                dueDateClass = 'overdue';
                dueDateBadge = `<span class="date-badge overdue">Overdue</span>`;
            } else if (daysLeft === 0) {
                dueDateClass = 'today';
                dueDateBadge = `<span class="date-badge today">Today</span>`;
            } else if (daysLeft === 1) {
                dueDateClass = 'tomorrow';
                dueDateBadge = `<span class="date-badge tomorrow">Tomorrow</span>`;
            } else if (daysLeft <= 7) {
                dueDateClass = 'upcoming';
                dueDateBadge = `<span class="date-badge upcoming">${daysLeft} days</span>`;
            }
        }
        
        const description = task.description 
            ? (task.description.length > 150 
                ? task.description.substring(0, 150) + '...' 
                : task.description)
            : 'No description provided';

        const progress = task.progress || 0;

        return `
            <div class="task-card ${statusClass} ${dueDateClass}" data-id="${task._id}" data-order="${index}">
                <div class="task-header">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div class="task-select-container">
                                <input type="checkbox" class="task-select" data-id="${task._id}" id="task-checkbox-${task._id}">
                            </div>
                            <h3 class="task-title">${task.title}</h3>
                        </div>
                        <div class="task-meta">
                            <span class="task-status ${statusClass}">${statusText}</span>
                            <span class="task-tag">
                                <span class="priority ${priority}"></span>
                                ${priorityText}
                            </span>
                            ${dueDate ? `
                                <span class="task-tag">
                                    <i class="far fa-calendar"></i>
                                    ${dueDateText}
                                    ${dueDateBadge}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <p class="task-description">${description}</p>
                
                ${statusClass !== 'completed' && progress > 0 ? `
                    <div class="task-progress">
                        <div class="progress-label">
                            <span>Progress</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="task-footer">
                    <div class="task-date">
                        <i class="far fa-clock"></i>
                        <span>Created: ${createdDate}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-icon edit-task" data-id="${task._id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${task.status !== 'completed' ? `
                            <button class="task-complete-btn complete-single-task" data-id="${task._id}">
                                <i class="fas fa-check"></i> Complete
                            </button>
                        ` : ''}
                        <button class="btn-icon delete-task" data-id="${task._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'todo': 'To Do',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statusMap[status] || status;
    }

    getPriorityText(priority) {
        const priorityMap = {
            'high': 'High Priority',
            'medium': 'Medium Priority',
            'low': 'Low Priority'
        };
        return priorityMap[priority] || priority;
    }

    createEmptyState() {
        const filterText = this.currentFilter === 'all' 
            ? 'No tasks found. Start by creating your first task!' 
            : `No ${this.currentFilter.replace('-', ' ')} tasks found`;
        
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <h3>No tasks found</h3>
                <p>${filterText}</p>
                <button id="createFirstTask" class="btn btn-primary mt-3">
                    <i class="fas fa-plus"></i> Create Your First Task
                </button>
            </div>
        `;
    }

    bindTaskEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEditTask(e));
        });
        
        // Complete single task buttons
        document.querySelectorAll('.complete-single-task').forEach(btn => {
            btn.addEventListener('click', (e) => this.completeSingleTask(e));
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteSingleTask(e));
        });
        
        // Checkboxes
        document.querySelectorAll('.task-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateBulkActionsBar());
        });
    }

    async completeSingleTask(e) {
        const taskId = e.currentTarget.dataset.id;
        const task = this.tasks.find(t => t._id === taskId);
        
        if (!task) return;
        
        const confirmed = await this.showConfirmation({
            title: 'Complete Task',
            subtitle: 'Mark this task as completed?',
            message: `Are you sure you want to mark "${task.title}" as completed?`,
            type: 'info',
            confirmText: 'Complete',
            confirmClass: 'btn-success'
        });
        
        if (confirmed) {
            await this.markTaskComplete(taskId);
        }
    }

    async deleteSingleTask(e) {
        const taskId = e.currentTarget.dataset.id;
        const task = this.tasks.find(t => t._id === taskId);
        
        if (!task) return;
        
        const confirmed = await this.showConfirmation({
            title: 'Delete Task',
            subtitle: 'Permanently delete this task?',
            message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            confirmClass: 'btn-danger'
        });
        
        if (confirmed) {
            await this.deleteTask(taskId);
        }
    }

    async markTaskComplete(taskId) {
    try {
        // First, get the current task to preserve other fields
        const task = this.tasks.find(t => t._id === taskId);
        if (!task) {
            this.showToast('Task not found', 'error');
            return;
        }

        const response = await fetch(`${this.baseURL}/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.auth.getAuthToken()}`
            },
            body: JSON.stringify({ 
                status: 'completed',
                progress: 100,
                // Preserve other fields
                title: task.title,
                description: task.description,
                priority: task.priority || 'medium',
                dueDate: task.dueDate || undefined
            })
        });

        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.errors?.[0]?.msg || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.success) {
            this.showToast('Task marked as completed!', 'success');
            this.loadTasks(this.currentFilter);
        } else {
            this.showToast(data.message || 'Failed to complete task', 'error');
        }
    } catch (error) {
        console.error('Complete task error:', error);
        
        // More specific error handling
        if (error.message.includes('Title is required')) {
            this.showToast('Task title is required. Please edit the task first.', 'error');
        } else if (error.message.includes('must be at least')) {
            this.showToast('Task title is too short. Please edit the task first.', 'error');
        } else if (error.message.includes('400')) {
            this.showToast('Invalid task data. Please try again.', 'error');
        } else if (error.message.includes('404')) {
            this.showToast('Task not found. It may have been deleted.', 'error');
            this.loadTasks(this.currentFilter);
        } else if (error.message.includes('Network error')) {
            this.showToast('Network error. Please check your connection.', 'error');
        } else {
            this.showToast(error.message || 'Failed to complete task', 'error');
        }
    }
}

    // async markTaskComplete(taskId) {
    //     try {
    //         const response = await fetch(`${this.baseURL}/${taskId}`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${this.auth.getAuthToken()}`
    //             },
    //             body: JSON.stringify({ status: 'completed' })
    //         });

    //         // Check if response is ok
    //         if (!response.ok) {
    //             const errorData = await response.json().catch(() => ({}));
    //             throw new Error(errorData.message || `Server error: ${response.status}`);
    //         }

    //         const data = await response.json();

    //         if (data.success) {
    //             this.showToast('Task marked as completed!', 'success');
    //             this.loadTasks(this.currentFilter);
    //         } else {
    //             this.showToast(data.message || 'Failed to complete task', 'error');
    //         }
    //     } catch (error) {
    //         console.error('Complete task error:', error);
            
    //         if (error.message.includes('400')) {
    //             this.showToast('Invalid task data. Please try again.', 'error');
    //         } else if (error.message.includes('404')) {
    //             this.showToast('Task not found. It may have been deleted.', 'error');
    //             this.loadTasks(this.currentFilter);
    //         } else {
    //             this.showToast('Network error. Please try again.', 'error');
    //         }
    //     }
    // }

    async deleteTask(taskId) {
        try {
            const response = await fetch(`${this.baseURL}/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.auth.getAuthToken()}`
                }
            });

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.showToast('Task deleted successfully!', 'success');
                this.loadTasks(this.currentFilter);
            } else {
                this.showToast(data.message || 'Failed to delete task', 'error');
            }
        } catch (error) {
            console.error('Delete task error:', error);
            
            if (error.message.includes('404')) {
                this.showToast('Task not found. It may have been deleted.', 'error');
                this.loadTasks(this.currentFilter);
            } else {
                this.showToast('Network error. Please try again.', 'error');
            }
        }
    }

    updateBulkActionsBar() {
        const selectedIds = this.getSelectedTaskIds();
        const bulkActionsBar = document.getElementById('bulkActionsBar');
        const selectedCount = document.getElementById('selectedTasksCount');
        
        if (bulkActionsBar && selectedCount) {
            selectedCount.textContent = selectedIds.length;
            
            if (selectedIds.length > 0) {
                bulkActionsBar.style.display = 'flex';
                
                // Update bulk action buttons
                const bulkCompleteBtn = document.getElementById('bulkCompleteBtn');
                const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
                const clearSelectionBtn = document.getElementById('clearSelectionBtn');
                
                if (bulkCompleteBtn) {
                    bulkCompleteBtn.onclick = async () => {
                        const confirmed = await this.showConfirmation({
                            title: 'Complete Tasks',
                            subtitle: 'Mark selected tasks as completed?',
                            message: `Are you sure you want to mark ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''} as completed?`,
                            type: 'info',
                            confirmText: 'Complete',
                            confirmClass: 'btn-success'
                        });
                        
                        if (confirmed) {
                            await this.bulkCompleteTasks(selectedIds);
                            bulkActionsBar.style.display = 'none';
                        }
                    };
                }
                
                if (bulkDeleteBtn) {
                    bulkDeleteBtn.onclick = async () => {
                        const confirmed = await this.showConfirmation({
                            title: 'Delete Tasks',
                            subtitle: 'Permanently delete selected tasks?',
                            message: `Are you sure you want to delete ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
                            type: 'danger',
                            confirmText: 'Delete',
                            confirmClass: 'btn-danger'
                        });
                        
                        if (confirmed) {
                            await this.bulkDeleteTasks(selectedIds);
                            bulkActionsBar.style.display = 'none';
                        }
                    };
                }
                
                if (clearSelectionBtn) {
                    clearSelectionBtn.onclick = () => {
                        document.querySelectorAll('.task-select:checked').forEach(cb => {
                            cb.checked = false;
                        });
                        bulkActionsBar.style.display = 'none';
                    };
                }
            } else {
                bulkActionsBar.style.display = 'none';
            }
        }
    }

    getSelectedTaskIds() {
        const checkboxes = document.querySelectorAll('.task-select:checked');
        return Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
    }

    async bulkCompleteTasks(selectedIds) {
        try {
            this.showLoading('Completing tasks...');
            
            const promises = selectedIds.map(id =>
                fetch(`${this.baseURL}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.auth.getAuthToken()}`
                    },
                    body: JSON.stringify({ status: 'completed' })
                })
            );

            const results = await Promise.all(promises);
            
            // Check all responses
            const errors = [];
            results.forEach((res, index) => {
                if (!res.ok) {
                    errors.push(`Task ${index + 1}: ${res.statusText}`);
                }
            });

            if (errors.length === 0) {
                this.showToast(`${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''} completed successfully!`, 'success');
                this.loadTasks(this.currentFilter);
            } else {
                this.showToast(`Some tasks could not be completed: ${errors.join(', ')}`, 'error');
            }
        } catch (error) {
            console.error('Bulk complete error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async bulkDeleteTasks(selectedIds) {
        try {
            this.showLoading('Deleting tasks...');
            
            const promises = selectedIds.map(id =>
                fetch(`${this.baseURL}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.auth.getAuthToken()}`
                    }
                })
            );

            const results = await Promise.all(promises);
            
            // Check all responses
            const errors = [];
            results.forEach((res, index) => {
                if (!res.ok) {
                    errors.push(`Task ${index + 1}: ${res.statusText}`);
                }
            });

            if (errors.length === 0) {
                this.showToast(`${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''} deleted successfully!`, 'success');
                this.loadTasks(this.currentFilter);
            } else {
                this.showToast(`Some tasks could not be deleted: ${errors.join(', ')}`, 'error');
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Add these methods to your TaskManager class

renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    
    if (!calendarGrid || !calendarMonthYear) return;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    calendarMonthYear.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = new Date();
    
    // Get tasks for this month
    const monthTasks = this.tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate.getMonth() === this.currentMonth && 
               dueDate.getFullYear() === this.currentYear;
    });

    // Group tasks by date
    const tasksByDate = {};
    monthTasks.forEach(task => {
        const dueDate = new Date(task.dueDate);
        const dateKey = dueDate.getDate();
        
        if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
        }
        
        tasksByDate[dateKey].push(task);
    });

    let calendarHTML = '';
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        calendarHTML += `<div class="calendar-day header">${day}</div>`;
    });

    // Empty days for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Days of the month with tasks
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateKey = day;
        const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasksByDate[dateKey] || [];
        const isToday = today.getDate() === day && 
                       today.getMonth() === this.currentMonth && 
                       today.getFullYear() === this.currentYear;
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' active';
        if (dayTasks.length > 0) dayClass += ' has-tasks task-day';
        if (dayTasks.length > 1) dayClass += ' multiple-tasks';
        
        // Task preview for this day
        let taskPreviewHTML = '';
        let taskCountBadge = '';
        let tooltipHTML = '';
        
        if (dayTasks.length > 0) {
            // Show up to 2 tasks in preview
            const previewTasks = dayTasks.slice(0, 2);
            
            taskPreviewHTML = `
                <div class="calendar-task-preview">
                    ${previewTasks.map(task => `
                        <div class="calendar-task-item">
                            <div class="calendar-task-priority ${task.priority || 'medium'}"></div>
                            <div class="calendar-task-title">${task.title}</div>
                        </div>
                    `).join('')}
                    ${dayTasks.length > 2 ? `
                        <div class="calendar-task-item" style="justify-content: center; color: var(--gray-500);">
                            +${dayTasks.length - 2} more
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Task count badge
            if (dayTasks.length > 1) {
                taskCountBadge = `<div class="calendar-task-count-badge">${dayTasks.length}</div>`;
            }
            
            // Tooltip with task names
            const taskNames = dayTasks.map(task => task.title).join(', ');
            tooltipHTML = `<div class="calendar-tooltip">${taskNames}</div>`;
        }
        
        // Task dots indicator (existing)
        let taskDots = '';
        if (dayTasks.length > 0) {
            // Count tasks by status for dots
            const statusCounts = {
                todo: dayTasks.filter(t => t.status === 'todo').length,
                inProgress: dayTasks.filter(t => t.status === 'in-progress').length,
                completed: dayTasks.filter(t => t.status === 'completed').length
            };
            
            taskDots = `
                <div class="calendar-task-dots">
                    ${statusCounts.todo > 0 ? '<div class="calendar-task-dot todo"></div>' : ''}
                    ${statusCounts.inProgress > 0 ? '<div class="calendar-task-dot in-progress"></div>' : ''}
                    ${statusCounts.completed > 0 ? '<div class="calendar-task-dot completed"></div>' : ''}
                </div>
            `;
        }
        
        calendarHTML += `
            <div class="${dayClass}" data-date="${dateStr}" data-tasks-count="${dayTasks.length}">
                ${taskPreviewHTML}
                ${taskCountBadge}
                ${day}
                ${taskDots}
                ${tooltipHTML}
            </div>
        `;
    }

    calendarGrid.innerHTML = calendarHTML;
    
    // Add click handlers for calendar days
    calendarGrid.querySelectorAll('.calendar-day:not(.header):not(.empty)').forEach(day => {
        day.addEventListener('click', (e) => {
            // Don't trigger if clicking on task preview
            if (!e.target.closest('.calendar-task-preview') && !e.target.closest('.calendar-task-count-badge')) {
                this.handleCalendarDayClick(day);
            }
        });
        
        // Also make task preview clickable
        const taskPreview = day.querySelector('.calendar-task-preview');
        if (taskPreview) {
            taskPreview.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent day click
                this.handleCalendarDayClick(day);
            });
        }
        
        // Make count badge clickable
        const countBadge = day.querySelector('.calendar-task-count-badge');
        if (countBadge) {
            countBadge.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent day click
                this.handleCalendarDayClick(day);
            });
        }
    });
}

handleCalendarDayClick(dayElement) {
    const date = dayElement.dataset.date;
    const tasksOnDate = this.tasks.filter(task => 
        task.dueDate && task.dueDate.startsWith(date)
    );
    
    if (tasksOnDate.length > 0) {
        this.showDateTasksModal(date, tasksOnDate);
    } else {
        this.showToast(`No tasks scheduled for ${date}`, 'info');
    }
}

showDateTasksModal(date, tasks) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Sort tasks by priority (high to low) and then by status
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        const statusOrder = { todo: 1, 'in-progress': 2, completed: 3 };
        
        const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    const modalHTML = `
        <div class="modal active calendar-date-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Tasks for ${formattedDate}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="date-tasks-container">
                        ${sortedTasks.map(task => {
                            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            let daysLeft = null;
                            
                            if (dueDate) {
                                const dueDateOnly = new Date(dueDate);
                                dueDateOnly.setHours(0, 0, 0, 0);
                                daysLeft = Math.ceil((dueDateOnly - today) / (1000 * 60 * 60 * 24));
                            }
                            
                            let urgencyBadge = '';
                            if (daysLeft < 0) {
                                urgencyBadge = '<span class="date-badge overdue" style="margin-left: 8px;">Overdue</span>';
                            } else if (daysLeft === 0) {
                                urgencyBadge = '<span class="date-badge today" style="margin-left: 8px;">Due Today</span>';
                            } else if (daysLeft === 1) {
                                urgencyBadge = '<span class="date-badge tomorrow" style="margin-left: 8px;">Tomorrow</span>';
                            } else if (daysLeft <= 3) {
                                urgencyBadge = `<span class="date-badge upcoming" style="margin-left: 8px;">${daysLeft} days</span>`;
                            }
                            
                            return `
                                <div class="date-task-full ${task.status}">
                                    <div class="date-task-full-header">
                                        <div class="date-task-full-title">${task.title}</div>
                                        <div class="date-task-full-priority ${task.priority || 'medium'}">
                                            ${this.getPriorityText(task.priority).replace(' Priority', '')}
                                        </div>
                                    </div>
                                    
                                    ${task.description ? `
                                        <div class="date-task-full-description">
                                            ${task.description}
                                        </div>
                                    ` : ''}
                                    
                                    <div class="date-task-full-footer">
                                        <div>
                                            <span class="date-task-full-status ${task.status}">
                                                ${this.getStatusText(task.status)}
                                            </span>
                                            ${urgencyBadge}
                                            ${task.progress && task.status !== 'completed' ? `
                                                <span style="margin-left: 8px; color: var(--gray-500);">
                                                    ${task.progress}% complete
                                                </span>
                                            ` : ''}
                                        </div>
                                        
                                        <div class="date-task-full-actions">
                                            ${task.status !== 'completed' ? `
                                                <button class="btn btn-sm btn-success complete-modal-task" data-id="${task._id}" title="Mark as Complete">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-outline edit-modal-task" data-id="${task._id}" title="Edit Task">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger delete-modal-task" data-id="${task._id}" title="Delete Task">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Bind events
    const modal = modalContainer.querySelector('.modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modalContainer);
        }
    });
    
    // Bind action buttons
    this.bindModalTaskActions(modalContainer, tasks);
}

bindModalTaskActions(modalContainer, tasks) {
    // Edit buttons
    modalContainer.querySelectorAll('.edit-modal-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.dataset.id;
            document.body.removeChild(modalContainer);
            this.handleEditTask({ currentTarget: { dataset: { id: taskId } } });
        });
    });
    
    // Complete buttons
    modalContainer.querySelectorAll('.complete-modal-task').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskId = e.currentTarget.dataset.id;
            const task = tasks.find(t => t._id === taskId);
            
            if (task) {
                const confirmed = await this.showConfirmation({
                    title: 'Complete Task',
                    subtitle: 'Mark this task as completed?',
                    message: `Are you sure you want to mark "${task.title}" as completed?`,
                    type: 'info',
                    confirmText: 'Complete',
                    confirmClass: 'btn-success'
                });
                
                if (confirmed) {
                    await this.markTaskComplete(taskId);
                    document.body.removeChild(modalContainer);
                }
            }
        });
    });
    
    // Delete buttons
    modalContainer.querySelectorAll('.delete-modal-task').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskId = e.currentTarget.dataset.id;
            const task = tasks.find(t => t._id === taskId);
            
            if (task) {
                const confirmed = await this.showConfirmation({
                    title: 'Delete Task',
                    subtitle: 'Permanently delete this task?',
                    message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
                    type: 'danger',
                    confirmText: 'Delete',
                    confirmClass: 'btn-danger'
                });
                
                if (confirmed) {
                    await this.deleteTask(taskId);
                    document.body.removeChild(modalContainer);
                }
            }
        });
    });
}

// Also update the calendarTasksCount to show total tasks with due dates
updateCalendarTasksCount() {
    const calendarTasksCount = document.getElementById('calendarTasksCount');
    if (calendarTasksCount) {
        const tasksWithDueDate = this.tasks.filter(task => task.dueDate).length;
        calendarTasksCount.textContent = tasksWithDueDate > 0 ? tasksWithDueDate : '';
    }
}

    // renderCalendar() {
    //     const calendarGrid = document.getElementById('calendarGrid');
    //     const calendarMonthYear = document.getElementById('calendarMonthYear');
        
    //     if (!calendarGrid || !calendarMonthYear) return;

    //     const monthNames = [
    //         'January', 'February', 'March', 'April', 'May', 'June',
    //         'July', 'August', 'September', 'October', 'November', 'December'
    //     ];

    //     calendarMonthYear.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

    //     const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    //     const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    //     const today = new Date();
        
    //     const monthTasks = this.tasks.filter(task => {
    //         if (!task.dueDate) return false;
    //         const dueDate = new Date(task.dueDate);
    //         return dueDate.getMonth() === this.currentMonth && 
    //                dueDate.getFullYear() === this.currentYear;
    //     });

    //     const tasksByDate = {};
    //     monthTasks.forEach(task => {
    //         const dueDate = new Date(task.dueDate);
    //         const dateKey = dueDate.getDate();
            
    //         if (!tasksByDate[dateKey]) {
    //             tasksByDate[dateKey] = {
    //                 todo: 0,
    //                 inProgress: 0,
    //                 completed: 0,
    //                 tasks: []
    //             };
    //         }
            
    //         tasksByDate[dateKey][task.status] += 1;
    //         tasksByDate[dateKey].tasks.push(task);
    //     });

    //     let calendarHTML = '';
        
    //     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    //     days.forEach(day => {
    //         calendarHTML += `<div class="calendar-day header">${day}</div>`;
    //     });

    //     for (let i = 0; i < firstDay.getDay(); i++) {
    //         calendarHTML += '<div class="calendar-day empty"></div>';
    //     }

    //     for (let day = 1; day <= lastDay.getDate(); day++) {
    //         const dateKey = day;
    //         const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    //         const dayTasks = tasksByDate[dateKey];
    //         const isToday = today.getDate() === day && 
    //                        today.getMonth() === this.currentMonth && 
    //                        today.getFullYear() === this.currentYear;
            
    //         let dayClass = 'calendar-day';
    //         if (isToday) dayClass += ' active';
            
    //         if (dayTasks) {
    //             dayClass += ' has-tasks';
    //         }
            
    //         let taskDots = '';
    //         if (dayTasks) {
    //             const totalTasks = dayTasks.todo + dayTasks.inProgress + dayTasks.completed;
    //             if (totalTasks > 0) {
    //                 taskDots = `
    //                     <div class="calendar-task-dots">
    //                         ${dayTasks.todo > 0 ? '<div class="calendar-task-dot todo"></div>' : ''}
    //                         ${dayTasks.inProgress > 0 ? '<div class="calendar-task-dot in-progress"></div>' : ''}
    //                         ${dayTasks.completed > 0 ? '<div class="calendar-task-dot completed"></div>' : ''}
    //                     </div>
    //                 `;
    //             }
    //         }
            
    //         calendarHTML += `
    //             <div class="${dayClass}" data-date="${dateStr}" data-tasks="${dayTasks ? dayTasks.tasks.length : 0}">
    //                 ${day}
    //                 ${taskDots}
    //             </div>
    //         `;
    //     }

    //     calendarGrid.innerHTML = calendarHTML;
        
    //     calendarGrid.querySelectorAll('.calendar-day:not(.header):not(.empty)').forEach(day => {
    //         day.addEventListener('click', () => this.handleCalendarDayClick(day));
    //     });
    // }

    prevMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.renderCalendar();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.renderCalendar();
    }

    handleCalendarDayClick(dayElement) {
        const date = dayElement.dataset.date;
        const tasksOnDate = this.tasks.filter(task => 
            task.dueDate && task.dueDate.startsWith(date)
        );
        
        if (tasksOnDate.length > 0) {
            this.showDateTasksModal(date, tasksOnDate);
        } else {
            this.showToast(`No tasks scheduled for ${date}`, 'info');
        }
    }

    showDateTasksModal(date, tasks) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Tasks for ${formattedDate}</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="date-tasks-list">
                            ${tasks.map(task => {
                                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                let daysLeft = null;
                                
                                if (dueDate) {
                                    const dueDateOnly = new Date(dueDate);
                                    dueDateOnly.setHours(0, 0, 0, 0);
                                    daysLeft = Math.ceil((dueDateOnly - today) / (1000 * 60 * 60 * 24));
                                }
                                
                                let urgencyText = '';
                                if (daysLeft < 0) {
                                    urgencyText = '<span style="color: #ef4444; font-weight: 500;">(Overdue)</span>';
                                } else if (daysLeft === 0) {
                                    urgencyText = '<span style="color: #f59e0b; font-weight: 500;">(Due Today)</span>';
                                } else if (daysLeft <= 3) {
                                    urgencyText = `<span style="color: #f59e0b; font-weight: 500;">(Due in ${daysLeft} days)</span>`;
                                }
                                
                                return `
                                    <div class="date-task-item" style="margin-bottom: 15px; padding: 15px; border: 1px solid var(--gray-200); border-radius: var(--radius);">
                                        <div class="date-task-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                            <h4 style="margin: 0;">${task.title}</h4>
                                            <span class="task-status ${task.status}">${this.getStatusText(task.status)}</span>
                                        </div>
                                        <p class="date-task-description" style="margin: 0 0 10px 0; color: var(--gray-600);">${task.description || 'No description'}</p>
                                        <div class="date-task-footer" style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <span style="font-size: 0.9rem;">Priority: ${this.getPriorityText(task.priority)}</span>
                                                ${urgencyText}
                                            </div>
                                            <div style="display: flex; gap: 8px;">
                                                ${task.status !== 'completed' ? `
                                                    <button class="btn btn-sm btn-success complete-date-task" data-id="${task._id}">
                                                        <i class="fas fa-check"></i> Complete
                                                    </button>
                                                ` : ''}
                                                <button class="btn btn-sm btn-outline edit-date-task" data-id="${task._id}">
                                                    <i class="fas fa-edit"></i> Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        const modal = modalContainer.querySelector('.modal');
        const closeBtn = modal.querySelector('.close-modal');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modalContainer);
            }
        });
        
        modal.querySelectorAll('.edit-date-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.id;
                document.body.removeChild(modalContainer);
                this.handleEditTask({ currentTarget: { dataset: { id: taskId } } });
            });
        });
        
        modal.querySelectorAll('.complete-date-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.id;
                const task = tasks.find(t => t._id === taskId);
                
                if (task) {
                    this.showConfirmation({
                        title: 'Complete Task',
                        subtitle: 'Mark this task as completed?',
                        message: `Are you sure you want to mark "${task.title}" as completed?`,
                        type: 'info',
                        confirmText: 'Complete',
                        confirmClass: 'btn-success'
                    }).then(confirmed => {
                        if (confirmed) {
                            this.markTaskComplete(taskId);
                            document.body.removeChild(modalContainer);
                        }
                    });
                }
            });
        });
    }

    showTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitTaskBtn');

        if (task) {
            modalTitle.textContent = 'Edit Task';
            submitBtn.textContent = 'Update Task';
            this.populateTaskForm(task);
            form.dataset.mode = 'edit';
            form.dataset.id = task._id;
        } else {
            modalTitle.textContent = 'Create New Task';
            submitBtn.textContent = 'Create Task';
            form.reset();
            form.dataset.mode = 'create';
            delete form.dataset.id;
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];
            
            const progressSlider = document.getElementById('taskProgress');
            const progressValue = document.getElementById('progressValue');
            if (progressSlider && progressValue) {
                progressSlider.value = 0;
                progressValue.textContent = '0%';
            }
        }

        modal.classList.add('active');
        document.getElementById('taskTitle').focus();
    }

    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskDueDate').value = task.dueDate 
            ? new Date(task.dueDate).toISOString().split('T')[0]
            : '';
        
        const progress = task.progress || 0;
        document.getElementById('taskProgress').value = progress;
        document.getElementById('progressValue').textContent = `${progress}%`;
    }

    async handleTaskSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const mode = form.dataset.mode;
        const taskId = form.dataset.id;

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value || undefined,
            progress: parseInt(document.getElementById('taskProgress').value) || 0
        };

        // Validate required fields
        if (!taskData.title.trim()) {
            this.showToast('Task title is required', 'error');
            return;
        }

        try {
            let url = this.baseURL;
            let method = 'POST';

            if (mode === 'edit') {
                url += `/${taskId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.auth.getAuthToken()}`
                },
                body: JSON.stringify(taskData)
            });

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.showToast(
                    mode === 'edit' ? 'Task updated successfully!' : 'Task created successfully!',
                    'success'
                );
                document.getElementById('taskModal').classList.remove('active');
                form.reset();
                this.loadTasks(this.currentFilter);
            } else {
                this.showToast(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Task submit error:', error);
            
            if (error.message.includes('400')) {
                this.showToast('Invalid task data. Please check your inputs.', 'error');
            } else if (error.message.includes('401')) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    this.auth.logout();
                }, 2000);
            } else {
                this.showToast('Network error. Please try again.', 'error');
            }
        }
    }

    async handleEditTask(e) {
        const taskId = e.currentTarget.dataset.id;
        
        try {
            const response = await fetch(`${this.baseURL}/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${this.auth.getAuthToken()}`
                }
            });

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.showTaskModal(data.data);
            } else {
                this.showToast(data.message || 'Failed to load task', 'error');
            }
        } catch (error) {
            console.error('Edit task error:', error);
            
            if (error.message.includes('404')) {
                this.showToast('Task not found. It may have been deleted.', 'error');
                this.loadTasks(this.currentFilter);
            } else {
                this.showToast('Network error. Please try again.', 'error');
            }
        }
    }

    handleFilter(e) {
        const filter = e.currentTarget.dataset.filter;
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        this.loadTasks(filter === 'all' ? 'all' : filter);
    }

    handleSort(e) {
        const sortBy = e.target.value;
        this.loadTasks(this.currentFilter);
    }

    sortTasks(tasks, sortBy) {
        const tasksCopy = [...tasks];
        
        switch(sortBy) {
            case 'date-desc':
                return tasksCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'date-asc':
                return tasksCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'title':
                return tasksCopy.sort((a, b) => a.title.localeCompare(b.title));
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return tasksCopy.sort((a, b) => 
                    (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
                );
            case 'due-date':
                return tasksCopy.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            default:
                return tasksCopy;
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('searchTasks');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchTasks(e.target.value);
            }, 300);
        });
    }

    searchTasks(query) {
        if (!query.trim()) {
            this.renderTasks(this.tasks);
            return;
        }

        const searchTerm = query.toLowerCase();
        const filtered = this.tasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );

        this.renderTasks(filtered);
    }

    updateUserInfo() {
        const user = this.auth.getUserData();
        if (user) {
            const userNameElement = document.getElementById('userName');
            const userEmailElement = document.getElementById('userEmail');
            
            if (userNameElement) userNameElement.textContent = user.name;
            if (userEmailElement) userEmailElement.textContent = user.email;
        }
    }

    updateUserAvatar() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userAvatar && userName) {
            const name = userName.textContent;
            if (name && name !== 'Loading...') {
                const initials = name.split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                
                userAvatar.textContent = initials;
                
                const colors = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                ];
                
                let hash = 0;
                for (let i = 0; i < name.length; i++) {
                    hash = name.charCodeAt(i) + ((hash << 5) - hash);
                }
                const colorIndex = Math.abs(hash) % colors.length;
                
                userAvatar.style.background = colors[colorIndex];
            }
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        this.showToast(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'info');
    }

    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                ${type === 'success' ? '✓' : 
                  type === 'error' ? '✗' : 
                  type === 'warning' ? '⚠' : 'ℹ'}
            </div>
            <div class="toast-content">
                ${message}
            </div>
            <div class="toast-progress"></div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 4000);
        
        toast.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        });
    }

    showLoading(message = 'Loading...') {
        let loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingOverlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="spinner"></div>
                <p>${message}</p>
            `;
            document.body.appendChild(loadingOverlay);
        } else {
            loadingOverlay.querySelector('p').textContent = message;
        }
        
        loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showConfirmation(options) {
        return new Promise((resolve) => {
            let confirmationModal = document.getElementById('confirmationModal');
            if (!confirmationModal) {
                confirmationModal = document.createElement('div');
                confirmationModal.id = 'confirmationModal';
                confirmationModal.className = 'confirmation-modal';
                confirmationModal.innerHTML = `
                    <div class="confirmation-content">
                        <div class="confirmation-header warning" id="confirmationHeader">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3 id="confirmationTitle">Confirm Action</h3>
                            <p id="confirmationSubtitle">Are you sure you want to proceed?</p>
                        </div>
                        <div class="confirmation-body">
                            <p id="confirmationMessage">This action cannot be undone.</p>
                        </div>
                        <div class="confirmation-footer">
                            <button type="button" class="btn btn-outline" id="cancelConfirmBtn">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmActionBtn">
                                Confirm
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(confirmationModal);
            }

            const title = document.getElementById('confirmationTitle');
            const subtitle = document.getElementById('confirmationSubtitle');
            const message = document.getElementById('confirmationMessage');
            const header = document.getElementById('confirmationHeader');
            const cancelBtn = document.getElementById('cancelConfirmBtn');
            const confirmBtn = document.getElementById('confirmActionBtn');
            
            title.textContent = options.title || 'Confirm Action';
            subtitle.textContent = options.subtitle || 'Are you sure you want to proceed?';
            message.textContent = options.message || 'This action cannot be undone.';
            
            header.className = 'confirmation-header ' + (options.type || 'warning');
            const icon = header.querySelector('i');
            if (icon) {
                switch(options.type) {
                    case 'success':
                        icon.className = 'fas fa-check-circle';
                        break;
                    case 'info':
                        icon.className = 'fas fa-info-circle';
                        break;
                    case 'danger':
                        icon.className = 'fas fa-trash-alt';
                        break;
                    default:
                        icon.className = 'fas fa-exclamation-triangle';
                }
            }
            
            confirmBtn.textContent = options.confirmText || 'Confirm';
            if (options.confirmClass) {
                confirmBtn.className = `btn ${options.confirmClass}`;
            } else {
                confirmBtn.className = options.type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
            }
            
            confirmationModal.classList.add('active');
            
            const handleConfirm = () => {
                confirmationModal.classList.remove('active');
                resolve(true);
                cleanup();
            };
            
            const handleCancel = () => {
                confirmationModal.classList.remove('active');
                resolve(false);
                cleanup();
            };
            
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                confirmationModal.removeEventListener('click', handleOutsideClick);
                document.removeEventListener('keydown', handleEscape);
            };
            
            const handleOutsideClick = (e) => {
                if (e.target === confirmationModal) {
                    handleCancel();
                }
            };
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            confirmationModal.addEventListener('click', handleOutsideClick);
            document.addEventListener('keydown', handleEscape);
        });
    }
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        if (window.auth?.isAuthenticated()) {
            window.taskManager = new TaskManager();
            
            // Load saved theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) {
                    const icon = themeToggle.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-sun';
                    }
                }
            }
        } else {
            window.location.href = 'index.html';
        }
    }
});