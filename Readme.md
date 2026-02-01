📋 Task Manager - Full Stack Web Application
A professional Task Management Web Application built with Node.js, Express, MongoDB, and modern HTML/CSS/JavaScript. This application demonstrates full-stack development skills with authentication, CRUD operations, and advanced features.

✨ Features
🔐 Authentication
User registration with validation

Secure login with JWT tokens

Protected routes and sessions

Password hashing with bcrypt

📊 Dashboard
Real-time task statistics

Interactive calendar with task indicators

Task filtering by status (All/To Do/In Progress/Completed)

Multiple sorting options

Search functionality

📝 Task Management
Create new tasks with priority levels

Read tasks with beautiful card layout

Update tasks with full editing capabilities

Delete tasks with confirmation

Bulk operations for multiple tasks

Due dates with urgency indicators

Progress tracking for each task

🎨 UI/UX Features
Dark/Light theme toggle

Responsive design for all devices

Toast notifications for user feedback

Confirmation modals with blur effects

Smooth animations and transitions

Glassmorphism effects

Interactive calendar with month navigation

🛠️ Tech Stack
Backend
Node.js - Runtime environment

Express.js - Web framework

MongoDB Atlas - Cloud database

Mongoose - ODM for MongoDB

JWT - JSON Web Tokens for authentication

bcryptjs - Password hashing

express-validator - Input validation

Frontend
HTML5 - Semantic markup

CSS3 - Modern styling with CSS variables

JavaScript (ES6+) - Interactive features

Font Awesome - Icons

Google Fonts - Typography

📁 Project Structure
text
task-management-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Task.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── taskRoutes.js
│   │   ├── utils/
│   │   └── server.js
│   ├── .env
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   ├── auth.js
│   │   │   └── tasks.js
│   │   └── pages/
│   │       ├── index.html       # Login page
│   │       ├── register.html    # Signup page
│   │       └── dashboard.html   # Main dashboard
│   ├── package.json
│   └── .gitignore
└── README.md
🚀 Quick Start Guide
Prerequisites
Node.js (v14 or higher)

MongoDB Atlas account (or local MongoDB)

Modern web browser

Step 1: Clone or Download
bash
git clone https://github.com/yourusername/task-manager.git
cd task-manager
Step 2: Backend Setup
bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
echo "PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development" > .env
Get MongoDB Atlas Connection String:

Go to MongoDB Atlas

Create a free cluster

Click "Connect" on your cluster

Choose "Connect your application"

Copy the connection string

Replace your_mongodb_atlas_connection_string in .env file

Step 3: Frontend Setup
bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
Step 4: Run the Application
Terminal 1 - Start Backend Server:

bash
cd backend
npm run dev
Terminal 2 - Start Frontend Server:

bash
cd frontend
npm start
Step 5: Access the Application
Backend API: http://localhost:5000

Frontend Application: http://localhost:3000

🔧 API Endpoints
Authentication
POST /api/auth/register - Register new user

POST /api/auth/login - User login

GET /api/auth/profile - Get user profile (protected)

Tasks (All protected - require authentication)
GET /api/tasks - Get all tasks for user

GET /api/tasks/:id - Get single task

POST /api/tasks - Create new task

PUT /api/tasks/:id - Update task

DELETE /api/tasks/:id - Delete task

📱 Application Screens
1. Login Page

Email and password authentication

Link to registration page

Password visibility toggle

2. Registration Page
User registration form

Password strength validation

Already have account link

3. Dashboard


Task statistics cards

Interactive calendar

Search and filter bar

Task grid with cards

4. Task Modal

Create/Edit tasks

Priority selection

Due date picker

Progress slider

🎯 Key Features Explained
🔐 Authentication Flow
User registers with email, name, and password

Password is hashed using bcrypt

JWT token is generated and stored

Token is sent with every request for authentication

Protected routes verify token before allowing access

📅 Calendar System
Shows current month with navigation

Displays tasks on due dates with colored dots

Color coding: Red (To Do), Blue (In Progress), Green (Completed)

Click dates to view tasks scheduled for that day

🗂️ Task Organization
Status: To Do, In Progress, Completed

Priority: High, Medium, Low (with color indicators)

Due Dates: Shows "Today", "Tomorrow", "Overdue", or "X days"

Progress: Visual progress bar for each task

⚡ Bulk Operations
Select multiple tasks using checkboxes

Bulk actions bar appears at bottom

Options: Complete Selected, Delete Selected, Clear Selection

Confirmation modal for destructive actions



🧪 Testing the Application
Test Credentials
text
Email: test@example.com
Password: password123
Testing Scenarios
User Registration: Create a new account

Login: Use registered credentials

Create Task: Add a task with different priorities

Edit Task: Modify task details

Complete Task: Mark task as completed

Delete Task: Remove a task

Filter Tasks: Test different status filters

Search: Find tasks by title/description

Bulk Operations: Select and complete/delete multiple tasks

Calendar: Navigate months and view tasks on dates

🔒 Security Features
Password Hashing: bcrypt with salt rounds

JWT Tokens: Stateless authentication

Input Validation: Server-side validation with express-validator

CORS: Configured for specific origins

Environment Variables: Sensitive data stored in .env

Rate Limiting: Implemented on authentication endpoints

XSS Protection: Input sanitization

📈 Performance Optimizations
Lazy Loading: Images and components

Minification: CSS and JavaScript

Caching: Static assets

Debouncing: Search input (300ms delay)

Pagination: Large task lists (future implementation)

Compression: Gzip compression for API responses

🐛 Troubleshooting
Common Issues & Solutions
1. MongoDB Connection Error

text
Error: Could not connect to MongoDB Atlas
Solution:

Check your connection string in .env

Ensure IP is whitelisted in MongoDB Atlas

Verify internet connection

2. JWT Authentication Error

text
Error: Invalid token
Solution:

Clear browser localStorage and login again

Check JWT_SECRET in backend .env file

Ensure token is being sent in Authorization header

3. CORS Errors

text
Access-Control-Allow-Origin error
Solution:

Check backend CORS configuration

Ensure frontend URL is included in allowed origins

Restart both servers

4. Frontend Not Loading

text
Cannot GET /dashboard.html
Solution:

Ensure you're running npm start in frontend directory

Check if live-server is installed

Verify file paths in HTML files

📚 Development Commands
Backend Commands
bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Check for linting issues
npm run lint

# Run tests (if configured)
npm test
Frontend Commands
bash
# Start development server
npm start

# Build for production
npm run build

# Check JavaScript files
npm run lint
🧩 Extending the Application
Adding New Features
1. Task Categories/Tags

javascript
// In Task model
category: {
  type: String,
  enum: ['work', 'personal', 'shopping', 'health'],
  default: 'personal'
}
2. Task Attachments

javascript
// Add file upload support
attachments: [{
  filename: String,
  url: String,
  uploadedAt: Date
}]
3. Task Sharing/Collaboration

javascript
// Add shared users array
sharedWith: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
4. Task Comments/Discussion

javascript
// Add comments array
comments: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: Date
}]
🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Font Awesome for icons

Google Fonts for Inter font

MongoDB Atlas for free database hosting

Express.js team for the awesome framework



