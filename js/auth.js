/**
 * auth.js — 틈(TEUM) 인증 모듈
 * Firebase Google 로그인/로그아웃 공통 로직
 */

const ADMIN_EMAIL = 'teum.offical@gmail.com';

/**
 * 현재 로그인한 유저를 반환합니다.
 * @returns {firebase.User|null}
 */
function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Google 팝업 로그인
 * 성공 시 Firestore users 컬렉션에 upsert
 */
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    await upsertUser(user);
    return user;
  } catch (err) {
    console.error('Google 로그인 오류:', err);
    showToast('로그인 중 오류가 발생했습니다.', 'error');
    throw err;
  }
}

/**
 * 로그아웃 후 index.html로 리다이렉트
 */
async function signOut() {
  try {
    await auth.signOut();
    window.location.href = '/index.html';
  } catch (err) {
    console.error('로그아웃 오류:', err);
  }
}

/**
 * Firestore users 컬렉션에 유저 정보 upsert
 */
async function upsertUser(user) {
  const userRef = db.collection('users').doc(user.uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    await userRef.set({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || '',
      visitCount: 0,
      noShowCount: 0,
      treeLv: 1,
      isBlocked: false,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // 이름·이메일 업데이트
    await userRef.update({
      displayName: user.displayName || snap.data().displayName,
      email: user.email || snap.data().email
    });
  }
}

/**
 * 틈 트리 레벨 계산
 * @param {number} visitCount
 * @returns {{ lv: number, name: string, emoji: string, nextTarget: number }}
 */
function getTreeLevel(visitCount) {
  if (visitCount >= 10) {
    return { lv: 3, name: '숲의 수호자', emoji: '🌳', nextTarget: null };
  } else if (visitCount >= 3) {
    return { lv: 2, name: '잎새', emoji: '🌿', nextTarget: 10 };
  } else {
    return { lv: 1, name: '새싹', emoji: '🌱', nextTarget: 3 };
  }
}

/**
 * 네비게이션 로그인 버튼 상태 업데이트
 * @param {firebase.User|null} user
 */
function updateNavAuth(user) {
  const loginBtn = document.getElementById('nav-login-btn');
  const userArea = document.getElementById('nav-user-area');
  const userName = document.getElementById('nav-user-name');
  const mobileLoginBtn = document.getElementById('mobile-nav-login-btn');
  const mobileUserArea = document.getElementById('mobile-nav-user-area');

  if (user) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userArea) userArea.classList.remove('hidden');
    if (userName) userName.textContent = user.displayName ? user.displayName.split(' ')[0] + '님' : '내 계정';
    if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
    if (mobileUserArea) mobileUserArea.classList.remove('hidden');
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userArea) userArea.classList.add('hidden');
    if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
    if (mobileUserArea) mobileUserArea.classList.add('hidden');
  }
}

/**
 * 모든 페이지에서 호출 — 로그인 상태 감지 및 UI 초기화
 * @param {{ requireAuth?: boolean, adminOnly?: boolean, onUser?: function }} options
 */
function initAuth(options = {}) {
  auth.onAuthStateChanged(async (user) => {
    updateNavAuth(user);

    if (options.requireAuth && !user) {
      window.location.href = '/index.html';
      return;
    }

    if (options.adminOnly) {
      if (!user || user.email !== ADMIN_EMAIL) {
        window.location.href = '/index.html';
        return;
      }
    }

    if (options.onUser) {
      options.onUser(user);
    }
  });
}

/**
 * 햄버거 메뉴 토글 초기화
 */
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
}

/**
 * 토스트 메시지 표시
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration ms
 */
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// 전역 노출
window.getCurrentUser = getCurrentUser;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.initAuth = initAuth;
window.initHamburger = initHamburger;
window.showToast = showToast;
window.getTreeLevel = getTreeLevel;
window.ADMIN_EMAIL = ADMIN_EMAIL;

// 로그인 버튼 이벤트 자동 바인딩
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();

  // 로그인 버튼
  document.querySelectorAll('[data-action="login"]').forEach(el => {
    el.addEventListener('click', signInWithGoogle);
  });

  // 로그아웃 버튼
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', signOut);
  });
});
