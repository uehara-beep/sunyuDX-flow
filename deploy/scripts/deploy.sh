#!/bin/bash

# =============================================================================
# sunyuDX-flow Deploy Script
# Production deployment automation
# =============================================================================

set -e

# Configuration
PROJECT_DIR="/opt/sunyudx-flow"
BACKUP_DIR="/opt/backups"
GIT_BRANCH="main"
DEPLOY_USER="sunyudx"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Backup
create_backup() {
    log_info "Creating backup..."
    BACKUP_PATH="${BACKUP_DIR}/sunyudx-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_PATH"

    # Backup code
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$BACKUP_PATH/code"
    fi

    # Backup database
    if command -v pg_dump &> /dev/null; then
        pg_dump -U sunyudx_prod sunyutech_dx_prod | gzip > "$BACKUP_PATH/db.sql.gz"
    fi

    log_info "Backup created: $BACKUP_PATH"
    echo "$BACKUP_PATH"
}

# Pull latest code
pull_code() {
    log_info "Pulling latest code from $GIT_BRANCH..."
    cd "$PROJECT_DIR"
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
    log_info "Code updated successfully"
}

# Install dependencies
install_dependencies() {
    log_info "Installing backend dependencies..."
    cd "$PROJECT_DIR/backend"

    # Activate virtual environment
    source venv/bin/activate

    # Install Python dependencies
    pip install -r requirements.txt --quiet

    log_info "Dependencies installed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    cd "$PROJECT_DIR/backend"
    source venv/bin/activate

    # Run Alembic migrations (if using Alembic)
    # alembic upgrade head

    log_info "Migrations completed"
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend..."
    cd "$PROJECT_DIR/frontend"

    # Copy static files
    cp -r public/* /var/www/sunyudx-flow/

    # Set permissions
    chown -R www-data:www-data /var/www/sunyudx-flow/
    chmod -R 755 /var/www/sunyudx-flow/

    log_info "Frontend deployed"
}

# Restart services
restart_services() {
    log_info "Restarting services..."

    # Restart backend with systemd
    systemctl restart sunyudx-api

    # Reload Nginx
    nginx -t && systemctl reload nginx

    log_info "Services restarted"
}

# Health check
health_check() {
    log_info "Running health check..."
    sleep 5

    # Check API health
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

    if [ "$HEALTH" = "200" ]; then
        log_info "Health check passed!"
        return 0
    else
        log_error "Health check failed! HTTP status: $HEALTH"
        return 1
    fi
}

# Rollback
rollback() {
    local BACKUP_PATH=$1
    log_warn "Rolling back to $BACKUP_PATH..."

    # Restore code
    rm -rf "$PROJECT_DIR"
    cp -r "$BACKUP_PATH/code" "$PROJECT_DIR"

    # Restore database
    if [ -f "$BACKUP_PATH/db.sql.gz" ]; then
        gunzip -c "$BACKUP_PATH/db.sql.gz" | psql -U sunyudx_prod sunyutech_dx_prod
    fi

    # Restart services
    restart_services

    log_info "Rollback completed"
}

# Main deployment process
main() {
    log_info "=========================================="
    log_info "sunyuDX-flow Deployment Started"
    log_info "=========================================="

    # Create backup
    BACKUP_PATH=$(create_backup)

    # Deploy
    pull_code
    install_dependencies
    run_migrations
    deploy_frontend
    restart_services

    # Health check
    if health_check; then
        log_info "=========================================="
        log_info "Deployment completed successfully!"
        log_info "=========================================="
    else
        log_error "Deployment failed, rolling back..."
        rollback "$BACKUP_PATH"
        exit 1
    fi
}

# Run main function
main "$@"
