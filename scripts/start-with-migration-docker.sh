#!/bin/bash
set -e

# Start JOSUDO Application with Database Migration (Docker Database)
# Usage: ./scripts/start-with-migration-docker.sh [docker-compose-file]

echo "🚀 Starting JOSUDO with Database Migration (Docker Database)..."

# Load .env file if it exists
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Default compose file
COMPOSE_FILE=${1:-"docker-compose.app-only.yml"}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your DATABASE_URL environment variable:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    echo ""
    echo "Or create a .env file with DATABASE_URL"
    exit 1
fi

print_status "Using DATABASE_URL: ${DATABASE_URL}"
print_status "Using compose file: $COMPOSE_FILE"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Docker compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Skip direct database connection test since database is in Docker
print_status "Skipping direct database connection test (database is in Docker container)"

# Build the application image first
print_status "Building application image..."
if docker-compose -f "$COMPOSE_FILE" build app; then
    print_success "Application image built successfully"
else
    print_error "Failed to build application image"
    exit 1
fi

# Run migration through Docker container
print_status "Running database migration through Docker container..."
if docker-compose -f "$COMPOSE_FILE" run --rm app npm run db:push; then
    print_success "Database migration completed successfully"
else
    print_error "Database migration failed"
    print_status "This might be because:"
    echo "  1. Database container is not running"
    echo "  2. DATABASE_URL is incorrect"
    echo "  3. Database credentials are wrong"
    echo "  4. Network connectivity issues between containers"
    exit 1
fi

# Start the application
print_status "Starting JOSUDO application..."
if docker-compose -f "$COMPOSE_FILE" up -d app; then
    print_success "Application started successfully"
else
    print_error "Failed to start application"
    exit 1
fi

# Wait for application to start
print_status "Waiting for application to start..."
sleep 15

# Health check
print_status "Performing health check..."
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=10

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if curl -f -s http://localhost:6000/api/health > /dev/null; then
        print_success "Health check passed"
        break
    else
        if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
            print_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
            print_status "Application logs:"
            docker-compose -f "$COMPOSE_FILE" logs app
            exit 1
        else
            print_warning "Health check failed, retrying in ${HEALTH_CHECK_DELAY}s... (attempt $i/$HEALTH_CHECK_RETRIES)"
            sleep $HEALTH_CHECK_DELAY
        fi
    fi
done

print_success "🎉 JOSUDO started successfully!"
print_status "Application URL: http://localhost:6000"
print_status "Health check: http://localhost:6000/api/health"

# Display useful commands
echo ""
print_status "Useful commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f app"
echo "  Stop app: docker-compose -f $COMPOSE_FILE down"
echo "  Restart app: docker-compose -f $COMPOSE_FILE restart app"
echo "  Run migration: docker-compose -f $COMPOSE_FILE run --rm app npm run db:push"
echo "  Connect to database: docker-compose -f $COMPOSE_FILE exec postgres psql -U josudo_user -d josudo_db"






