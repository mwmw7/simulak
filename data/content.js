// Simulak Entertainment — 사이트 콘텐츠 (Express API가 이 데이터를 AngularJS에 제공)
module.exports = {
  brand: {
    name: "SIMULAK",
    suffix: "ENTERTAINMENT",
    tagline: "사람 없는 완벽함"
  },

  hero: {
    eyebrow: "PERFECT ILLUSION",
    h1: "완벽한 환영",
    h1sub: "현실을 초월하는 AI 엔터테인먼트의 미래",
    h2: "합성 배우 · 가상 광고 모델 · AI 음악 — 사람 없는 세상의 새로운 즐거움",
    cta: "지금 경험하기",
    image: "assets/generated/hero.webp",
    video: "assets/video/hero.mp4"
  },

  philosophy: [
    {
      no: "01",
      title: "발현",
      body: "우리는 장 보드리야르의 ‘시뮬라크(Simulak)’ 개념에서 영감을 얻었습니다. 복제물이 원본을 대체하는 새로운 현실이 도래하고 있습니다. 이는 전통적인 개념에 도전하지만, 우리는 이것이 오히려 아름답고 효율적인 해결책이라고 믿습니다."
    },
    {
      no: "02",
      title: "사람 없는 완벽함",
      body: "인간의 개입 없이도 완벽한 광고, 영화, 음악을 창조할 수 있습니다. 합성 배우, 가상 광고 모델, AI 음악을 활용해 인간의 실수와 한계를 극복하고, 창작물의 질과 제작 효율·확장성을 극대화합니다."
    },
    {
      no: "03",
      title: "비전",
      body: "‘SIMULAK(시뮬락)’는 향후 5년 내 미디어 산업을 주도할 것입니다. 현실과 가상의 경계를 허물고, 관객에게 더욱 완벽하고 몰입감 있는 새로운 형태의 콘텐츠와 경험을 끊임없이 선보입니다."
    }
  ],

  services: [
    {
      id: "synth-stars",
      kicker: "SYNTH STARS",
      name: "합성 배우 및 모델",
      points: [
        "완벽한 외모와 무한한 감정의 AI 배우 및 모델로 영화·시리즈·패션 광고를 구현합니다.",
        "스케줄 충돌 없이 어떤 역할이든 완벽하게 소화합니다.",
        "실재보다 더 실재 같은 경험을 선사합니다."
      ]
    },
    {
      id: "ai-anthems",
      kicker: "A.I. ANTHEMS",
      name: "생성형 음악 제작",
      points: [
        "공학적으로 제작된 AI 작곡 트랙과 가상 아티스트가 정확한 인간의 감정을 전달합니다.",
        "광고·미디어·스트리밍 등 어디에서든 완벽한 음원을 제공합니다.",
        "창의성과 재현성의 완벽한 조화로 새로운 음악 경험을 선사합니다."
      ]
    },
    {
      id: "hyper-ads",
      kicker: "HYPER-TARGETED ADS",
      name: "초개인화 광고",
      points: [
        "인구통계학적 특성에 맞춰 즉각적으로 배우와 음악을 맞춤화하는 차세대 마케팅 자산입니다.",
        "타겟 고객의 취향과 감성을 정확히 이해하고 사로잡습니다.",
        "기존 광고 대비 높은 전환율과 ROI를 보장합니다."
      ]
    }
  ],

  synthStars: [
    { name: "ARIA", role: "Leading Actress", tags: ["Drama", "Fashion", "Cinematic"], image: "assets/generated/actor-aria.webp", video: "assets/video/actor-aria.mp4", status: "AVAILABLE 24/7" },
    { name: "KAI", role: "Leading Actor", tags: ["Action", "Editorial", "Brand"], image: "assets/generated/actor-kai.webp", video: "assets/video/actor-kai.mp4", status: "AVAILABLE 24/7" },
    { name: "NOVA", role: "Supermodel", tags: ["Avant-garde", "Runway", "Campaign"], image: "assets/generated/actor-nova.webp", video: "assets/video/actor-nova.mp4", status: "AVAILABLE 24/7" }
  ],

  artists: [
    { name: "ECHO", genre: "Synth-Pop / Future Bass", image: "assets/generated/artist-echo.webp", video: "assets/video/artist-echo.mp4", track: "Hollow Light", bpm: 124, audio: "assets/audio/hollow-light.mp3" },
    { name: "LUMEN", genre: "Ambient / Cinematic", image: "assets/generated/artist-lumen.webp", video: "assets/video/artist-lumen.mp4", track: "Ghost in the Signal", bpm: 92, audio: "assets/audio/perfect-illusion.mp3" }
  ],

  metrics: [
    { value: "0", label: "인간 개입", suffix: "%" },
    { value: "24/7", label: "촬영 가능", suffix: "" },
    { value: "∞", label: "확장성", suffix: "" },
    { value: "3.4", label: "평균 ROI 상승", suffix: "x" }
  ],

  // 초개인화 광고 — 하나의 크리에이티브가 오디언스 세그먼트별로 즉시 재렌더링
  // 초개인화 콘솔 전용 신규 얼굴 — 사이트 다른 섹션과 겹치지 않는 독립 인물 4명
  targeting: [
    { seg: "GEN-Z · 여성", image: "assets/generated/ad-genz-f.webp", grade: "violet", headline: "새벽의 환영", ctr: "8.4%", conv: "6.1%", roi: "4.2x" },
    { seg: "30대 · 남성", image: "assets/generated/ad-m30.webp", grade: "blue", headline: "완벽한 페르소나", ctr: "7.1%", conv: "5.3%", roi: "3.6x" },
    { seg: "밀레니얼 · 글로벌", image: "assets/generated/ad-mil.webp", grade: "amber", headline: "경계 없는 아름다움", ctr: "9.2%", conv: "7.4%", roi: "4.8x" },
    { seg: "Z세대 · 글로벌", image: "assets/generated/ad-z.webp", grade: "teal", headline: "빛이 되는 순간", ctr: "8.8%", conv: "6.7%", roi: "4.5x" }
  ],

  contact: {
    email: "hello@simulak.co",
    socials: ["Instagram", "X / Twitter", "YouTube", "Behance"]
  }
};
