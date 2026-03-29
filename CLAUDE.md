
# CLAUDE.md — 틈 (TEUM) 프로젝트 컨텍스트

> 이 파일은 Claude Code가 틈 프로젝트의 모든 맥락을 이해하고 일관된 코드를 생성하기 위한 핵심 참조 문서다.
> 새 기능을 구현하기 전, 반드시 이 파일 전체를 읽어라.

---

## 1. 서비스 정의

**틈(TEUM)** 은 동네 예약 기반 상점(뷰티샵 등)의 비어있는 예약 시간을 인근 주민에게 합리적인 가격으로 연결하는 **하이퍼로컬 O2O 타임 커머스 플랫폼**이다.

- **B2B 핵심 가치**: 공실 시간 → 즉시 현금 매출 전환. 사장님 기준 1분 내 슬롯 등록.
- **B2C 핵심 가치**: 고물가 시대, 도보 10분 내 검증된 동네 매장을 가성비 조건으로 이용.
- **현재 단계**: 마곡·가양 뷰티 업종 우선 집중. 파트너 모집 진행 중.
- **MVP**: `myteum.com` — Next.js + Vercel 배포. 현재 서비스 흐름 및 UI 검증 단계.

---

## 2. 브랜드 & 디자인 시스템

### 색상 팔레트 (절대 임의 변경 금지)

총 4가지 색상만 사용한다. 이 이상 추가하지 말 것.

```css
/* ── 브랜드 2원색 ── */
--color-primary:    #334732;   /* Deep Forest  — 헤더, CTA 버튼, 강조 텍스트 */
--color-background: #F4F0E6;   /* Cream Beige  — 페이지·카드 배경 */

/* ── 기능 2색 (의미가 있을 때만) ── */
--color-accent:     #C8A96E;   /* Warm Gold    — 할인율·Flash 긴급 강조, 틈 노크 배지 */
--color-danger:     #C0392B;   /* Soft Red     — 노쇼·오류·경고 상태 */

/* ── 시스템 (위 4색에서 파생, 별도 hex 추가 금지) ── */
--color-text-primary:   #1C2B1B;   /* primary 계열 다크 */
--color-text-secondary: #6B6B5E;   /* 중간 뮤트 */
--color-text-muted:     #A8A89A;   /* 힌트·플레이스홀더 */
--color-border:         #E3DFD4;   /* background 계열 보더 */
--color-surface:        #FFFFFF;   /* 카드·모달 흰 배경 */
--color-surface-alt:    #FAF8F3;   /* background보다 약간 밝은 서피스 */
```

**색상 사용 원칙**

| 요소 | 색상 |
|------|------|
| 메인 CTA 버튼, 헤더 배경, 선택 상태 | `--color-primary` |
| 페이지 배경, 기본 카드 배경 | `--color-background` |
| Flash 긴급 배지, 할인율 숫자, 틈 노크 라벨 | `--color-accent` |
| 노쇼 경고, 에러 메시지, 만료 상태 | `--color-danger` |
| 그 외 모든 텍스트·보더 | 시스템 변수 사용 |

