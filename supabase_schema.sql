-- ============================================================
-- 틈(TEUM) Supabase Database Schema — 완전 재실행 가능 (idempotent)
-- Supabase SQL Editor에 전체 내용을 붙여넣고 실행하세요.
-- 이미 테이블이 있어도 안전하게 실행됩니다.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE,                     -- OTP 전화번호 로그인 시 NULL 허용
  name          TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  neighborhood  TEXT,
  district      TEXT,
  profile_image TEXT,
  role          TEXT NOT NULL DEFAULT 'consumer'
                  CHECK (role IN ('consumer', 'partner', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PARTNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  business_name   TEXT NOT NULL,
  category        TEXT NOT NULL
                    CHECK (category IN (
                      'pilates','yoga','esthetic','hair_salon',
                      'nail','massage','fitness','one_day_class','etc'
                    )),
  description     TEXT,
  address         TEXT NOT NULL DEFAULT '',
  neighborhood    TEXT NOT NULL DEFAULT '',
  district        TEXT NOT NULL DEFAULT '',
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  phone           TEXT,
  kakao_channel   TEXT,
  image_urls      TEXT[],
  tags            TEXT[],
  status          TEXT NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('pending','approved','suspended')),
  approved_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. SLOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.slots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id        UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  service_duration  INT NOT NULL DEFAULT 60,
  slot_date         DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  original_price    INT NOT NULL,
  discounted_price  INT NOT NULL,
  max_capacity      INT NOT NULL DEFAULT 1,
  reserved_count    INT NOT NULL DEFAULT 0,
  bonus_description TEXT,
  credit_reward     INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','full','cancelled','completed')),
  visible_from      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT slots_price_check    CHECK (discounted_price <= original_price),
  CONSTRAINT slots_capacity_check CHECK (reserved_count <= max_capacity),
  CONSTRAINT slots_time_check     CHECK (end_time > start_time)
);

-- ============================================================
-- 4. RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id       UUID NOT NULL REFERENCES public.slots(id) ON DELETE RESTRICT,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  partner_id    UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('pending','confirmed','visited','cancelled','no_show')),
  user_name     TEXT NOT NULL,
  user_phone    TEXT NOT NULL,
  memo          TEXT,
  coupon_id     UUID,
  credit_used   INT NOT NULL DEFAULT 0,
  final_price   INT NOT NULL,
  confirmed_at  TIMESTAMPTZ,
  visited_at    TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS reservations_slot_user_unique
  ON public.reservations(slot_id, user_id)
  WHERE status NOT IN ('cancelled');

-- ============================================================
-- 5. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID NOT NULL UNIQUE REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  partner_id      UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  slot_id         UUID NOT NULL REFERENCES public.slots(id) ON DELETE SET NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content         TEXT NOT NULL,
  image_urls      TEXT[],
  is_photo_review BOOLEAN NOT NULL DEFAULT FALSE,
  is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
  keywords        TEXT[],
  reviewer_name   TEXT,
  bonus_claimed   BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. CREDITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount       INT NOT NULL,
  balance      INT NOT NULL,
  type         TEXT NOT NULL
                 CHECK (type IN (
                   'earn_review','earn_visit','earn_referral','earn_event',
                   'use_reservation','expire','admin_adjust','no_show','deposit_refund'
                 )),
  description  TEXT,
  reference_id UUID,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.user_credit_balance AS
  SELECT user_id, SUM(amount) AS total_balance
  FROM public.credits GROUP BY user_id;

-- ============================================================
-- 7. COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL
                    CHECK (type IN ('percent','fixed_amount','free')),
  discount_value  INT NOT NULL DEFAULT 0,
  min_price       INT NOT NULL DEFAULT 0,
  max_discount    INT,
  total_quantity  INT,
  used_count      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_coupons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coupon_id      UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  is_used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_at        TIMESTAMPTZ,
  reservation_id UUID REFERENCES public.reservations(id),
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coupon_id)
);

