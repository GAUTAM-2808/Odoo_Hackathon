# Expense Management System

A comprehensive expense management system with approval workflows, built with Next.js, Node.js, Express, and MongoDB.

## Features

### 🔐 Authentication & User Management
- Company registration with country-based currency selection
- JWT-based authentication
- Role-based access control (Admin, Manager, Employee)
- User management and role assignment

### 💼 Employee Features
- Submit expenses with multiple currency support
- Receipt upload with file validation
- View expense history and status
- Real-time currency conversion

### 📊 Manager Features
- Review and approve/reject expenses
- Multi-level approval workflows
- View pending, approved, and rejected expenses
- Approval comments and tracking

### 🛠️ Admin Features
- Complete user management
- Company settings and configuration
- Approval rule management (percentage, specific approver, hybrid)
- Expense oversight and override capabilities

### ⚡ Integrations
- Currency conversion API integration
- File upload handling
- Real-time notifications

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **Bcryptjs** - Password hashing

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Backend (`.env` file in `/backend` directory):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/expense_management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

   Frontend (`.env.local` file in `/frontend` directory):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend on port 5000
   npm run dev:frontend # Frontend on port 3000
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Usage

### First Time Setup

1. **Register a Company**
   - Visit http://localhost:3000/register
   - Fill in company and admin user details
   - Select country (currency auto-selected)
   - Admin account is automatically created

2. **Login**
   - Use the admin credentials to login
   - Access admin dashboard

3. **Add Users**
   - Navigate to "Users" section
   - Add employees and managers
   - Assign roles and manager relationships

4. **Configure Approval Rules**
   - Go to "Company Settings"
   - Set up approval workflows
   - Define approval rules (percentage, specific approver, hybrid)

### User Roles

#### Admin
- Complete system access
- User management
- Company settings
- Approval rule configuration
- Expense oversight

#### Manager
- Review pending expenses
- Approve/reject expenses
- View approval history
- Manage team expenses

#### Employee
- Submit expenses
- Upload receipts
- View personal expense history
- Track approval status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register company and admin
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Expenses
- `POST /api/expenses` - Submit expense
- `GET /api/expenses` - Get user expenses
- `GET /api/expenses/pending-approval` - Get pending approvals
- `PUT /api/expenses/:id/approve` - Approve expense
- `PUT /api/expenses/:id/reject` - Reject expense

### Company
- `GET /api/company` - Get company details
- `PUT /api/company` - Update company
- `POST /api/company/approval-rules` - Add approval rule
- `GET /api/company/countries` - Get countries with currencies

## Database Schema

### User
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin|manager|employee),
  company: ObjectId,
  manager: ObjectId,
  isActive: Boolean
}
```

### Company
```javascript
{
  name: String,
  country: String,
  currency: String,
  admin: ObjectId,
  settings: {
    approvalRules: Array,
    defaultApprovalFlow: Array
  }
}
```

### Expense
```javascript
{
  employee: ObjectId,
  company: ObjectId,
  amount: Number,
  originalCurrency: String,
  convertedAmount: Number,
  companyCurrency: String,
  exchangeRate: Number,
  category: String,
  description: String,
  expenseDate: Date,
  receipt: Object,
  status: String (pending|approved|rejected),
  approvalFlow: Array,
  currentApprovalLevel: Number
}
```

## Development

### Project Structure
```
expense-management-system/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # External services
│   └── server.js        # Main server file
├── frontend/
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── lib/             # Utility functions
│   └── public/          # Static assets
└── package.json         # Root package.json
```

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.