> 틸(#1D9E75), 퍼플(#534AB7), 네이비(#1F3864), 앰버(#F5A623) 등 이전 컬러는 **전부 폐기**. 절대 추가하지 말 것.

---

### 타이포그래피

```css
/* 반드시 이 두 폰트만 사용 */
--font-primary: 'Pretendard', sans-serif;   /* 본문·UI 텍스트 전반 */
--font-accent:  'DM Serif Display', serif;  /* 히어로 헤딩, 브랜드 카피, 매장명 디스플레이 */

/* 웨이트: 400 (regular) · 500 (medium) · 600 (semibold) · 700 (bold) */
/* DM Serif Display는 400만 사용 */
```

**폰트 로드 (Next.js `layout.tsx`)**

```tsx
import { DM_Serif_Display } from 'next/font/google';
// Pretendard: CDN 로드
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
```

**타입 스케일**

```css
.text-display { font-family: var(--font-accent);   font-size: 2.25rem; font-weight: 400; }
.text-h1      { font-family: var(--font-primary);  font-size: 1.5rem;  font-weight: 700; }
.text-h2      { font-family: var(--font-primary);  font-size: 1.25rem; font-weight: 600; }
.text-h3      { font-family: var(--font-primary);  font-size: 1rem;    font-weight: 600; }
.text-body    { font-family: var(--font-primary);  font-size: 0.9375rem; font-weight: 400; }
.text-small   { font-family: var(--font-primary);  font-size: 0.8125rem; font-weight: 400; }
.text-label   { font-family: var(--font-primary);  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; }
```

---

### 디자인 원칙

- **배경은 항상 Cream Beige(`#F4F0E6`)** — `#ffffff`는 카드·모달 내부에만 허용.
- **Primary 버튼**: `background: #334732` · `color: #ffffff` · `border-radius: 8px`.
- **Secondary 버튼**: `background: transparent` · `border: 1.5px solid #334732` · `color: #334732`.
- **모서리**: 버튼 `8px` · 카드 `12px` · 모달/바텀시트 `16px` · 배지 `100px`(pill).
- **그림자**: `box-shadow: 0 2px 12px rgba(51, 71, 50, 0.07)` — 진한 그림자 금지.
- **transition**: `200ms ease` 기본.
- **이미지 오버레이**: 커버 이미지 위 텍스트는 `linear-gradient(to top, rgba(0,0,0,0.55), transparent)`.

---

## 3. 핵심 기능 명세

### 기능 ① Early-Bird & Flash (원터치 공실 등록) [B2B]

- **Early-Bird**: 내일/이번 주 빈자리 사전 등록
- **Flash**: 당일 갑작스러운 공실 — `--color-accent` 강조
- 등록 흐름: 프리셋 시간 선택 → 할인율 슬라이더 → 즉시 등록 (3단계 이내)
- 반경 2km 내 유저에게 즉각 푸시 알림 발송

### 기능 ② 하이퍼로컬 타임라인 [B2C]

- 현재 위치 기준 도보 10분 내 이용 가능 슬롯만 피드 형태 노출
- **30초 내 예약 완결**: 이름 + 연락처 + 보증금 결제

### 기능 ③ 틈 노크 / TEUM Knock (수요 주도형 역매칭) [B2B/B2C]

- 소비자가 조건(시간/예산)을 먼저 제시 → 공실 사장님이 수락/역제안
- UI: 소비자 노크 카드 + 사장님 [수락] / [역제안] 원터치 버튼
- `--color-accent` 배지로 시각 구분

### 기능 ④ 틈 트리 (노쇼 방지 게이미피케이션) [B2C]

- 예약 시 보증금 1,000원 자동 결제 → 앱 내 캐릭터 '틈 트리' 생성
- **노쇼 발생 시**: 보증금 차감 + 캐릭터 고사 시각 표현 (`--color-danger`)
- **방문 완료 시**: 보증금 1,000원 → 틈 크레딧 100% 환급
- 경험치: 예약 완료 +10XP / 노쇼 –20XP / 후기 작성 +5XP
- 레벨: Lv.1 씨앗(0–50) · Lv.2 새싹(51–150) · Lv.3 나무(151–300) · Lv.4 숲(301+)
- 색상은 `--color-primary` 계열만 사용 — 별도 컬러 추가 금지

### 기능 ⑤ 파트너 입점 등록 온보딩 [B2B] ← 신규

파트너가 서비스에 처음 입점할 때 매장 정보를 등록하는 3단계 스텝퍼.
소비자도 해당 정보를 매장 상세 페이지에서 열람 가능해야 함.

**Step 1 — 기본 정보**
- 매장명 (필수)
- 업종 카테고리: `hair` · `nail` · `skin` · `wax` · `etc` (단일 선택)
- 대표 전화번호 (필수)
- 사업자등록번호 (선택, 추후 정산용)

**Step 2 — 위치 정보**
- 주소 검색 (카카오 우편번호 API)
- 지도 핀 드래그로 정확한 위치 조정 (Kakao Maps SDK)
- 위도·경도 자동 저장 (`partners.lat` / `partners.lng`)
- 가장 가까운 역 + 도보 분 입력 (예: `마곡나루역 도보 3분`)

**Step 3 — 매장 소개**
- 커버 이미지 업로드 (필수, 최대 1장, 권장 3:2 비율)
- 갤러리 이미지 (선택, 최대 5장)
- 한 줄 소개 (최대 50자)
- 상세 소개 (최대 500자, 선택)
- 영업 시간 (요일별 설정)
- 서비스 태그 (예: `여성컷` `붙임머리`, 최대 5개)
- 인스타그램 링크 (선택)

**이미지 저장**: Supabase Storage `partner-images` 버킷.
경로: `{partner_id}/cover.webp` · `{partner_id}/gallery/{n}.webp`

**입점 완료 후**: 관리자 승인 없이 즉시 `is_active: true`. 커버 이미지 미업로드 시 플레이스홀더 표시.

**스텝퍼 UX 규칙**:
- 상단에 진행 단계 인디케이터 (Step 1/3 형태)
- 이전 단계 언제든 수정 가능
- 각 단계 데이터는 `localStorage`에 임시 저장 (새로고침 대비)
- 마지막 단계에서 전체 미리보기 후 최종 제출

---

## 4. 위치 기반 서비스 (하이퍼로컬 핵심) ← 신규

틈의 핵심 해자는 하이퍼로컬 밀도다. 위치 기반 구현을 반드시 정확하게 구현한다.

### 위치 권한 흐름

```
앱 첫 진입
  ↓
navigator.geolocation.getCurrentPosition() 요청
  ↓ 허용                        ↓ 거부 또는 미지원
실시간 좌표 사용            기본 좌표 (마곡나루역: 37.5594, 126.8297)
                            + "위치를 허용하면 더 정확한 슬롯을 볼 수 있어요" 배너
```

### 거리 계산 (`lib/geo.ts`)

```typescript
// Haversine 공식 — 외부 라이브러리 사용 금지
export function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 도보 분 환산 (평균 도보 4km/h 기준)
export function getWalkMinutes(distanceKm: number): number {
  return Math.ceil((distanceKm / 4) * 60);
}

// 거리 포맷
export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
```

### 슬롯 목록 쿼리

```typescript
// 반경 N km 이내 슬롯 조회 — 앱단 Haversine 필터
const { data } = await supabase
  .from('slots')
  .select(`*, partners(id, name, lat, lng, category, cover_image_url, station_proximity)`)
  .eq('status', 'open')
  .gte('available_date', today)
  .order('available_date', { ascending: true });

const nearby = (data ?? [])
  .map(slot => ({
    ...slot,
    distanceKm: getDistanceKm(userLat, userLng, slot.partners.lat, slot.partners.lng),
  }))
  .filter(slot => slot.distanceKm <= radiusKm)   // 기본 2km
  .sort((a, b) => a.distanceKm - b.distanceKm);
```

### 카카오 지도 컴포넌트

- **SDK**: Kakao Maps JavaScript SDK
- **환경변수**: `NEXT_PUBLIC_KAKAO_MAP_KEY`
- **사용 화면**:
  1. 타임라인 — 리스트/지도 토글 뷰 (슬롯 핀 표시)
  2. 매장 상세 — 위치 섹션 (정적 지도 또는 인터랙티브)
  3. 파트너 입점 Step 2 — 위치 핀 드래그 설정
- **마커**: `--color-primary(#334732)` 커스텀 SVG 핀. 선택된 파트너는 확대 표시.
- 지도 배경은 Kakao 기본 스타일 유지.

---

## 5. 결제 구조 & 수수료 정책

### 이원화 하이브리드 결제

```
[앱 내 선결제]           [매장 현장 결제]          [QR 인증 후 처리]
보증금   1,000원   +    시술 본금액 현금       →   보증금 크레딧 환급
이용료     500원         (사장님 현금 유동성            파트너 수수료 처리
─────────────            100% 보장)                    (아래 단계별 정책 적용)
소비자 총 1,500원
```

### 수수료 정책 — 성장 단계별

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 0  (파트너 100개 · 이용자 1,000명 달성 전 — 현재 적용)  │
│                                                              │
│  소비자(B2C):  예약 시 1,500원 선결제                          │
│    · 보증금 1,000원 — 방문 시 크레딧 환급                       │
│    · 플랫폼 이용료 500원 — 노쇼 방어 운영비                     │
│                                                              │
│  파트너(B2B):  수수료 0원                                      │
│    · QR 인증 시 수수료 차감 로직 실행하지 않음                   │
│    · partners.charge_balance 변동 없음                        │
│    · 입점 시 이 정책을 사장님에게 명확히 안내할 것               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Phase 1  (기준 달성 후 — 어드민에서 수동 전환)                 │
│                                                              │
│  소비자(B2C):  동일 (1,500원)                                  │
│  파트너(B2B):  기능별 차등 수수료 도입                          │
│    · Early-Bird:  1,500원/건                                  │
│    · Flash:       2,000원/건                                  │
│    · 틈 노크:     2,500원/건                                   │
└──────────────────────────────────────────────────────────────┘
```

**코드 구현 주의사항**:
- `partners.fee_phase` 컬럼으로 분기 (`0` = 무료, `1` = 유료). 기본값 `0`.
- QR 인증 API: `fee_phase === 0`이면 수수료 차감 건너뜀.
- Phase 전환은 어드민 `/admin/partners/[id]/fee-phase` PATCH로 처리.
- 수수료 금액 절대 하드코딩 금지 — 항상 DB 값 기준.

---

## 6. 데이터베이스 스키마 (Supabase)

```sql
-- 사용자
users (
  id uuid PRIMARY KEY,
  phone varchar(20) UNIQUE,
  name varchar(50),
  created_at timestamptz,
  teum_tree_xp integer DEFAULT 0,
  teum_tree_level integer DEFAULT 1,
  credit_balance integer DEFAULT 0
)

-- 파트너 매장
partners (
  id uuid PRIMARY KEY,
  owner_user_id uuid REFERENCES users,
  name varchar(100),
  category varchar(50),              -- 'hair' | 'nail' | 'skin' | 'wax' | 'etc'
  phone varchar(20),
  business_registration_no varchar(20),
  address text,
  lat decimal(10,8),
  lng decimal(11,8),
  station_proximity varchar(100),    -- '마곡나루역 도보 3분'
  cover_image_url text,              -- Supabase Storage URL
  gallery_image_urls text[],         -- 최대 5장
  description_short varchar(50),
  description_long text,
  business_hours jsonb,              -- { mon:{open:'10:00',close:'20:00',closed:false}, ... }
  service_tags text[],               -- 최대 5개
  instagram_url text,
  charge_balance integer DEFAULT 0,
  fee_phase integer DEFAULT 0,       -- 0: 무료 / 1: 유료
  is_active boolean DEFAULT true,
  created_at timestamptz
)

-- 공실 슬롯
slots (
  id uuid PRIMARY KEY,
  partner_id uuid REFERENCES partners,
  slot_type varchar(20),             -- 'early_bird' | 'flash' | 'knock_response'
  service_name varchar(200),
  original_price integer,
  discount_price integer,
  discount_rate integer,
  available_date date,
  start_time time,
  end_time time,
  total_seats integer DEFAULT 1,
  booked_seats integer DEFAULT 0,
  status varchar(20) DEFAULT 'open', -- 'open' | 'full' | 'closed' | 'expired'
  created_at timestamptz,
  expires_at timestamptz
)

-- 예약
reservations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  slot_id uuid REFERENCES slots,
  partner_id uuid REFERENCES partners,
  status varchar(20) DEFAULT 'confirmed',
  deposit_amount integer DEFAULT 1000,
  platform_fee integer DEFAULT 500,
  total_paid integer DEFAULT 1500,
  qr_code varchar(100) UNIQUE,
  qr_verified_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz,
  visit_date date,
  visit_time time
)

