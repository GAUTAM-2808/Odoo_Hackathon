#!/bin/bash

echo "🚀 Setting up Expense Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
    echo "   For local installation: https://docs.mongodb.com/manual/installation/"
    echo "   For MongoDB Atlas: https://www.mongodb.com/atlas"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads/receipts

# Set up environment files
echo "⚙️  Setting up environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo "✅ Backend .env file created. Please update the MongoDB URI if needed."
else
    echo "✅ Backend .env file already exists."
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    echo "Creating frontend/.env.local file..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
    echo "✅ Frontend .env.local file created."
else
    echo "✅ Frontend .env.local file already exists."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure MongoDB is running (local or Atlas)"
echo "2. Update backend/.env with your MongoDB connection string if needed"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo "4. Visit http://localhost:3000 to access the application"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev          - Start both frontend and backend"
echo "  npm run dev:backend  - Start backend only (port 5000)"
echo "  npm run dev:frontend - Start frontend only (port 3000)"
echo "  npm run build        - Build for production"
echo "  npm start           - Start production server"
echo ""
echo "📚 For more information, see README.md"