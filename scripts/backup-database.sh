#!/bin/bash
set -e

# Database Backup Script for JOSUDO
# Usage: ./scripts/backup-database.sh [backup_name]

echo "💾 Starting JOSUDO Database Backup..."

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"manual_backup_$DATE"}
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

# Function to get file size in human readable format
get_file_size() {
    if [ -f "$1" ]; then
        du -h "$1" | cut -f1
    else
        echo "0B"
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
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

# Check if database is running
print_status "Checking database connection..."
if ! docker-compose exec -T postgres pg_isready -U josudo_user -d josudo_db >/dev/null 2>&1; then
    print_error "Database is not running or not accessible"
    print_status "Starting database..."
    docker-compose up -d postgres
    sleep 10
    
    if ! docker-compose exec -T postgres pg_isready -U josudo_user -d josudo_db >/dev/null 2>&1; then
        print_error "Failed to start database"
        exit 1
    fi
fi

print_success "Database connection verified"

# Get database info
print_status "Getting database information..."
DB_SIZE=$(docker-compose exec -T postgres psql -U josudo_user -d josudo_db -c "SELECT pg_size_pretty(pg_database_size('josudo_db'));" -t 2>/dev/null | xargs)
TABLE_COUNT=$(docker-compose exec -T postgres psql -U josudo_user -d josudo_db -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" -t 2>/dev/null | xargs)

print_status "Database size: $DB_SIZE"
print_status "Table count: $TABLE_COUNT"

# Create backup
print_status "Creating database backup..."
print_status "Backup file: $BACKUP_FILE"

if docker-compose exec -T postgres pg_dump -U josudo_user josudo_db > $BACKUP_FILE; then
    BACKUP_SIZE=$(get_file_size $BACKUP_FILE)
    print_success "Database backup created successfully"
    print_status "Backup size: $BACKUP_SIZE"
else
    print_error "Failed to create database backup"
    exit 1
fi

# Compress backup
print_status "Compressing backup..."
if gzip $BACKUP_FILE; then
    BACKUP_FILE="$BACKUP_FILE.gz"
    COMPRESSED_SIZE=$(get_file_size $BACKUP_FILE)
    COMPRESSION_RATIO=$(echo "scale=1; (1 - $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE") / $(stat -f%z "${BACKUP_FILE%.gz}" 2>/dev/null || stat -c%s "${BACKUP_FILE%.gz}")) * 100" | bc 2>/dev/null || echo "N/A")
    
    print_success "Backup compressed successfully"
    print_status "Compressed size: $COMPRESSED_SIZE"
    if [ "$COMPRESSION_RATIO" != "N/A" ]; then
        print_status "Compression ratio: ${COMPRESSION_RATIO}%"
    fi
    
    # Remove uncompressed file
    rm "${BACKUP_FILE%.gz}"
else
    print_warning "Failed to compress backup, keeping uncompressed version"
fi

# Verify backup integrity
print_status "Verifying backup integrity..."
if [[ $BACKUP_FILE == *.gz ]]; then
    if gunzip -t $BACKUP_FILE; then
        print_success "Backup integrity verified (compressed)"
    else
        print_error "Backup integrity check failed"
        exit 1
    fi
else
    # Basic check for SQL backup
    if grep -q "PostgreSQL database dump" $BACKUP_FILE; then
        print_success "Backup integrity verified (SQL)"
    else
        print_warning "Backup integrity check inconclusive"
    fi
fi

# Clean up old backups (keep last 30 days)
print_status "Cleaning up old backups..."
OLD_BACKUPS=$(find $BACKUP_DIR -name "*.sql.gz" -mtime +30 | wc -l)
if [ $OLD_BACKUPS -gt 0 ]; then
    find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
    print_success "Cleaned up $OLD_BACKUPS old backup files"
else
    print_status "No old backups to clean up"
fi

# Display backup summary
echo ""
print_success "🎉 Database backup completed successfully!"
print_status "Backup file: $BACKUP_FILE"
print_status "Backup size: $COMPRESSED_SIZE"
print_status "Database size: $DB_SIZE"
print_status "Table count: $TABLE_COUNT"
print_status "Backup directory: $BACKUP_DIR"

# Display useful commands
echo ""
print_status "Useful commands:"
echo "  List backups: ls -la $BACKUP_DIR/"
echo "  Restore backup: ./scripts/rollback.sh $BACKUP_FILE"
echo "  Test restore: gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U josudo_user -d josudo_db"

# Optional: Upload to cloud storage
if [ -n "$AWS_S3_BUCKET" ]; then
    print_status "Uploading to S3..."
    if command -v aws >/dev/null 2>&1; then
        if aws s3 cp $BACKUP_FILE s3://$AWS_S3_BUCKET/; then
            print_success "Backup uploaded to S3"
        else
            print_warning "Failed to upload to S3"
        fi
    else
        print_warning "AWS CLI not found, skipping S3 upload"
    fi
fi

# Optional: Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    MESSAGE="✅ JOSUDO database backup completed successfully!\n📁 File: $BACKUP_FILE\n📊 Size: $COMPRESSED_SIZE\n🗄️ DB Size: $DB_SIZE\n📋 Tables: $TABLE_COUNT"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        $SLACK_WEBHOOK_URL >/dev/null 2>&1 && print_success "Notification sent to Slack" || print_warning "Failed to send Slack notification"
fi