-- 틈 크레딧 내역
credits (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  amount integer,
  type varchar(30),                  -- 'deposit_refund' | 'no_show_penalty' | 'coupon_use'
  reservation_id uuid REFERENCES reservations,
  description text,
  created_at timestamptz
)

-- 쿠폰
coupons (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  code varchar(50) UNIQUE,
  discount_amount integer,
  min_order_amount integer DEFAULT 0,
  valid_until timestamptz,
  used_at timestamptz,
  is_used boolean DEFAULT false,
  partner_id uuid REFERENCES partners
)

-- 후기
reviews (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  reservation_id uuid REFERENCES reservations UNIQUE,
  partner_id uuid REFERENCES partners,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  content text,
  is_anonymous boolean DEFAULT false,
  photos text[],
  created_at timestamptz
)

-- 틈 노크 (역매칭 요청)
knocks (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  category varchar(50),
  preferred_date_from date,
  preferred_date_to date,
  preferred_time_from time,
  preferred_time_to time,
  budget integer,
  memo text,
  radius_km decimal DEFAULT 1.0,
  status varchar(20) DEFAULT 'active',
  matched_slot_id uuid REFERENCES slots,
  created_at timestamptz,
  expires_at timestamptz
)
```

---

## 7. API 라우트 구조

```
/api/
├── auth/
│   ├── send-otp                    POST  전화번호 OTP 발송
│   └── verify-otp                  POST  OTP 검증 + 세션 발급
│
├── slots/
│   ├── index                       GET   위치 기반 슬롯 목록 (lat, lng, radius 필수)
│   ├── [id]                        GET   슬롯 상세
│   └── create                      POST  슬롯 생성 (파트너 전용)
│
├── partners/
│   ├── [id]                        GET   매장 상세 — 소비자 열람용 (공개)
│   ├── [id]/reviews                GET   매장 후기 목록 (공개)
│   └── onboard                     POST  파트너 입점 등록 Step 1~3 통합 제출
│
├── reservations/
│   ├── create                      POST  예약 생성 + 보증금 결제
│   ├── confirm                     POST  예약 확정 → 카카오 알림톡 (Webhook)
│   └── qr-verify                   POST  QR 인증 → fee_phase 분기 → 크레딧 환급
│
├── cron/
│   ├── reminders                   GET   D-1 리마인드 (매일 KST 10:00)
│   ├── complete-reservations       GET   방문완료 자동 처리 (매시간)
│   └── expire-slots                GET   만료 슬롯 처리 (매시간)
│
├── partner/
│   ├── dashboard                   GET   파트너 대시보드 데이터
│   └── slots/[id]                  PATCH 슬롯 수정/마감
│
└── admin/
    ├── stats                       GET   KPI 집계
    ├── partners/[id]/fee-phase     PATCH 수수료 단계 전환
    └── export                      GET   CSV 내보내기
