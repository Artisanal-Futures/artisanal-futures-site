#!/bin/bash

# With Cursor AI, I notice that sometimes the variables are not updated / unset. 
# This script is a workaround to ensure that the variables are unset.
# To fix the issue, you would need to uninstall Cursor AI, remove all files associated with it,
# and then re-install it.
# Questions? Just email Andrew. 

# This script needs to be sourced, not executed directly
# Usage: source unset.sh

# Check if the script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error: This script must be sourced, not executed."
    echo "Usage: source unset.sh"
    exit 1
fi

# Unset environment variables
unset MINIO_ENDPOINT
unset NEXTAUTH_SECRET
unset NEXTAUTH_URL

unset DATABASE_URL

unset RESEND_API_KEY
unset NEXT_PUBLIC_PAYMENT_ADMIN_EMAIL
unset NEXT_PUBLIC_ADMIN_EMAIL




unset NEXT_PUBLIC_SITE_NAME
unset NEXT_PUBLIC_STORAGE_URL
unset NEXT_PUBLIC_VOTE_DISABLED
unset NEXT_PUBLIC_NEGATIVE_VOTE_DISABLED
unset NEXT_PUBLIC_HEART_VOTE_DISABLED
unset MINIO_SECRET_KEY
unset NST_URL
unset MINIO_KEY
unset BACKEND_URL
unset GOOGLE_AUTH_CLIENT_ID
unset DISCORD_CLIENT_SECRET
unset NEXT_PUBLIC_NST_URL
unset AUTH0_CLIENT_ID

unset MINIO_ACCESS_KEY
unset REPLICATE_WEBHOOK_SECRET
unset GOOGLE_CLIENT_SECRET
unset REPLICATE_API_TOKEN
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_ENDPOINT
unset GOOGLE_CLIENT_ID
unset GOOGLE_CLIENT_SECRET
unset AWS_BUCKET_NAME






unset NEXT_PUBLIC_STORAGE_URL





unset NEXTAUTH_URL
unset NEXTAUTH_SECRET

unset HOSTNAME

unset GOOGLE_CLIENT_SECRET
unset GOOGLE_CLIENT_ID







unset AUTH0_ISSUER
unset AUTH0_CLIENT_SECRET
unset AUTH0_CLIENT_ID


unset AI_AGENT_BACKEND_URL
# You can add more variables to unset if needed
# unset ANOTHER_VARIABLE
# unset YET_ANOTHER_VARIABLE

echo "Variables have been unset."
