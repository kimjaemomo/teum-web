/**
 * booking.js — 예약 처리 로직 모듈
 */

/**
 * 예약 생성 (Firestore 트랜잭션으로 availableSlots 차감)
 * @param {string} dealId
 * @param {{ name: string, phone: string, visitTime: string, userId?: string, email?: string }} userInfo
 * @returns {Promise<string>} 예약 ID
 */
async function createBooking(dealId, userInfo) {
  const dealRef = db.collection('deals').doc(dealId);
  const bookingsRef = db.collection('bookings');

  // 트랜잭션: 슬롯 차감 + 예약 저장
  const bookingId = await db.runTransaction(async (transaction) => {
    const dealDoc = await transaction.get(dealRef);

    if (!dealDoc.exists) {
      throw new Error('해당 딜을 찾을 수 없습니다.');
    }

    const deal = dealDoc.data();

    if (deal.availableSlots <= 0 || deal.status !== 'active') {
      throw new Error('이미 마감된 딜입니다.');
    }

    // 유저의 누적 방문 횟수 조회
    let visitCount = 0;
    if (userInfo.userId) {
      const userDoc = await transaction.get(db.collection('users').doc(userInfo.userId));
      if (userDoc.exists) {
        visitCount = userDoc.data().visitCount || 0;
      }
    }

    // 새 예약 문서 ref
    const newBookingRef = bookingsRef.doc();

    // 예약 저장
    transaction.set(newBookingRef, {
      dealId,
      userId: userInfo.userId || '',
      userName: userInfo.name,
      userPhone: userInfo.phone,
      partnerName: deal.partnerName || '',
      dealTitle: deal.title || '',
      visitDate: deal.availableDate || '',
      visitTime: userInfo.visitTime || '',
      discountedPrice: deal.discountedPrice || 0,
      visitCount,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 딜 슬롯 차감 + bookingCount 증가
    transaction.update(dealRef, {
      availableSlots: firebase.firestore.FieldValue.increment(-1),
      bookingCount: firebase.firestore.FieldValue.increment(1)
    });

    return newBookingRef.id;
  });

  return bookingId;
}

/**
 * 유저의 예약 내역 실시간 구독
 * @param {string} userId
 * @param {function} callback
 * @returns unsubscribe function
 */
function getUserBookings(userId, callback) {
  return db.collection('bookings')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const bookings = [];
        snapshot.forEach(doc => {
          bookings.push({ id: doc.id, ...doc.data() });
        });
        callback(bookings, null);
      },
      (err) => {
        console.error('예약 내역 조회 오류:', err);
        callback([], err);
      }
    );
}

/**
 * 최근 예약 N건 (어드민용)
 * @param {number} limit
 * @param {function} callback
 * @returns unsubscribe function
 */
function getRecentBookings(limit, callback) {
  return db.collection('bookings')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .onSnapshot(
      (snapshot) => {
        const bookings = [];
        snapshot.forEach(doc => {
          bookings.push({ id: doc.id, ...doc.data() });
        });
        callback(bookings, null);
      },
      (err) => {
        console.error('최근 예약 조회 오류:', err);
        callback([], err);
      }
    );
}

/**
 * 예약 상태 변경 (어드민)
 * @param {string} bookingId
 * @param {'pending'|'confirmed'|'visited'|'noshow'|'cancelled'} status
 */
async function updateBookingStatus(bookingId, status) {
  await db.collection('bookings').doc(bookingId).update({ status });

  // visited 상태로 변경 시 유저 visitCount 증가
  if (status === 'visited') {
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (bookingDoc.exists) {
      const booking = bookingDoc.data();
      if (booking.userId) {
        const userRef = db.collection('users').doc(booking.userId);
        await userRef.update({
          visitCount: firebase.firestore.FieldValue.increment(1)
        });
        // 틈 트리 레벨 업데이트
        await updateTreeLevel(booking.userId);
      }
    }
  }

  // noshow 상태 시 유저 noShowCount 증가
  if (status === 'noshow') {
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (bookingDoc.exists) {
      const booking = bookingDoc.data();
      if (booking.userId) {
        await db.collection('users').doc(booking.userId).update({
          noShowCount: firebase.firestore.FieldValue.increment(1)
        });
      }
    }
  }
}

/**
 * 유저 틈 트리 레벨 업데이트
 * @param {string} userId
 */
async function updateTreeLevel(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return;

  const { visitCount } = userDoc.data();
  let treeLv = 1;
  if (visitCount >= 10) treeLv = 3;
  else if (visitCount >= 3) treeLv = 2;

  await db.collection('users').doc(userId).update({ treeLv });
}

/**
 * 예약 상태 한글 레이블
 */
const BOOKING_STATUS_LABELS = {
  pending: '대기중',
  confirmed: '확정',
  visited: '방문완료',
  noshow: '노쇼',
  cancelled: '취소'
};

/**
 * 예약 상태 배지 CSS 클래스
 */
const BOOKING_STATUS_CLASS = {
  pending: 'booking-status-pending',
  confirmed: 'booking-status-confirmed',
  visited: 'booking-status-visited',
  noshow: 'booking-status-noshow',
  cancelled: 'booking-status-cancelled'
};

/**
 * 전화번호 형식 검증 (010-XXXX-XXXX)
 * @param {string} phone
 * @returns {boolean}
 */
function validatePhone(phone) {
  return /^010-\d{4}-\d{4}$/.test(phone.trim());
}

/**
 * 전화번호 자동 포맷 (숫자만 입력 시 010-XXXX-XXXX 형식으로)
 * @param {string} value
 * @returns {string}
 */
function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

// 전역 노출
window.createBooking = createBooking;
window.getUserBookings = getUserBookings;
window.getRecentBookings = getRecentBookings;
window.updateBookingStatus = updateBookingStatus;
window.BOOKING_STATUS_LABELS = BOOKING_STATUS_LABELS;
window.BOOKING_STATUS_CLASS = BOOKING_STATUS_CLASS;
window.validatePhone = validatePhone;
window.formatPhone = formatPhone;
