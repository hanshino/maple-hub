#!/bin/bash
#
# refresh-all.sh — 每日定時呼叫 refresh-all API，自動分批處理所有 OCID
#
# 用法:
#   CRON_SECRET=your_secret ./scripts/refresh-all.sh
#
# Crontab 範例 (每天凌晨 3 點執行):
#   0 3 * * * CRON_SECRET=your_secret /path/to/refresh-all.sh >> /var/log/refresh-all.log 2>&1

set -euo pipefail

BASE_URL="${BASE_URL:-https://maple-hub.hanshino.dev}"
BATCH_SIZE="${BATCH_SIZE:-50}"
WAIT_SECONDS="${WAIT_SECONDS:-65}"

# 驗證必要環境變數
if [ -z "${CRON_SECRET:-}" ]; then
  echo "[ERROR] CRON_SECRET 環境變數未設定"
  exit 1
fi

ENDPOINT="${BASE_URL}/api/cron/refresh-all"
OFFSET=0
ROUND=1
TOTAL_PROCESSED=0
TOTAL_REMOVED=0

echo "=========================================="
echo "[$(date -Iseconds)] refresh-all 開始"
echo "  URL: ${ENDPOINT}"
echo "  batchSize: ${BATCH_SIZE}"
echo "  等待間隔: ${WAIT_SECONDS}s"
echo "=========================================="

while true; do
  echo ""
  echo "[Round ${ROUND}] offset=${OFFSET}, batchSize=${BATCH_SIZE}"

  HTTP_CODE=$(curl -s -o /tmp/refresh-all-response.json -w '%{http_code}' \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    "${ENDPOINT}?offset=${OFFSET}&batchSize=${BATCH_SIZE}")

  RESPONSE=$(cat /tmp/refresh-all-response.json 2>/dev/null || echo "")

  if [ "${HTTP_CODE}" != "200" ]; then
    echo "[ERROR] HTTP ${HTTP_CODE}"
    echo "${RESPONSE}"
    exit 1
  fi

  # 解析 JSON 回應
  SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
  PROCESSED=$(echo "${RESPONSE}" | jq -r '.processed')
  REMOVED=$(echo "${RESPONSE}" | jq -r '.removed // 0')
  NEXT_OFFSET=$(echo "${RESPONSE}" | jq -r '.nextOffset')
  TOTAL_COUNT=$(echo "${RESPONSE}" | jq -r '.totalCount')
  HAS_MORE=$(echo "${RESPONSE}" | jq -r '.hasMore')
  EXEC_TIME=$(echo "${RESPONSE}" | jq -r '.executionTimeMs')
  STOPPED=$(echo "${RESPONSE}" | jq -r '.stoppedReason // "completed"')
  STATS=$(echo "${RESPONSE}" | jq -c '.stats')

  echo "  success=${SUCCESS}, processed=${PROCESSED}, removed=${REMOVED}"
  echo "  stats=${STATS}"
  echo "  executionTime=${EXEC_TIME}ms, stoppedReason=${STOPPED}"
  echo "  nextOffset=${NEXT_OFFSET}, totalCount=${TOTAL_COUNT}"

  if [ "${SUCCESS}" != "true" ]; then
    echo "[ERROR] API 回傳失敗"
    echo "${RESPONSE}" | jq .
    exit 1
  fi

  TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
  TOTAL_REMOVED=$((TOTAL_REMOVED + REMOVED))

  # 沒有下一批了 → 結束
  if [ "${NEXT_OFFSET}" = "null" ] || [ "${HAS_MORE}" = "false" ]; then
    echo ""
    echo "=========================================="
    echo "[$(date -Iseconds)] refresh-all 完成"
    echo "  總處理: ${TOTAL_PROCESSED}"
    echo "  總移除: ${TOTAL_REMOVED}"
    echo "  總輪數: ${ROUND}"
    echo "=========================================="
    break
  fi

  OFFSET=${NEXT_OFFSET}
  ROUND=$((ROUND + 1))

  # 等待避免 Google Sheets API quota (60 reads/min)
  echo "  等待 ${WAIT_SECONDS}s 避免 quota..."
  sleep "${WAIT_SECONDS}"
done
