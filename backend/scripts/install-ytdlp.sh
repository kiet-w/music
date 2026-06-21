#!/bin/bash
set -e

VERSION="2024.12.23"
URL="https://github.com/yt-dlp/yt-dlp/releases/download/${VERSION}/yt-dlp"
EXPECTED_HASH="eb5fef5807129b445d20a557cf57b5a9eaafb84d9f575bfcd51c5598cd70a133"
OUTPUT_FILE="yt-dlp"

echo "Downloading yt-dlp version ${VERSION}..."
wget -q "${URL}" -O "${OUTPUT_FILE}"

echo "Verifying SHA-256 checksum..."
ACTUAL_HASH=$(sha256sum "${OUTPUT_FILE}" | awk '{print $1}')

if [ "${ACTUAL_HASH}" != "${EXPECTED_HASH}" ]; then
  echo "ERROR: SHA-256 checksum verification failed!"
  echo "Expected: ${EXPECTED_HASH}"
  echo "Actual:   ${ACTUAL_HASH}"
  rm -f "${OUTPUT_FILE}"
  exit 1
fi

echo "Checksum verified successfully!"
chmod a+rx "${OUTPUT_FILE}"
echo "yt-dlp installation complete."
