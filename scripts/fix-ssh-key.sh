#!/bin/bash
# Fix SSH Key Authentication for Deploy User
# Run this script locally to copy your SSH key to the deploy user

set -e

SERVER_IP="216.158.230.187"
DEPLOY_USER="deploy"
DEPLOY_PASSWORD="deploy123"

echo "========================================="
echo "Fixing SSH Key Authentication"
echo "========================================="

# Check if local SSH key exists
if [ ! -f "$HOME/.ssh/id_ed25519.pub" ]; then
    echo "Error: SSH key not found at $HOME/.ssh/id_ed25519.pub"
    echo "Please generate an SSH key first with: ssh-keygen -t ed25519"
    exit 1
fi

echo "Reading local SSH public key..."
SSH_PUB_KEY=$(cat "$HOME/.ssh/id_ed25519.pub")

echo "Connecting to server to setup SSH key for deploy user..."
echo "You will be prompted for the deploy password: deploy123"
echo ""

# Use sshpass if available, otherwise manual
if command -v sshpass &> /dev/null; then
    sshpass -p "$DEPLOY_PASSWORD" ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${SERVER_IP} "
        mkdir -p ~/.ssh
        chmod 700 ~/.ssh
        echo '$SSH_PUB_KEY' >> ~/.ssh/authorized_keys
        chmod 600 ~/.ssh/authorized_keys
        echo 'SSH key added successfully'
    "
else
    # Manual method without sshpass
    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${SERVER_IP} << EOF
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$SSH_PUB_KEY' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo 'SSH key added successfully'
EOF
fi

echo ""
echo "========================================="
echo "✓ SSH key authentication configured!"
echo "========================================="
echo ""
echo "Testing SSH connection..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 ${DEPLOY_USER}@${SERVER_IP} "echo 'SSH key authentication working!'" 2>/dev/null; then
    echo "✓ SSH key authentication test successful!"
else
    echo "⚠ SSH key test failed. You may need to manually add the key."
    echo ""
    echo "Your public key:"
    cat "$HOME/.ssh/id_ed25519.pub"
    echo ""
    echo "Manually add it by running on the server:"
    echo "  mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "  echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
    echo "  chmod 600 ~/.ssh/authorized_keys"
fi
