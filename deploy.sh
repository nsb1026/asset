#!/bin/bash

# 에러 발생 시 즉각 중단
set -e

echo "=== 1. Git 최신 코드 동기화 ==="
git fetch --all
git reset --hard origin/main

echo "=== 2. Docker 빌드 및 컨테이너 재시작 ==="
docker compose up -d --build --remove-orphans

echo "=== 3. 미사용 찌꺼기 이미지 정리 (선택) ==="
docker image prune -f

echo "=== 배포 완료 ==="
docker compose ps
