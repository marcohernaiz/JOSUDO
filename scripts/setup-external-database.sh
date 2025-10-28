#!/bin/bash
set -e

# Setup External Database Script for JOSUDO
# This script helps you set up JOSUDO with an existing PostgreSQL database

echo "🗄️ Setting up JOSUDO with External PostgreSQL Database..."

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

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your DATABASE_URL environment variable:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    echo ""
    echo "Examples:"
    echo "  AWS RDS: postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/josudo_db"
    echo "  Google Cloud SQL: postgresql://username:password@your-instance-ip:5432/josudo_db"
    echo "  DigitalOcean: postgresql://username:password@your-droplet-ip:5432/josudo_db"
    exit 1
fi

print_status "Using DATABASE_URL: ${DATABASE_URL}"

# Test database connection
print_status "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database. Please check your DATABASE_URL and ensure:"
    echo "  1. Database server is running"
    echo "  2. Network connectivity is available"
    echo "  3. Credentials are correct"
    echo "  4. Database exists"
    exit 1
fi

# Check if database is empty or has existing tables
print_status "Checking existing database schema..."
EXISTING_TABLES=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

if [ "$EXISTING_TABLES" -gt 0 ]; then
    print_warning "Database contains $EXISTING_TABLES existing tables"
    
    # List existing tables
    print_status "Existing tables:"
    psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    
    echo ""
    read -p "Do you want to proceed with schema migration? This may modify existing tables. (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_status "Setup cancelled by user"
        exit 0
    fi
else
    print_status "Database is empty, proceeding with fresh schema"
fi

# Create backup if there are existing tables
if [ "$EXISTING_TABLES" -gt 0 ]; then
    BACKUP_FILE="backup_before_josudo_$(date +%Y%m%d_%H%M%S).sql"
    print_status "Creating backup before migration: $BACKUP_FILE"
    
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "Failed to create backup, continuing anyway..."
    fi
fi

# Apply JOSUDO schema
print_status "Applying JOSUDO database schema..."
if npm run db:push; then
    print_success "Database schema applied successfully"
else
    print_error "Failed to apply database schema"
    exit 1
fi

# Verify schema
print_status "Verifying schema..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
print_success "Schema verification complete. Database now contains $TABLE_COUNT tables"

# List JOSUDO tables
print_status "JOSUDO tables created:"
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

print_success "🎉 External database setup completed successfully!"
print_status "You can now start JOSUDO with:"
echo "  docker-compose -f docker-compose.external-db.yml up -d"
echo ""
print_status "Or with Nginx:"
echo "  docker-compose -f docker-compose.external-db.yml --profile production up -d"







