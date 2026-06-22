#!/bin/sh
set -e

cat > /usr/share/nginx/html/env.js << EOF
window.__env__ = {
  API_BASE_URL: '${API_BASE_URL:-}',
  THEME: '${THEME:-}',
  CURRENCY: '${CURRENCY:-}',
};
EOF

exec nginx -g "daemon off;"
