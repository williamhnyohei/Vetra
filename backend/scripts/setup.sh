#!/bin/bash

# Vetra Backend Setup Script
echo "🚀 Setting up Vetra Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Docker is available. You can use docker-compose to start services."
    echo "   Run: docker-compose up -d"
else
    echo "⚠️  Docker not found. Please install Docker or set up PostgreSQL and Redis manually."
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start database services (PostgreSQL + Redis)"
echo "3. Run migrations: npm run db:migrate"
echo "4. Start the server: npm run dev"
echo ""
echo "For Docker setup:"
echo "1. docker-compose up -d"
echo "2. npm run db:migrate"
echo "3. npm run dev"
