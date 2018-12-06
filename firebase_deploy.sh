#!/usr/bin/env bash

npm run build;

echo "Deploying signal-odin"
firebase use signal-odin-messenger;
firebase deploy;