```

---

## 8. 파일 구조

```
teum-web/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                      # 메인 랜딩
│   │   ├── store/
│   │   │   ├── page.tsx                  # 매장 목록 (지도/리스트 토글)
│   │   │   └── [id]/
│   │   │       └── page.tsx              # 매장 상세 (소비자 열람)
│   │   └── reserve/[slotId]/page.tsx     # 예약 플로우
│   │
│   ├── (user)/
│   │   └── mypage/
│   │       ├── page.tsx                  # 탭: 예약내역 / 틈트리 / 쿠폰지갑
│   │       └── review/[reservationId]/page.tsx
│   │
│   ├── (partner)/
│   │   └── partner/
│   │       ├── page.tsx                  # 파트너 대시보드
│   │       ├── login/page.tsx
│   │       ├── onboard/                  # 입점 등록 스텝퍼
│   │       │   ├── page.tsx
│   │       │   └── components/
│   │       │       ├── Step1Basic.tsx
│   │       │       ├── Step2Location.tsx  # 카카오 지도 포함
│   │       │       └── Step3Profile.tsx   # 이미지 업로드
│   │       └── slots/page.tsx
│   │
│   ├── (admin)/
│   │   └── admin/page.tsx
│   │
│   └── api/                              # (섹션 7 참조)
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   └── Stepper.tsx                   # 입점 스텝퍼 공통
│   ├── map/
│   │   ├── KakaoMap.tsx                  # 카카오 지도 래퍼
│   │   └── LocationPicker.tsx            # 입점 Step2 위치 설정
│   ├── slots/
│   │   ├── SlotCard.tsx
│   │   └── QuickSlotForm.tsx
│   ├── partner/
│   │   ├── PartnerCard.tsx               # 매장 목록 카드
│   │   └── PartnerProfile.tsx            # 매장 상세 프로필
│   └── teum-tree/
│       └── TeumTree.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── solapi.ts
│   ├── geo.ts                            # Haversine 거리 계산
│   └── xp.ts
│
├── middleware.ts
└── CLAUDE.md
```

---

## 9. 매장 상세 페이지 구조 (소비자 열람)

```
[커버 이미지 풀블리드 + 그라데이션 오버레이]
[매장명(font-accent) + 카테고리 배지 + 평균 별점]
[거리 표시 + 도보 분 + 역 접근성]
─────────────────────────────────────────────
[현재 예약 가능한 슬롯 목록]   ← 예약 CTA 핵심 섹션
─────────────────────────────────────────────
[갤러리 이미지 가로 스크롤]
[한 줄 소개 + 상세 소개]
[영업 시간]
[서비스 태그]
[위치 지도 (카카오 지도 임베드)]
[후기 목록 (별점 + 텍스트 + 작성일)]
```

---

## 10. 알림 & 자동화 규칙

| 이벤트 | 발송 시점 | 수신자 |
|--------|-----------|--------|
| 예약 확정 | 즉시 (Supabase Webhook) | 소비자 |
| D-1 리마인드 | 방문 전날 오전 10시 | 소비자 |
| 후기 요청 | 방문 완료 +2시간 후 | 소비자 |
| 새 노크 수신 | 즉시 | 사장님 |
| QR 인증 완료 | 즉시 | 사장님 |

발송 서비스: **솔라피(Solapi)** — 알림톡 심사 완료 전 SMS 폴백 필수.

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/reminders",            "schedule": "0 1 * * *"  },
    { "path": "/api/cron/complete-reservations", "schedule": "0 * * * *"  },
    { "path": "/api/cron/expire-slots",          "schedule": "30 * * * *" }
  ]
}
```

