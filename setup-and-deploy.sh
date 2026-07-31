#!/bin/bash

# ====================================================================
# 신규 리눅스 서버용 원클릭 자동 설치 & 배포 원라이너 스크립트
# ====================================================================
# GitHub 주소: https://github.com/nsb1026/asset.git
# - Git, Docker, Docker Compose 자동 설치
# - https://github.com/nsb1026/asset.git 자동 클론
# - 도커 기반 빌드 및 즉시 무중단 배포

set -e

echo "=================================================================="
echo "📦 [1/4] 리눅스 서버 필수 도구 (Git, Docker) 설치 상태 점검 중..."
echo "=================================================================="

# Git 설치 확인
if ! command -v git &> /dev/null; then
    echo "⚙️ Git을 설치합니다..."
    sudo apt-get update && sudo apt-get install -y git
fi

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    echo "⚙️ Docker를 설치합니다..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER || true
fi

# Docker Compose 플러그인 확인
if ! docker compose version &> /dev/null; then
    echo "⚙️ Docker Compose 플러그인을 설치합니다..."
    sudo apt-get install -y docker-compose-plugin || true
fi

echo ""
echo "=================================================================="
echo "📥 [2/4] https://github.com/nsb1026/asset.git 소스 코드 Clone 중..."
echo "=================================================================="

TARGET_DIR="assetManage"

if [ -d "$TARGET_DIR" ]; then
    echo "💡 '$TARGET_DIR' 폴더가 이미 존재합니다. 해당 폴더로 이동합니다."
    cd "$TARGET_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    git clone https://github.com/nsb1026/asset.git "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

chmod +x deploy.sh

echo ""
echo "=================================================================="
echo "🐳 [3/4] Docker Compose 빌드 및 무중단 웹 서비스 컨테이너 구동 중..."
echo "=================================================================="
docker compose up -d --build

echo ""
echo "=================================================================="
echo "✅ [4/4] 자산 관리 시스템 배포가 성공적으로 완료되었습니다!"
echo "=================================================================="
echo "🌐 웹 서비스 주소: http://$(curl -s ifconfig.me || echo '서버IP'):3000"
echo "=================================================================="
