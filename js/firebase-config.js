/**
 * Firebase 설정 파일
 * ==================
 * 아래 placeholder 값들을 Firebase Console에서 발급받은 실제 값으로 교체하세요.
 * Firebase Console: https://console.firebase.google.com/
 *   1. 프로젝트 선택 → 프로젝트 설정(⚙️) → 일반 탭
 *   2. "내 앱" 섹션에서 웹 앱 등록 후 아래 설정 값 복사
 *
 * 교체해야 할 항목:
 *   - apiKey: Firebase API 키
 *   - authDomain: 인증 도메인 (프로젝트ID.firebaseapp.com)
 *   - projectId: Firebase 프로젝트 ID
 *   - storageBucket: 스토리지 버킷 (프로젝트ID.appspot.com)
 *   - messagingSenderId: Cloud Messaging 발신자 ID
 *   - appId: 웹 앱 ID
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 앱 초기화
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Firestore 오프라인 퍼시스턴스 활성화 (선택사항)
// db.enablePersistence().catch(err => console.warn('Persistence error:', err));

// 전역 노출 (다른 모듈에서 사용)
window.db = db;
window.auth = auth;
