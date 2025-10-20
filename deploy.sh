#!/bin/bash

# Janta Darbar Platform Deployment Script
# This script helps deploy the platform to production

set -e

echo "🚀 Starting Janta Darbar Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) not found. Make sure PostgreSQL is installed."
    fi
    
    print_success "Dependencies check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm run install-all
    print_success "Dependencies installed successfully"
}

# Set up environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f "server/.env" ]; then
        if [ -f "server/env.example" ]; then
            cp server/env.example server/.env
            print_warning "Created server/.env from example. Please update with your configuration."
        else
            print_error "No environment example file found. Please create server/.env manually."
            exit 1
        fi
    fi
    
    if [ ! -f "client/.env" ]; then
        if [ -f "client/env.example" ]; then
            cp client/env.example client/.env
            print_warning "Created client/.env from example. Please update with your configuration."
        else
            print_error "No environment example file found. Please create client/.env manually."
            exit 1
        fi
    fi
    
    print_success "Environment files set up"
}

# Set up database
setup_database() {
    print_status "Setting up database..."
    
    # Check if database exists
    if command -v psql &> /dev/null; then
        if psql -lqt | cut -d \| -f 1 | grep -qw janta_darbar; then
            print_warning "Database 'janta_darbar' already exists"
        else
            print_status "Creating database 'janta_darbar'..."
            createdb janta_darbar
            print_success "Database created successfully"
        fi
        
        # Run migrations
        print_status "Running database migrations..."
        cd server && npm run migrate && cd ..
        print_success "Database migrations completed"
    else
        print_warning "PostgreSQL client not found. Please set up the database manually:"
        print_warning "1. Create database: createdb janta_darbar"
        print_warning "2. Run migrations: cd server && npm run migrate"
    fi
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd client && npm run build && cd ..
    print_success "Frontend built successfully"
}

# Start production server
start_production() {
    print_status "Starting production server..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Start server
    cd server && npm start &
    SERVER_PID=$!
    
    print_success "Production server started with PID: $SERVER_PID"
    print_status "Server should be running on http://localhost:5000"
    print_status "Frontend build is available in client/build/"
}

# Development setup
setup_development() {
    print_status "Setting up development environment..."
    
    # Start development servers
    print_status "Starting development servers..."
    npm run dev &
    DEV_PID=$!
    
    print_success "Development servers started with PID: $DEV_PID"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
}

# Main deployment function
deploy() {
    local mode=${1:-development}
    
    print_status "Starting deployment in $mode mode..."
    
    check_dependencies
    install_dependencies
    setup_environment
    
    if [ "$mode" = "production" ]; then
        setup_database
        build_frontend
        start_production
    else
        setup_development
    fi
    
    print_success "Deployment completed successfully!"
    
    if [ "$mode" = "production" ]; then
        echo ""
        print_status "Production deployment complete!"
        print_status "Make sure to:"
        print_status "1. Update environment variables in server/.env"
        print_status "2. Set up SSL certificates"
        print_status "3. Configure reverse proxy (nginx/apache)"
        print_status "4. Set up monitoring and logging"
    else
        echo ""
        print_status "Development environment ready!"
        print_status "Open http://localhost:3000 in your browser"
    fi
}

# Help function
show_help() {
    echo "Janta Darbar Platform Deployment Script"
    echo ""
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  development  Set up development environment (default)"
    echo "  production   Deploy to production"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Development setup"
    echo "  $0 development        # Development setup"
    echo "  $0 production         # Production deployment"
    echo ""
}

# Main script logic
case "${1:-development}" in
    "development"|"dev")
        deploy "development"
        ;;
    "production"|"prod")
        deploy "production"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown mode: $1"
        show_help
        exit 1
        ;;
esac
