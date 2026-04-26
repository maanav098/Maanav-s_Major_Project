#!/usr/bin/env bash
# Install language runtimes into the running Piston container.
# Usage:
#   bash backend/scripts/install-piston-languages.sh
# Requires the piston service to be running (docker compose up -d piston).
# Idempotent — already-installed runtimes return a noop.
set -u

# Pick up override from PISTON_URL env var; default targets the docker compose
# service name when invoked from inside the network, or localhost otherwise.
PISTON_URL="${PISTON_URL:-http://localhost:2000}"

# If the script is run from the host but compose only exposes piston on the
# internal network, fall back to running curl inside the backend container
# (which is on the same docker network and has curl installed).
if ! curl -fsS --max-time 2 "${PISTON_URL}/api/v2/runtimes" >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' | grep -q '^backend$'; then
        echo "Piston not reachable at ${PISTON_URL}; using 'docker exec backend curl' instead."
        EXEC_PREFIX="docker exec backend"
        PISTON_URL="http://piston:2000"
    else
        echo "ERROR: cannot reach Piston at ${PISTON_URL} and no backend container running." >&2
        exit 1
    fi
else
    EXEC_PREFIX=""
fi

# language:version pairs (using Piston's package-index names).
# The execute endpoint accepts aliases ("javascript" -> node, "cpp"/"c++" -> gcc),
# so the frontend can keep sending the friendlier names.
RUNTIMES=(
    "python 3.10.0"
    "node 18.15.0"
    "typescript 5.0.3"
    "java 15.0.2"
    "gcc 10.2.0"
    "go 1.16.2"
)

install_one() {
    local language="$1"
    local version="$2"
    local body
    body=$(printf '{"language":"%s","version":"%s"}' "$language" "$version")
    if [ -n "$EXEC_PREFIX" ]; then
        $EXEC_PREFIX curl -s -X POST -H "Content-Type: application/json" \
            -d "$body" "${PISTON_URL}/api/v2/packages"
    else
        curl -s -X POST -H "Content-Type: application/json" \
            -d "$body" "${PISTON_URL}/api/v2/packages"
    fi
    echo
}

echo "Installing Piston runtimes via ${PISTON_URL}..."
for entry in "${RUNTIMES[@]}"; do
    # shellcheck disable=SC2086
    set -- $entry
    lang="$1"
    ver="$2"
    echo "==> ${lang} ${ver}"
    install_one "$lang" "$ver"
done

echo "Done. Installed runtimes:"
if [ -n "$EXEC_PREFIX" ]; then
    $EXEC_PREFIX curl -s "${PISTON_URL}/api/v2/runtimes"
else
    curl -s "${PISTON_URL}/api/v2/runtimes"
fi
echo
