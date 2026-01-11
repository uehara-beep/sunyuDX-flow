#!/bin/bash

# =============================================================================
# sunyuDX-flow Backup Script
# Automated backup for database and uploads
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/opt/backups/sunyudx"
PROJECT_DIR="/opt/sunyudx-flow"
DB_NAME="sunyutech_dx_prod"
DB_USER="sunyudx_prod"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[BACKUP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Create backup directories
setup_dirs() {
    mkdir -p "$BACKUP_DIR/db"
    mkdir -p "$BACKUP_DIR/uploads"
    mkdir -p "$BACKUP_DIR/config"
}

# Backup database
backup_database() {
    log "Backing up database..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -U "$DB_USER" \
        -h localhost \
        "$DB_NAME" \
        --format=custom \
        --compress=9 \
        > "$BACKUP_DIR/db/db_$DATE.dump"

    log "Database backup completed: db_$DATE.dump"
}

# Backup uploads
backup_uploads() {
    log "Backing up uploads..."
    tar -czf "$BACKUP_DIR/uploads/uploads_$DATE.tar.gz" \
        -C "$PROJECT_DIR" \
        uploads

    log "Uploads backup completed: uploads_$DATE.tar.gz"
}

# Backup configuration
backup_config() {
    log "Backing up configuration..."
    tar -czf "$BACKUP_DIR/config/config_$DATE.tar.gz" \
        -C "$PROJECT_DIR/backend" \
        .env.production 2>/dev/null || true

    # Backup nginx config
    cp /etc/nginx/nginx.conf "$BACKUP_DIR/config/nginx_$DATE.conf" 2>/dev/null || true

    log "Configuration backup completed"
}

# Clean old backups
cleanup_old() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    find "$BACKUP_DIR/db" -name "*.dump" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/uploads" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/config" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/config" -name "*.conf" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    log "Cleanup completed"
}

# Calculate backup size
show_summary() {
    log "Backup Summary:"
    echo "  Database: $(ls -lh $BACKUP_DIR/db/db_$DATE.dump 2>/dev/null | awk '{print $5}' || echo 'N/A')"
    echo "  Uploads:  $(ls -lh $BACKUP_DIR/uploads/uploads_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo 'N/A')"
    echo "  Total:    $(du -sh $BACKUP_DIR 2>/dev/null | cut -f1 || echo 'N/A')"
}

# Main
main() {
    log "=========================================="
    log "sunyuDX-flow Backup Started"
    log "=========================================="

    setup_dirs
    backup_database
    backup_uploads
    backup_config
    cleanup_old
    show_summary

    log "=========================================="
    log "Backup completed successfully!"
    log "=========================================="
}

# Load environment
if [ -f "$PROJECT_DIR/backend/.env.production" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/backend/.env.production" | xargs)
fi

main "$@"
