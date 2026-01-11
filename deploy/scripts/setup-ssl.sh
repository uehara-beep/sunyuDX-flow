#!/bin/bash

# =============================================================================
# SSL Certificate Setup Script (Let's Encrypt)
# =============================================================================

set -e

# Configuration
DOMAIN_MAIN="sunyutech-dx.com"
DOMAIN_API="api.sunyutech-dx.com"
EMAIL="admin@sunyutech-dx.com"
WEBROOT="/var/www/certbot"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL]${NC} $1"
}

# Install Certbot
install_certbot() {
    log "Installing Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
}

# Create webroot directory
setup_webroot() {
    log "Setting up webroot..."
    mkdir -p "$WEBROOT"
    chown -R www-data:www-data "$WEBROOT"
}

# Get certificates
get_certificates() {
    log "Obtaining SSL certificate for $DOMAIN_MAIN..."
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        -d "$DOMAIN_MAIN" \
        -d "www.$DOMAIN_MAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive

    log "Obtaining SSL certificate for $DOMAIN_API..."
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        -d "$DOMAIN_API" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
}

# Setup auto-renewal
setup_renewal() {
    log "Setting up auto-renewal..."
    systemctl enable certbot.timer
    systemctl start certbot.timer

    # Add renewal hook
    cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
nginx -t && systemctl reload nginx
EOF
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
}

# Verify
verify() {
    log "Verifying certificates..."
    certbot certificates
}

# Main
main() {
    log "=========================================="
    log "SSL Certificate Setup"
    log "=========================================="

    install_certbot
    setup_webroot
    get_certificates
    setup_renewal
    verify

    log "=========================================="
    log "SSL setup completed!"
    log "=========================================="
}

main "$@"
