#!/bin/sh
# wrapped as a script for start-kyrix.sh

cd /kyrix/compiler/examples/dots-deep-uniform
node dots.js | egrep -i "error|connected" || true
