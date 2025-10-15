#!/bin/sh

CONNECTED_DEVICES=$(
    bluetoothctl devices | \
    awk '{print $2}' | \
    while read -r MAC_ADDRESS; do
        bluetoothctl info "$MAC_ADDRESS" | grep -q "Connected: yes"
        
        if [ $? -eq 0 ]; then
            echo "$MAC_ADDRESS"
        fi
    done
)

if [ -n "$CONNECTED_DEVICES" ]; then
    echo "true"
else
    echo "false"
fi

exit 0