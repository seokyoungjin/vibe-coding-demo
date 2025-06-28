import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
  update,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Your web app's Firebase configuration
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

// Initialize Firebase
const firebaseapp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseapp);
const auth = getAuth(firebaseapp);
class TodoApp {
  constructor() {
    this.todos = [];
    this.todoToDelete = null;
    this.currentUser = null;
    this.todosRef = null;

    this.initializeElements();
    this.bindEvents();
    this.addTodoEventListeners(); // 한 번만 연결
    this.initializeAuth();
  }

  initializeElements() {
    // Form elements
    this.todoInput = document.getElementById("todoInput");
    this.addBtn = document.getElementById("addTodo");

    // Header elements
    this.loginBtn = document.getElementById("loginBtn");
    this.userInfo = document.getElementById("userInfo");
    this.userName = document.getElementById("userName");
    this.logoutBtn = document.getElementById("logoutBtn");

    // Display elements
    this.todoList = document.getElementById("todoList");

    // Modal elements
    this.deleteModal = document.getElementById("deleteModal");
    this.confirmDeleteBtn = document.getElementById("confirmDelete");
    this.cancelDeleteBtn = document.getElementById("cancelDelete");
  }

  bindEvents() {
    // Form events
    this.addBtn.addEventListener("click", () => this.addTodo());
    this.todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTodo();
      }
    });

    // Header events
    this.loginBtn.addEventListener("click", () => this.goToLogin());
    this.logoutBtn.addEventListener("click", () => this.logout());

    // Modal events
    this.confirmDeleteBtn.addEventListener("click", () => this.confirmDelete());
    this.cancelDeleteBtn.addEventListener("click", () =>
      this.hideDeleteModal()
    );

    // Keyboard events
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideDeleteModal();
      }
    });

    // Modal background click
    this.deleteModal.addEventListener("click", (e) => {
      if (e.target === this.deleteModal) {
        this.hideDeleteModal();
      }
    });
  }

  async addTodo() {
    if (!this.currentUser) {
      this.showNotification("로그인이 필요합니다.", "error");
      return;
    }

    const text = this.todoInput.value.trim();

    if (!text) {
      this.showNotification("할 일을 입력해주세요.", "error");
      return;
    }

    const todo = {
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
      author: {
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        displayName: this.currentUser.displayName || this.currentUser.email,
        photoURL: this.currentUser.photoURL || null,
      },
    };

    try {
      // Firebase에 새로운 할 일 추가
      await push(this.todosRef, todo);
      this.todoInput.value = "";
      this.showNotification("할 일이 추가되었습니다.", "success");
      console.log("할 일 추가 완료:", todo);
    } catch (error) {
      console.error("할 일 추가 중 오류:", error);
      this.showNotification("할 일 추가에 실패했습니다.", "error");
    }
  }

  async toggleTodo(id) {
    if (!this.currentUser) {
      this.showNotification("로그인이 필요합니다.", "error");
      return;
    }

    try {
      const todoRef = ref(
        database,
        `users/${this.currentUser.uid}/todos/${id}`
      );
      const todo = this.todos.find((t) => t.id === id);
      if (!todo) return;

      await update(todoRef, {
        completed: !todo.completed,
      });

      console.log("할 일 상태 변경 완료:", id, !todo.completed);
    } catch (error) {
      console.error("할 일 상태 변경 중 오류:", error);
      this.showNotification("상태 변경에 실패했습니다.", "error");
    }
  }

  deleteTodo(id) {
    this.todoToDelete = id;
    this.showDeleteModal();
  }

  async confirmDelete() {
    if (!this.todoToDelete || !this.currentUser) return;

    try {
      const todoRef = ref(
        database,
        `users/${this.currentUser.uid}/todos/${this.todoToDelete}`
      );
      await remove(todoRef);
      this.hideDeleteModal();
      this.showNotification("할 일이 삭제되었습니다.", "success");
      console.log("할 일 삭제 완료:", this.todoToDelete);
      this.todoToDelete = null;
    } catch (error) {
      console.error("할 일 삭제 중 오류:", error);
      this.showNotification("할 일 삭제에 실패했습니다.", "error");
    }
  }

  loadTodosFromFirebase() {
    if (!this.todosRef) {
      console.log("todosRef가 없습니다.");
      return;
    }

    console.log("Firebase 데이터 로드 시작:", this.todosRef.toString());

    // Firebase에서 실시간으로 데이터 로드
    onValue(
      this.todosRef,
      (snapshot) => {
        console.log("Firebase 데이터 업데이트:", snapshot.val());
        const data = snapshot.val();
        if (data) {
          // Firebase 데이터를 배열로 변환 (key를 id로 사용)
          this.todos = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          // 생성일 기준으로 최신순 정렬
          this.todos.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          console.log("정렬된 할일 목록:", this.todos);
        } else {
          this.todos = [];
          console.log("할일 목록이 비어있습니다.");
        }
        this.renderTodos();
      },
      (error) => {
        console.error("데이터 로드 중 오류:", error);
        this.showNotification("데이터 로드에 실패했습니다.", "error");
      }
    );
  }

  renderTodos() {
    if (this.todos.length === 0) {
      const emptyMessage = this.currentUser
        ? "새로운 할 일을 추가해보세요!"
        : "로그인하여 할 일을 관리하세요!";

      this.todoList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <h3>할 일이 없습니다</h3>
          <p>${emptyMessage}</p>
        </div>
      `;
      return;
    }

    this.todoList.innerHTML = this.todos
      .map((todo) => {
        const createdDate = new Date(todo.createdAt).toLocaleDateString(
          "ko-KR"
        );
        const createdTime = new Date(todo.createdAt).toLocaleTimeString(
          "ko-KR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        return `
          <div class="todo-item ${
            todo.completed ? "completed" : ""
          }" data-id="${todo.id}">
            <input 
              type="checkbox" 
              class="todo-checkbox" 
              ${todo.completed ? "checked" : ""}
              data-id="${todo.id}"
            >
            <div class="todo-content">
              <span class="todo-text">${todo.text}</span>
              <div class="todo-meta">
                <span class="todo-date">
                  <i class="fas fa-clock"></i>
                  ${createdDate} ${createdTime}
                </span>
              </div>
            </div>
            <div class="todo-actions">
              <button class="action-btn delete-btn" data-id="${
                todo.id
              }" title="삭제">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  addTodoEventListeners() {
    // 이벤트 위임 방식으로 변경하여 더 안정적으로 처리
    this.todoList.addEventListener("change", (e) => {
      if (e.target.classList.contains("todo-checkbox")) {
        const todoId = e.target.getAttribute("data-id");
        console.log("체크박스 클릭:", todoId);
        if (todoId) {
          this.toggleTodo(todoId);
        }
      }
    });

    this.todoList.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) {
        e.preventDefault();
        e.stopPropagation();
        const deleteBtn = e.target.closest(".delete-btn");
        const todoId = deleteBtn.getAttribute("data-id");
        console.log("삭제 버튼 클릭:", todoId);
        if (todoId) {
          this.deleteTodo(todoId);
        }
      }
    });
  }

  showDeleteModal() {
    this.deleteModal.style.display = "block";
  }

  hideDeleteModal() {
    this.deleteModal.style.display = "none";
    this.todoToDelete = null;
  }

  initializeAuth() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.updateAuthUI();

      if (user) {
        // 사용자별 할 일 참조 설정
        this.todosRef = ref(database, `users/${user.uid}/todos`);
        this.loadTodosFromFirebase();
      } else {
        // 로그인하지 않은 경우 빈 상태 표시
        this.todos = [];
        this.renderTodos();
      }
    });
  }

  updateAuthUI() {
    if (this.currentUser) {
      // 로그인된 상태
      this.loginBtn.style.display = "none";
      this.userInfo.style.display = "flex";
      this.userName.textContent =
        this.currentUser.displayName || this.currentUser.email;
    } else {
      // 로그인되지 않은 상태
      this.loginBtn.style.display = "flex";
      this.userInfo.style.display = "none";
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.showNotification("로그아웃되었습니다.", "success");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      this.showNotification("로그아웃에 실패했습니다.", "error");
    }
  }

  goToLogin() {
    window.location.href = "login.html";
  }

  showNotification(message, type = "info") {
    // 기존 알림이 있다면 제거
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    // 스타일 추가
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);

    // 애니메이션 CSS 추가 (한 번만)
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .notification-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "fa-check-circle";
      case "error":
        return "fa-exclamation-circle";
      case "warning":
        return "fa-exclamation-triangle";
      default:
        return "fa-info-circle";
    }
  }

  getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#48bb78";
      case "error":
        return "#f56565";
      case "warning":
        return "#ed8936";
      default:
        return "#4299e1";
    }
  }
}

// 앱 초기화
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new TodoApp();
  // 전역 변수로 노출 (디버깅용)
  window.app = app;
});
