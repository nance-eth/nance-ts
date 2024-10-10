#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

API_URL=$(cat "$SCRIPT_DIR/API_URL")
DISCORD_WEBHOOK=$(cat "$SCRIPT_DIR/DISCORD_WEBHOOK")

ERROR_FLAG_FILE="$SCRIPT_DIR/api_error_flag"
ERROR_START_TIME_FILE="$SCRIPT_DIR/api_error_start_time"

send_discord_message() {
    payload="$1"
    curl -H "Content-Type: application/json" -X POST -d "$payload" $DISCORD_WEBHOOK
}

check_and_send_recovery_message() {
    if [ -f "$ERROR_FLAG_FILE" ]; then
        start_time=$(cat "$ERROR_START_TIME_FILE")
        current_time=$(date +%s)
        duration=$((current_time - start_time))

        payload=$(jq -n \
          --arg content "✅" \
          --arg title "API Recovered <t:$current_time:F>" \
          --arg description "The API has recovered after $duration seconds." \
          '{
            "content": $content,
            "embeds": [
              {
                "title": $title,
                "description": $description,
                "color": 3066993
              }
            ]
          }')
        send_discord_message "$payload"
        rm "$ERROR_FLAG_FILE" "$ERROR_START_TIME_FILE"
    fi
}

response=$(curl -s -w "\n%{http_code}" $API_URL)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" != "200" ] || echo "$body" | jq -e '.success == false' >/dev/null; then
    if [ ! -f "$ERROR_FLAG_FILE" ]; then
        touch "$ERROR_FLAG_FILE"
        date +%s > "$ERROR_START_TIME_FILE"
        error_description="HTTP Status Code: $http_code\n\nResponse Body:\n$body"
        payload=$(jq -n \
          --arg content "🚨" \
          --arg title "API Error received at <t:$(date +%s):F>" \
          --arg description "$error_description" \
          '{
            "content": $content,
            "embeds": [
              {
                "title": $title,
                "description": "```json\n\($description)\n```",
                "color": 15158332
              }
            ]
          }')
        send_discord_message "$payload"
    fi
else
    check_and_send_recovery_message
fi
