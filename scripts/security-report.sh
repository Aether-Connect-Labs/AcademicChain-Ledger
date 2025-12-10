#!/usr/bin/env bash
set -euo pipefail

mkdir -p security-reports
npm audit --audit-level=high --json > security-reports/security-report-$(date +%Y-%m-%d).json || true
echo "Security report written to security-reports/security-report-$(date +%Y-%m-%d).json"