-- reservations.coupon_id FK (이미 있으면 무시)
DO $$ BEGIN
  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_coupon_id_fkey
    FOREIGN KEY (coupon_id) REFERENCES public.user_coupons(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_slots_date_status    ON public.slots(slot_date, status);
CREATE INDEX IF NOT EXISTS idx_slots_partner_id     ON public.slots(partner_id);
CREATE INDEX IF NOT EXISTS idx_partners_district    ON public.partners(district);
CREATE INDEX IF NOT EXISTS idx_partners_neighborhood ON public.partners(neighborhood);
CREATE INDEX IF NOT EXISTS idx_partners_status      ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id   ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_partner_id ON public.reservations(partner_id);
CREATE INDEX IF NOT EXISTS idx_reservations_slot_id   ON public.reservations(slot_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status    ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_credits_user_id      ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_partner_id   ON public.reviews(partner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id      ON public.reviews(user_id);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_partners_updated_at
    BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_slots_updated_at
    BEFORE UPDATE ON public.slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 슬롯 예약 인원 자동 집계 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_slot_reserved_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.slots
  SET
    reserved_count = (
      SELECT COUNT(*) FROM public.reservations
      WHERE slot_id = COALESCE(NEW.slot_id, OLD.slot_id)
        AND status NOT IN ('cancelled')
    ),
    status = CASE
      WHEN (
        SELECT COUNT(*) FROM public.reservations
        WHERE slot_id = COALESCE(NEW.slot_id, OLD.slot_id)
          AND status NOT IN ('cancelled')
      ) >= max_capacity THEN 'full'
      ELSE 'open'
    END
  WHERE id = COALESCE(NEW.slot_id, OLD.slot_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_sync_slot_count
    AFTER INSERT OR UPDATE OF status ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.sync_slot_reserved_count();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS "users_select_own"  ON public.users;
DROP POLICY IF EXISTS "users_update_own"  ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- PARTNERS
DROP POLICY IF EXISTS "partners_select_approved" ON public.partners;
DROP POLICY IF EXISTS "partners_insert_self"     ON public.partners;
DROP POLICY IF EXISTS "partners_update_own"      ON public.partners;
CREATE POLICY "partners_select_approved" ON public.partners FOR SELECT USING (status = 'approved');
CREATE POLICY "partners_insert_self"     ON public.partners FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "partners_update_own"      ON public.partners FOR UPDATE USING (auth.uid() = owner_id);

-- SLOTS
DROP POLICY IF EXISTS "slots_select_open"    ON public.slots;
DROP POLICY IF EXISTS "slots_insert_partner" ON public.slots;
DROP POLICY IF EXISTS "slots_update_partner" ON public.slots;
CREATE POLICY "slots_select_open" ON public.slots
  FOR SELECT USING (status IN ('open','full'));
CREATE POLICY "slots_insert_partner" ON public.slots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_id AND owner_id = auth.uid())
  );
CREATE POLICY "slots_update_partner" ON public.slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_id AND owner_id = auth.uid())
  );

-- RESERVATIONS
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.partners WHERE id = partner_id AND owner_id = auth.uid())
);
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.partners WHERE id = partner_id AND owner_id = auth.uid())
);

-- REVIEWS
DROP POLICY IF EXISTS "reviews_select_visible" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own"     ON public.reviews;
CREATE POLICY "reviews_select_visible" ON public.reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "reviews_insert_own"     ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREDITS
DROP POLICY IF EXISTS "credits_select_own" ON public.credits;
CREATE POLICY "credits_select_own" ON public.credits FOR SELECT USING (auth.uid() = user_id);

-- COUPONS
DROP POLICY IF EXISTS "coupons_select_active"    ON public.coupons;
DROP POLICY IF EXISTS "user_coupons_select_own"  ON public.user_coupons;
CREATE POLICY "coupons_select_active"   ON public.coupons      FOR SELECT USING (is_active = TRUE);
CREATE POLICY "user_coupons_select_own" ON public.user_coupons FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 틈 트리 XP 자동 지급 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID, p_amount INT, p_type TEXT, p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE v_balance INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance FROM public.credits WHERE user_id = p_user_id;
  INSERT INTO public.credits (user_id, amount, balance, type, description, reference_id)
  VALUES (p_user_id, p_amount, v_balance + p_amount, p_type, p_description, p_reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_reservation_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'visited'  AND OLD.status IS DISTINCT FROM 'visited'  THEN
    PERFORM public.award_xp(NEW.user_id, 10, 'earn_visit',  '방문 완료 보상 (+10 XP)', NEW.id);
  END IF;
  IF NEW.status = 'no_show'  AND OLD.status IS DISTINCT FROM 'no_show'  THEN
    PERFORM public.award_xp(NEW.user_id, -20, 'no_show',    '노쇼 패널티 (-20 XP)',    NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER trg_reservation_xp
    AFTER UPDATE OF status ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_xp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.handle_review_xp()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.award_xp(NEW.user_id, 5, 'earn_review', '리뷰 작성 보상 (+5 XP)', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER trg_review_xp
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_review_xp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE VIEW public.user_xp_summary AS
SELECT
  user_id,
  GREATEST(0, COALESCE(SUM(amount), 0)) AS xp,
  CASE
    WHEN GREATEST(0, COALESCE(SUM(amount), 0)) >= 301 THEN 4
    WHEN GREATEST(0, COALESCE(SUM(amount), 0)) >= 151 THEN 3
    WHEN GREATEST(0, COALESCE(SUM(amount), 0)) >= 51  THEN 2
    ELSE 1
  END AS level,
  CASE
    WHEN GREATEST(0, COALESCE(SUM(amount), 0)) >= 301 THEN '숲'
    WHEN GREATEST(0, COALESCE(SUM(amount), 0)) >= 151 THEN '나무'
    WHEN GREATEST(0, COALESCE(SUM(amount), 0)) >= 51  THEN '새싹'
    ELSE '씨앗'
  END AS level_name
FROM public.credits
WHERE type IN ('earn_review','earn_visit','earn_referral','earn_event','no_show','admin_adjust')
GROUP BY user_id;

-- ============================================================
-- 완료! [Run] 버튼을 클릭하세요.
-- Storage > Buckets > review-images (Public) 도 생성해주세요.
-- ============================================================
