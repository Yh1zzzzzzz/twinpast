#!/bin/bash
set -eu
project_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
/usr/bin/open "$project_dir/dist/index.html"
