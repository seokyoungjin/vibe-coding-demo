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
class TodoApp {
  constructor() {
    this.todos = [];
    this.todoToDelete = null;
    this.todosRef = ref(database, "todos");

    this.initializeElements();
    this.bindEvents();
    this.loadTodosFromFirebase();
  }

  initializeElements() {
    // Form elements
    this.todoInput = document.getElementById("todoInput");
    this.addBtn = document.getElementById("addTodo");

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
    const text = this.todoInput.value.trim();

    if (!text) {
      this.showNotification("할 일을 입력해주세요.", "error");
      return;
    }

    const todo = {
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      // Firebase에 새로운 할 일 추가
      await push(this.todosRef, todo);
      this.todoInput.value = "";
      this.showNotification("할 일이 추가되었습니다.", "success");
    } catch (error) {
      console.error("할 일 추가 중 오류:", error);
      this.showNotification("할 일 추가에 실패했습니다.", "error");
    }
  }

  async toggleTodo(id) {
    try {
      const todoRef = ref(database, `todos/${id}`);
      const todo = this.todos.find((t) => t.id === id);
      if (!todo) return;

      await update(todoRef, {
        completed: !todo.completed,
      });
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
    if (!this.todoToDelete) return;

    try {
      const todoRef = ref(database, `todos/${this.todoToDelete}`);
      await remove(todoRef);
      this.hideDeleteModal();
      this.showNotification("할 일이 삭제되었습니다.", "success");
      this.todoToDelete = null;
    } catch (error) {
      console.error("할 일 삭제 중 오류:", error);
      this.showNotification("할 일 삭제에 실패했습니다.", "error");
    }
  }

  loadTodosFromFirebase() {
    // Firebase에서 실시간으로 데이터 로드
    onValue(
      this.todosRef,
      (snapshot) => {
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
        } else {
          this.todos = [];
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
      this.todoList.innerHTML = `
        <div class="empty-state">
          <p>할 일을 추가해보세요!</p>
        </div>
      `;
      return;
    }

    this.todoList.innerHTML = this.todos
      .map((todo) => {
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
            <span class="todo-text">${todo.text}</span>
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

    // 이벤트 리스너 추가
    this.addTodoEventListeners();
  }

  addTodoEventListeners() {
    // 체크박스 이벤트 리스너
    const checkboxes = this.todoList.querySelectorAll(".todo-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const todoId = e.target.getAttribute("data-id");
        if (todoId) {
          this.toggleTodo(todoId);
        }
      });
    });

    // 삭제 버튼 이벤트 리스너
    const deleteButtons = this.todoList.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const todoId = e.target.closest(".delete-btn").getAttribute("data-id");
        if (todoId) {
          this.deleteTodo(todoId);
        }
      });
    });
  }

  showDeleteModal() {
    this.deleteModal.style.display = "block";
  }

  hideDeleteModal() {
    this.deleteModal.style.display = "none";
    this.todoToDelete = null;
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
