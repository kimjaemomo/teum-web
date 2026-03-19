/**
 * deals.js — 딜 Firestore CRUD 모듈
 */

/**
 * 활성 딜 실시간 구독 (onSnapshot)
 * status === "active" && expiresAt > now
 * @param {string|null} category — null이면 전체
 * @param {function} callback — 딜 배열 콜백
 * @returns unsubscribe function
 */
function getActiveDeals(category, callback) {
  const now = firebase.firestore.Timestamp.now();
  let query = db.collection('deals')
    .where('status', '==', 'active')
    .where('expiresAt', '>', now)
    .orderBy('expiresAt', 'asc');

  if (category && category !== 'all') {
    query = db.collection('deals')
      .where('status', '==', 'active')
      .where('expiresAt', '>', now)
      .where('category', '==', category)
      .orderBy('expiresAt', 'asc');
  }

  return query.onSnapshot(
    (snapshot) => {
      const deals = [];
      snapshot.forEach(doc => {
        deals.push({ id: doc.id, ...doc.data() });
      });
      callback(deals, null);
    },
    (err) => {
      console.error('딜 조회 오류:', err);
      callback([], err);
    }
  );
}

/**
 * 모든 딜 조회 (어드민용)
 * @param {function} callback
 * @returns unsubscribe function
 */
function getAllDeals(callback) {
  return db.collection('deals')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const deals = [];
        snapshot.forEach(doc => {
          deals.push({ id: doc.id, ...doc.data() });
        });
        callback(deals, null);
      },
      (err) => {
        console.error('딜 전체 조회 오류:', err);
        callback([], err);
      }
    );
}

/**
 * 딜 등록 (어드민)
 * @param {Object} dealData
 * @returns {Promise<string>} 새 딜 ID
 */
async function createDeal(dealData) {
  const now = firebase.firestore.FieldValue.serverTimestamp();

  // 할인율 자동 계산
  const discountRate = dealData.originalPrice > 0
    ? Math.round((1 - dealData.discountedPrice / dealData.originalPrice) * 100)
    : 0;

  const data = {
    ...dealData,
    discountRate,
    bookingCount: 0,
    createdAt: now,
    // expiresAt이 string이면 Timestamp로 변환
    expiresAt: dealData.expiresAt instanceof Date
      ? firebase.firestore.Timestamp.fromDate(dealData.expiresAt)
      : dealData.expiresAt
  };

  const ref = await db.collection('deals').add(data);
  return ref.id;
}

/**
 * 딜 상태 변경 (어드민)
 * @param {string} dealId
 * @param {'active'|'closed'|'draft'} status
 */
async function updateDealStatus(dealId, status) {
  await db.collection('deals').doc(dealId).update({ status });
}

/**
 * 딜 마감 처리 — availableSlots=0, status="closed"
 * @param {string} dealId
 */
async function closeDeal(dealId) {
  await db.collection('deals').doc(dealId).update({
    availableSlots: 0,
    status: 'closed'
  });
}

/**
 * 딜 삭제 (어드민)
 * @param {string} dealId
 */
async function deleteDeal(dealId) {
  await db.collection('deals').doc(dealId).delete();
}

/**
 * 카테고리 한글 레이블
 */
const CATEGORY_LABELS = {
  hair: '헤어·뷰티',
  nail: '네일',
  skin: '피부관리',
  fitness: '피트니스',
  space: '공간대여'
};

/**
 * 카테고리 이모지
 */
const CATEGORY_EMOJI = {
  hair: '✂️',
  nail: '💅',
  skin: '✨',
  fitness: '🏋️',
  space: '🏠'
};

/**
 * 딜 카드 HTML 생성
 * @param {Object} deal
 * @returns {string} HTML string
 */
function renderDealCard(deal) {
  const isClosed = deal.availableSlots <= 0 || deal.status !== 'active';
  const categoryLabel = CATEGORY_LABELS[deal.category] || deal.category;
  const categoryEmoji = CATEGORY_EMOJI[deal.category] || '🏪';

  const imageHtml = deal.imageUrl
    ? `<img src="${escapeHtml(deal.imageUrl)}" alt="${escapeHtml(deal.title)}" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="deal-card-image-placeholder">${categoryEmoji}</div>`;

  const discountRateHtml = deal.discountRate
    ? `<span class="deal-card-discount-rate">${deal.discountRate}% 할인</span>`
    : '';

  const slotsHtml = deal.availableSlots > 0
    ? `<span class="badge badge-warm">${deal.availableSlots}자리 남음</span>`
    : `<span class="badge badge-danger">마감</span>`;

  const btnHtml = isClosed
    ? `<button class="btn btn-full" disabled>마감</button>`
    : `<button class="btn btn-primary btn-full" onclick="openBookingModal('${deal.id}')">예약하기</button>`;

  const dateStr = deal.availableDate || '';
  const timeStr = (deal.availableTimeStart && deal.availableTimeEnd)
    ? `${deal.availableTimeStart} ~ ${deal.availableTimeEnd}`
    : '';

  const originalPriceHtml = deal.originalPrice
    ? `<span class="deal-card-price-original">${deal.originalPrice.toLocaleString()}원</span>`
    : '';

  return `
    <div class="deal-card" data-deal-id="${deal.id}">
      <div class="deal-card-image">
        ${imageHtml}
        <div class="deal-card-badges">
          <span class="badge badge-forest">${categoryLabel}</span>
        </div>
        <div class="deal-card-slots">${slotsHtml}</div>
      </div>
      <div class="deal-card-body">
        <div class="deal-card-partner">
          <span>🏪</span>
          <span>${escapeHtml(deal.partnerName || '')}</span>
          ${deal.location ? `<span>·</span><span>${escapeHtml(deal.location)}</span>` : ''}
        </div>
        <h3 class="deal-card-title">${escapeHtml(deal.title)}</h3>
        ${dateStr || timeStr ? `
        <div class="deal-card-time">
          <span>🕐</span>
          <span>${dateStr}${dateStr && timeStr ? ' ' : ''}${timeStr}</span>
        </div>` : ''}
        <div class="deal-card-price">
          <div>
            ${originalPriceHtml}
            <div class="deal-card-price-discounted">${(deal.discountedPrice || 0).toLocaleString()}원</div>
          </div>
          ${discountRateHtml}
        </div>
      </div>
      <div class="deal-card-footer">
        ${btnHtml}
      </div>
    </div>
  `;
}

/**
 * XSS 방지용 이스케이프
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 전역 노출
window.getActiveDeals = getActiveDeals;
window.getAllDeals = getAllDeals;
window.createDeal = createDeal;
window.updateDealStatus = updateDealStatus;
window.closeDeal = closeDeal;
window.deleteDeal = deleteDeal;
window.renderDealCard = renderDealCard;
window.CATEGORY_LABELS = CATEGORY_LABELS;
window.CATEGORY_EMOJI = CATEGORY_EMOJI;
window.escapeHtml = escapeHtml;