---

## 11. 환경변수 목록

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # 서버 전용, NEXT_PUBLIC_ 금지

# 카카오
NEXT_PUBLIC_KAKAO_MAP_KEY=           # 카카오 지도 SDK
NEXT_PUBLIC_KAKAO_CHANNEL_ID=        # 알림톡 채널

# 알림 (솔라피)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_PHONE=

# 어드민
ADMIN_PASSWORD=

# 앱 설정
NEXT_PUBLIC_APP_URL=https://myteum.com
NEXT_PUBLIC_DEFAULT_LAT=37.5594      # 마곡나루역
NEXT_PUBLIC_DEFAULT_LNG=126.8297
NEXT_PUBLIC_DEFAULT_RADIUS_KM=2
```

---

## 12. 코딩 규칙 & 금지사항

### 반드시 지킬 것

- **TypeScript strict 모드** — `any` 타입 사용 금지
- **Supabase RLS 활성화** — 모든 테이블 적용
- **서버 컴포넌트 우선** — 클라이언트 컴포넌트는 상호작용 필요 시만
- **에러 핸들링 필수** — try/catch 없는 async 함수 금지
- **`SUPABASE_SERVICE_ROLE_KEY`** 절대 클라이언트 노출 금지

### 절대 하지 말 것

- 배경색 `#ffffff` 단독 사용 (카드·모달 내부 제외)
- Pretendard·DM Serif Display 외 폰트 사용
- 4개 브랜드 컬러 외 임의 hex 추가
- `fee_phase` 무시하고 수수료 로직 하드코딩
- QR 인증 없이 수수료 차감 실행
- `console.log` 프로덕션 잔류

