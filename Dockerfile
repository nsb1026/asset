# ====================================================================
# Nuxt 3 Asset Management Dockerfile (Multi-stage Build)
# ====================================================================

# 1. 빌드 단계 (Build Stage)
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니저 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 전체 소스코드 복사 및 Nuxt 3 프로덕션 빌드
COPY . .
RUN npm run build

# 2. 실행 단계 (Runner Stage - 경량화 알파인 이미지)
FROM node:20-alpine AS runner

WORKDIR /app

# 환경변수 설정
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 빌드 결과물(.output) 및 필요한 파일만 복사
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Nuxt 3 Nitro 서버 실행
CMD ["node", ".output/server/index.mjs"]
