# ◈ SIMULACRA ENTERTAINMENT

> 사람 없는 완벽함 — 합성 배우 · 가상 광고 모델 · AI 음악.
> 현실을 초월하는 AI 엔터테인먼트 랜딩 페이지.

**AngularJS 1.8 (프론트엔드) + Express (서버)** 로 만든 원페이지 사이트입니다.
모든 비주얼 에셋(합성 배우 ARIA/KAI/NOVA, 가상 가수 ECHO/LUMEN, 히어로)은
**Higgsfield GPT Image 2** 로 생성했습니다.

## 실행

```bash
npm install
npm start            # 기본 http://localhost:3000
PORT=4173 npm start  # 포트 지정
```

## 구조

```
server.js                 Express 서버 (정적 서빙 + /api/content, /api/health)
data/content.js           사이트 콘텐츠 데이터 (서버가 API로 제공)
public/
  index.html              AngularJS 앱 마크업
  css/styles.css          다크 프리미엄 테마 (violet/amber/blue)
  js/app.js               컨트롤러 · reveal/smooth-scroll 디렉티브 · Web Audio 음원 엔진
  assets/generated/       Higgsfield 생성 이미지 (webp 최적화본)
assets-src/               원본 고해상도 PNG (서빙 안 함, 소스 보관용)
```

## 특징

- **콘텐츠 API**: Express가 `/api/content` 로 데이터를 주고 AngularJS `$http` 가 소비.
- **합성 배우 포트폴리오**: 호버 시 정보/태그 전개.
- **A.I. Anthems 플레이어**: 재생 버튼을 누르면 **Web Audio API** 로 트랙별 합성 앰비언트 사운드를 실제로 생성·재생 (오디오 파일 불필요). 웨이브폼은 재생 상태에 반응.
- **스크롤 리빌 / 켄번스 / 글로우 오브 / 필름 그레인** 등 모션 디테일.
- 완전 반응형 (데스크톱 / 모바일).

### QA

`?reveal=all` 쿼리스트링을 붙이면 스크롤 애니메이션 없이 전 섹션을 즉시 노출합니다 (스크린샷·검수용).

## 에셋 재생성

```bash
bash .gen/run.sh   # Higgsfield CLI 로 6종 이미지 재생성 (인증 필요)
```