### 핵심 유틸 패턴

```typescript
// 슬롯 타입별 설정
const SLOT_TYPE_CONFIG = {
  early_bird:     { label: 'Early-Bird', bg: '#334732', color: '#ffffff' },
  flash:          { label: 'Flash 긴급', bg: '#C8A96E', color: '#ffffff' },
  knock_response: { label: '틈 노크',    bg: '#C8A96E', color: '#ffffff' },
} as const;

// 할인율 계산
const getDiscountRate = (original: number, discounted: number): number =>
  Math.round((1 - discounted / original) * 100);

// 틈 트리 레벨
const getTeumTreeLevel = (xp: number) => {
  if (xp <=  50) return { level: 1, name: '씨앗', emoji: '🌱' };
  if (xp <= 150) return { level: 2, name: '새싹', emoji: '🌿' };
  if (xp <= 300) return { level: 3, name: '나무', emoji: '🌳' };
  return              { level: 4, name: '숲',   emoji: '🌲' };
};

// 파트너 수수료 (fee_phase 기반)
const getPartnerFee = (feePhase: number, slotType: string): number => {
  if (feePhase === 0) return 0;
  const fees: Record<string, number> = {
    early_bird: 1500, flash: 2000, knock_response: 2500,
  };
  return fees[slotType] ?? 1500;
};
```

