#!/bin/bash
set -e

# Production Database Migration Script for JOSUDO
# Usage: ./scripts/migrate-production.sh [backup_name]

echo "🚀 Starting JOSUDO Production Migration..."

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"migration_backup_$DATE"}
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it from env.production.example"
    exit 1
fi

print_success "Prerequisites check passed"

# Create backup directory
print_status "Creating backup directory..."
mkdir -p $BACKUP_DIR

# Step 1: Create database backup
print_status "Creating database backup..."
if docker-compose exec -T postgres pg_dump -U josudo_user josudo_db > $BACKUP_FILE; then
    print_success "Database backup created: $BACKUP_FILE"
else
    print_error "Failed to create database backup"
    exit 1
fi

# Compress backup to save space
print_status "Compressing backup..."
gzip $BACKUP_FILE
BACKUP_FILE="$BACKUP_FILE.gz"
print_success "Backup compressed: $BACKUP_FILE"

# Step 2: Pull latest changes
print_status "Pulling latest changes from git..."
if git pull origin main; then
    print_success "Git pull completed"
else
    print_warning "Git pull failed or no changes available"
fi

# Step 3: Build new application image
print_status "Building application image..."
if docker-compose build app; then
    print_success "Application image built successfully"
else
    print_error "Failed to build application image"
    print_status "Rolling back to previous version..."
    docker-compose up -d app
    exit 1
fi

# Step 4: Apply database migrations
print_status "Applying database migrations..."
if docker-compose run --rm app npm run db:push; then
    print_success "Database migrations applied successfully"
else
    print_error "Database migration failed"
    print_status "Restoring database from backup..."
    gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U josudo_user -d josudo_db
    print_status "Rolling back to previous version..."
    docker-compose up -d app
    exit 1
fi

# Step 5: Deploy new application
print_status "Deploying new application version..."
if docker-compose up -d app; then
    print_success "Application deployed successfully"
else
    print_error "Failed to deploy application"
    exit 1
fi

# Step 6: Wait for application to start
print_status "Waiting for application to start..."
sleep 15

# Step 7: Health check
print_status "Performing health check..."
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=10

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if curl -f -s http://localhost:5000/api/health > /dev/null; then
        print_success "Health check passed"
        break
    else
        if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
            print_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
            print_status "Starting rollback procedure..."
            
            # Restore database
            print_status "Restoring database from backup..."
            gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U josudo_user -d josudo_db
            
            # Rollback git changes
            print_status "Rolling back git changes..."
            git reset --hard HEAD~1
            
            # Rebuild and restart
            print_status "Rebuilding and restarting previous version..."
            docker-compose build app
            docker-compose up -d app
            
            print_error "Migration failed and rollback completed"
            exit 1
        else
            print_warning "Health check failed, retrying in ${HEALTH_CHECK_DELAY}s... (attempt $i/$HEALTH_CHECK_RETRIES)"
            sleep $HEALTH_CHECK_DELAY
        fi
    fi
done

# Step 8: Cleanup old backups
print_status "Cleaning up old backups..."
find $BACKUP_DIR -name "migration_backup_*.sql.gz" -mtime +7 -delete
print_success "Old backups cleaned up"

# Step 9: Final verification
print_status "Running final verification..."

# Check database schema
print_status "Verifying database schema..."
SCHEMA_CHECK=$(docker-compose exec -T postgres psql -U josudo_user -d josudo_db -c "\dt" 2>/dev/null | grep -c "public")
if [ $SCHEMA_CHECK -gt 0 ]; then
    print_success "Database schema verified"
else
    print_warning "Database schema verification failed"
fi

# Check application logs for errors
print_status "Checking application logs for errors..."
ERROR_COUNT=$(docker-compose logs --since=5m app 2>/dev/null | grep -i error | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    print_success "No errors found in recent application logs"
else
    print_warning "Found $ERROR_COUNT errors in recent application logs"
    print_status "Recent errors:"
    docker-compose logs --since=5m app 2>/dev/null | grep -i error | tail -5
fi

print_success "🎉 Migration completed successfully!"
print_status "Backup file: $BACKUP_FILE"
print_status "Application URL: http://localhost:5000"

# Display useful commands
echo ""
print_status "Useful commands for monitoring:"
echo "  View logs: docker-compose logs -f app"
echo "  Check status: docker-compose ps"
echo "  Database shell: docker-compose exec postgres psql -U josudo_user -d josudo_db"
echo "  Restore backup: gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U josudo_user -d josudo_db"








