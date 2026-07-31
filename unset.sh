#!/bin/bash

# With Cursor AI, I notice that sometimes the variables are not updated / unset.
# This script is a workaround to ensure that the variables are unset.
# To fix the issue, you would need to uninstall Cursor AI, remove all files associated with it,
# and then re-install it.
# Questions? Just email Andrew.

# This script needs to be sourced, not executed directly
# Usage: source unset.sh

# Keep this list in sync with /src/env.js and .env.example.

# Check if the script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error: This script must be sourced, not executed."
    echo "Usage: source unset.sh"
    exit 1
fi

# Database
unset DATABASE_URL
unset PROD_DATABASE_URL

# AI agent
unset AI_AGENT_BACKEND_URL

# Auth
unset BETTER_AUTH_SECRET
unset BETTER_AUTH_URL
unset BETTER_AUTH_DISCORD_ID
unset BETTER_AUTH_DISCORD_SECRET
unset GOOGLE_CLIENT_ID
unset GOOGLE_CLIENT_SECRET
unset AUTH0_CLIENT_ID
unset AUTH0_CLIENT_SECRET
unset AUTH0_ISSUER
unset HOSTNAME

# Email
unset RESEND_API_KEY
unset NEXT_PUBLIC_EMAIL_FROM_NOREPLY
unset NEXT_PUBLIC_EMAIL_FROM_SUPPORT

# Website provisioning
unset COOLIFY_API
unset COOLIFY_ADMIN_SAFE_API_TOKEN
unset COOLIFY_UUID
unset WORDPRESS_DOCKER_REGISTRY

# SimplePress integration
unset SIMPLEPRESS_API_URL
unset SIMPLEPRESS_API_TOKEN
unset SIMPLEPRESS_CALLBACK_TOKEN
unset SIMPLEPRESS_WELCOME_GUIDE_URL
unset AF_SP_WEBHOOK_SECRET
unset SIMPLEPRESS_HASH_SECRET

# Stripe
unset STRIPE_SECRET_KEY

# HCaptcha
unset HCAPTCHA_SECRET_KEY
unset NEXT_PUBLIC_HCAPTCHA_SITE_KEY

# Storage
unset NEXT_PUBLIC_STORAGE_URL
unset NEXT_PUBLIC_STORAGE_BUCKET_NAME
unset MINIO_ACCESS_KEY
unset MINIO_SECRET_KEY
unset MINIO_ENDPOINT

# Voting
unset NEXT_PUBLIC_VOTE_DISABLED
unset NEXT_PUBLIC_HEART_VOTE_DISABLED

# Help docs
unset NEXT_PUBLIC_HELP_DOCS_URL

# You can add more variables to unset if needed
# unset ANOTHER_VARIABLE

echo "Variables have been unset."
