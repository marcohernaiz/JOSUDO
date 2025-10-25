#!/bin/bash
set -e

# Database Rollback Script for JOSUDO
# Usage: ./scripts/rollback.sh [backup_file]

echo "🔄 Starting JOSUDO Database Rollback..."

# Configuration
BACKUP_DIR="/backups"

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

# Function to list available backups
list_backups() {
    print_status "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la $BACKUP_DIR/*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}' || print_warning "No backups found in $BACKUP_DIR"
    else
        print_warning "Backup directory $BACKUP_DIR does not exist"
    fi
}

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "No backup file specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    list_backups
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    echo ""
    list_backups
    exit 1
fi

print_status "Using backup file: $BACKUP_FILE"

# Confirmation prompt
echo ""
print_warning "This will restore the database from backup and may cause data loss!"
print_status "Current database will be replaced with the backup data."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_status "Rollback cancelled by user"
    exit 0
fi

# Step 1: Stop application
print_status "Stopping application..."
if docker-compose stop app; then
    print_success "Application stopped"
else
    print_warning "Failed to stop application or application was not running"
fi

# Step 2: Create current state backup (just in case)
CURRENT_BACKUP="$BACKUP_DIR/rollback_safety_backup_$(date +%Y%m%d_%H%M%S).sql"
print_status "Creating safety backup of current state..."
if docker-compose exec -T postgres pg_dump -U josudo_user josudo_db > $CURRENT_BACKUP; then
    gzip $CURRENT_BACKUP
    print_success "Safety backup created: $CURRENT_BACKUP.gz"
else
    print_warning "Failed to create safety backup"
fi

# Step 3: Drop and recreate database
print_status "Preparing database for restoration..."
docker-compose exec postgres psql -U josudo_user -d postgres -c "DROP DATABASE IF EXISTS josudo_db;"
docker-compose exec postgres psql -U josudo_user -d postgres -c "CREATE DATABASE josudo_db;"
print_success "Database recreated"

# Step 4: Restore from backup
print_status "Restoring database from backup..."
if [[ $BACKUP_FILE == *.gz ]]; then
    if gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U josudo_user -d josudo_db; then
        print_success "Database restored from compressed backup"
    else
        print_error "Failed to restore from compressed backup"
        exit 1
    fi
else
    if docker-compose exec -T postgres psql -U josudo_user -d josudo_db < $BACKUP_FILE; then
        print_success "Database restored from backup"
    else
        print_error "Failed to restore from backup"
        exit 1
    fi
fi

# Step 5: Start application
print_status "Starting application..."
if docker-compose up -d app; then
    print_success "Application started"
else
    print_error "Failed to start application"
    exit 1
fi

# Step 6: Wait for application to start
print_status "Waiting for application to start..."
sleep 15

# Step 7: Verify restoration
print_status "Verifying database restoration..."

# Check if tables exist
TABLE_COUNT=$(docker-compose exec -T postgres psql -U josudo_user -d josudo_db -c "\dt" 2>/dev/null | grep -c "public" || echo "0")
if [ $TABLE_COUNT -gt 0 ]; then
    print_success "Database tables verified ($TABLE_COUNT tables found)"
else
    print_error "Database restoration verification failed - no tables found"
    exit 1
fi

# Health check
print_status "Performing application health check..."
if curl -f -s http://localhost:5000/api/health > /dev/null; then
    print_success "Application health check passed"
else
    print_warning "Application health check failed - application may not be fully ready yet"
fi

# Step 8: Display restoration summary
echo ""
print_success "🎉 Database rollback completed successfully!"
print_status "Restored from: $BACKUP_FILE"
print_status "Safety backup: $CURRENT_BACKUP.gz"
print_status "Application URL: http://localhost:5000"

# Display useful commands
echo ""
print_status "Useful commands for verification:"
echo "  View logs: docker-compose logs -f app"
echo "  Check status: docker-compose ps"
echo "  Database shell: docker-compose exec postgres psql -U josudo_user -d josudo_db"
echo "  List tables: docker-compose exec postgres psql -U josudo_user -d josudo_db -c '\dt'"






