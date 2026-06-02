#!/bin/bash

ACTIVITY_FILE="/tmp/anthony-last-activity"

date +%s > "$ACTIVITY_FILE"

sudo libinput debug-events --show-keycodes | while read -r line; do
  if echo "$line" | grep -E "POINTER_MOTION|POINTER_BUTTON|KEYBOARD_KEY|POINTER_SCROLL" > /dev/null; then
    date +%s > "$ACTIVITY_FILE"
  fi
done