---

## 13. 비즈니스 로직 요약

### Phase 0 — 파트너 수수료 무료 (현재)

| 이벤트 | 소비자 | 파트너 충전금 | 플랫폼 |
|--------|--------|--------------|--------|
| 예약 생성 | –1,500원 (앱 결제) | 변동 없음 | +500원 |
| QR 방문 인증 | 크레딧 +1,000원 | **변동 없음** (fee_phase=0) | +0원 |
| 노쇼 확정 | 보증금 몰수, XP –20 | 변동 없음 | +1,000원 |
| 후기 작성 | XP +5 | — | — |

### Phase 1 — 수수료 도입 후

| 이벤트 | 소비자 | 파트너 충전금 | 플랫폼 |
|--------|--------|--------------|--------|
| 예약 생성 | –1,500원 | 변동 없음 | +500원 |
| QR 방문 인증 | 크레딧 +1,000원 | –수수료 자동 차감 | +1,500원↑ |
| 노쇼 확정 | 보증금 몰수, XP –20 | 수수료 면제 | +1,000원 |

**QR 인증 = 수수료 징수 트리거** — QR 없이 차감 로직 실행 금지.

---

## 14. 개발 우선순위

1. **파트너 입점 등록 온보딩** — 매장 정보가 있어야 모든 기능이 시작됨
2. **매장 상세 페이지 (소비자 열람)** — 지도 + 갤러리 + 슬롯 + 후기
3. **파트너 대시보드 + 퀵 슬롯 등록**
4. **예약 자동화** — 카카오 알림톡 (채널 심사 병행 진행)
5. **마이페이지** — 예약내역 / 틈 트리 / 쿠폰 지갑
6. **후기 시스템**
7. **어드민 대시보드** — KPI + fee_phase 전환 UI

---

*최종 업데이트: 2026.03 | 대표: 김재모 | myteum.com*
