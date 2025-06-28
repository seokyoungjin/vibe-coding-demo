import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
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

class SignupApp {
  constructor() {
    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.signupForm = document.getElementById("signupForm");
    this.userNameInput = document.getElementById("userName");
    this.emailInput = document.getElementById("signupEmail");
    this.passwordInput = document.getElementById("signupPassword");
    this.confirmPasswordInput = document.getElementById("confirmPassword");
    this.signupSubmitBtn = document.querySelector(".login-submit-btn");
    this.googleSignupBtn = document.getElementById("googleSignupBtn");
  }

  bindEvents() {
    this.signupForm.addEventListener("submit", (e) => this.handleSignup(e));
    this.googleSignupBtn.addEventListener("click", () =>
      this.handleGoogleSignup()
    );
  }

  async handleSignup(e) {
    e.preventDefault();

    const userName = this.userNameInput.value.trim();
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;

    // 유효성 검사
    if (!this.validateForm(userName, email, password, confirmPassword)) {
      return;
    }

    this.setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 사용자 프로필 업데이트 (입력받은 이름 사용)
      await updateProfile(userCredential.user, {
        displayName: userName,
      });

      this.showAlert("회원가입이 완료되었습니다!", "success");

      // 회원가입 성공 시 메인 페이지로 이동
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      console.error("회원가입 오류:", error);
      this.handleAuthError(error);
    } finally {
      this.setLoading(false);
    }
  }

  async handleGoogleSignup() {
    this.setLoading(true, this.googleSignupBtn);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.showAlert("Google 계정으로 가입되었습니다!", "success");

      // 회원가입 성공 시 메인 페이지로 이동
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      console.error("Google 회원가입 오류:", error);
      this.handleAuthError(error);
    } finally {
      this.setLoading(false, this.googleSignupBtn);
    }
  }

  validateForm(userName, email, password, confirmPassword) {
    // 이름 검사
    if (!userName) {
      this.showAlert("이름을 입력해주세요.", "error");
      return false;
    }

    if (userName.length < 2) {
      this.showAlert("이름은 2자 이상이어야 합니다.", "error");
      return false;
    }

    // 이메일 검사
    if (!email) {
      this.showAlert("이메일을 입력해주세요.", "error");
      return false;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showAlert("올바른 이메일 형식이 아닙니다.", "error");
      return false;
    }

    // 비밀번호 검사
    if (!password) {
      this.showAlert("비밀번호를 입력해주세요.", "error");
      return false;
    }

    if (password.length < 6) {
      this.showAlert("비밀번호는 6자 이상이어야 합니다.", "error");
      return false;
    }

    // 비밀번호 확인 검사
    if (!confirmPassword) {
      this.showAlert("비밀번호 확인을 입력해주세요.", "error");
      return false;
    }

    if (password !== confirmPassword) {
      this.showAlert("비밀번호가 일치하지 않습니다.", "error");
      return false;
    }

    return true;
  }

  handleAuthError(error) {
    let message = "회원가입에 실패했습니다.";

    switch (error.code) {
      case "auth/email-already-in-use":
        message = "이미 사용 중인 이메일입니다. 로그인을 시도해보세요.";
        break;
      case "auth/invalid-email":
        message = "올바르지 않은 이메일 형식입니다.";
        break;
      case "auth/weak-password":
        message =
          "비밀번호가 너무 약합니다. 6자 이상의 강한 비밀번호를 사용해주세요.";
        break;
      case "auth/popup-closed-by-user":
        message = "회원가입이 취소되었습니다.";
        break;
      case "auth/account-exists-with-different-credential":
        message = "이미 다른 방법으로 가입된 계정입니다.";
        break;
      default:
        message = error.message || "회원가입 중 오류가 발생했습니다.";
    }

    this.showAlert(message, "error");
  }

  setLoading(isLoading, button = this.signupSubmitBtn) {
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

    // 회원가입 폼 위에 삽입
    this.signupForm.parentNode.insertBefore(alert, this.signupForm);

    // 자동 제거 (성공 메시지는 더 오래 표시)
    const timeout = type === "success" ? 5000 : 3000;
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, timeout);
  }
}

// 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new SignupApp();
});
