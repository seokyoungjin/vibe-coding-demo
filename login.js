import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCwEz9dolQp-xKnAXJW-URioX-PhRXxjws",
  authDomain: "vibe-coding-backend-demo.firebaseapp.com",
  projectId: "vibe-coding-backend-demo",
  storageBucket: "vibe-coding-backend-demo.firebasestorage.app",
  messagingSenderId: "1210264421",
  appId: "1:1210264421:web:1262a836ce7697cdf3cf8c",
  databaseURL:
    "https://vibe-coding-backend-demo-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

class LoginApp {
  constructor() {
    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.loginForm = document.getElementById("loginForm");
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.loginSubmitBtn = document.querySelector(".login-submit-btn");
    this.googleLoginBtn = document.getElementById("googleLoginBtn");
  }

  bindEvents() {
    this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    this.googleLoginBtn.addEventListener("click", () =>
      this.handleGoogleLogin()
    );
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;

    if (!email || !password) {
      this.showAlert("이메일과 비밀번호를 입력해주세요.", "error");
      return;
    }

    this.setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      this.showAlert("로그인 성공!", "success");

      // 로그인 성공 시 메인 페이지로 이동
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      console.error("로그인 오류:", error);
      this.handleAuthError(error);
    } finally {
      this.setLoading(false);
    }
  }

  async handleGoogleLogin() {
    this.setLoading(true, this.googleLoginBtn);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.showAlert("Google 로그인 성공!", "success");

      // 로그인 성공 시 메인 페이지로 이동
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      console.error("Google 로그인 오류:", error);
      this.handleAuthError(error);
    } finally {
      this.setLoading(false, this.googleLoginBtn);
    }
  }

  handleAuthError(error) {
    let message = "로그인에 실패했습니다.";

    switch (error.code) {
      case "auth/user-not-found":
        message = "존재하지 않는 계정입니다. 회원가입을 진행해주세요.";
        break;
      case "auth/wrong-password":
        message = "비밀번호가 올바르지 않습니다.";
        break;
      case "auth/invalid-email":
        message = "올바르지 않은 이메일 형식입니다.";
        break;
      case "auth/email-already-in-use":
        message = "이미 사용 중인 이메일입니다.";
        break;
      case "auth/weak-password":
        message = "비밀번호가 너무 약합니다. 6자 이상 입력해주세요.";
        break;
      case "auth/popup-closed-by-user":
        message = "로그인이 취소되었습니다.";
        break;
      default:
        message = error.message || "로그인 중 오류가 발생했습니다.";
    }

    this.showAlert(message, "error");
  }

  setLoading(isLoading, button = this.loginSubmitBtn) {
    if (isLoading) {
      button.classList.add("loading");
      button.disabled = true;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }

  showAlert(message, type = "info") {
    // 기존 알림 제거
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    // 새 알림 생성
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // 로그인 폼 위에 삽입
    this.loginForm.parentNode.insertBefore(alert, this.loginForm);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 3000);
  }
}

// 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new LoginApp();
});
