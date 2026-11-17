
#!/bin/bash
set -euxo pipefail

# Update system packages
dnf update -y

# Install Docker and Git
dnf install -y docker git curl

# Start Docker automatically
systemctl enable --now docker

# Allow ec2-user to work with Docker
usermod -aG docker ec2-user

# Install Docker Compose plugin
COMPOSE_VERSION="v2.39.4"

mkdir -p /usr/local/lib/docker/cli-plugins

curl -fsSL \
  "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose

chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Verify installation
docker --version
docker compose version


# Download Ticket Booking from GitHub
echo "Cloning Ticket Booking repository..."

git clone \
  --branch feature/lab5-testing-iac \
  --single-branch \
  https://github.com/ArgonII/ticket-booking-app.git \
  /opt/ticket-booking-app

# Navigate to application directory
cd /opt/ticket-booking-app

# Configure ports
export FRONTEND_HOST_PORT=80
export BACKEND_HOST_PORT=3001

# Build and start application
echo "Starting Ticket Booking..."

docker compose up -d --build

# Show running containers
docker compose ps

echo "Ticket Booking deployment completed!"
