class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    this.todoToDelete = null;

    this.initializeElements();
    this.bindEvents();
    this.renderTodos();
  }

  initializeElements() {
    // Form elements
    this.todoInput = document.getElementById("todoInput");
    this.addBtn = document.getElementById("addTodo");

    // Control elements
    this.clearAllBtn = document.getElementById("clearAll");

    // Display elements
    this.todoList = document.getElementById("todoList");

    // Modal elements
    this.deleteModal = document.getElementById("deleteModal");
    this.confirmDeleteBtn = document.getElementById("confirmDelete");
    this.cancelDeleteBtn = document.getElementById("cancelDelete");
    this.clearAllModal = document.getElementById("clearAllModal");
    this.confirmClearAllBtn = document.getElementById("confirmClearAll");
    this.cancelClearAllBtn = document.getElementById("cancelClearAll");
  }

  bindEvents() {
    // Form events
    this.addBtn.addEventListener("click", () => this.addTodo());
    this.todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTodo();
      }
    });

    // Control events
    this.clearAllBtn.addEventListener("click", () => this.showClearAllModal());

    // Modal events
    this.confirmDeleteBtn.addEventListener("click", () => this.confirmDelete());
    this.cancelDeleteBtn.addEventListener("click", () =>
      this.hideDeleteModal()
    );
    this.confirmClearAllBtn.addEventListener("click", () =>
      this.confirmClearAll()
    );
    this.cancelClearAllBtn.addEventListener("click", () =>
      this.hideClearAllModal()
    );

    // Keyboard events
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideDeleteModal();
        this.hideClearAllModal();
      }
    });

    // Modal background click
    this.deleteModal.addEventListener("click", (e) => {
      if (e.target === this.deleteModal) {
        this.hideDeleteModal();
      }
    });

    this.clearAllModal.addEventListener("click", (e) => {
      if (e.target === this.clearAllModal) {
        this.hideClearAllModal();
      }
    });
  }

  addTodo() {
    const text = this.todoInput.value.trim();

    if (!text) {
      this.showNotification("할 일을 입력해주세요.", "error");
      return;
    }

    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.todos.unshift(todo);
    this.saveTodos();
    this.todoInput.value = "";
    this.renderTodos();
    this.showNotification("할 일이 추가되었습니다.", "success");
  }

  toggleTodo(id) {
    const todoIndex = this.todos.findIndex((t) => t.id === id);
    if (todoIndex === -1) return;

    this.todos[todoIndex].completed = !this.todos[todoIndex].completed;
    this.saveTodos();
    this.renderTodos();
  }

  deleteTodo(id) {
    this.todoToDelete = id;
    this.showDeleteModal();
  }

  confirmDelete() {
    if (!this.todoToDelete) return;

    this.todos = this.todos.filter((t) => t.id !== this.todoToDelete);
    this.saveTodos();
    this.renderTodos();
    this.hideDeleteModal();
    this.showNotification("할 일이 삭제되었습니다.", "success");

    this.todoToDelete = null;
  }

  confirmClearAll() {
    this.todos = [];
    this.saveTodos();
    this.renderTodos();
    this.hideClearAllModal();
    this.showNotification("모든 할 일이 삭제되었습니다.", "success");
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
          <div class="todo-item ${todo.completed ? "completed" : ""}">
            <input 
              type="checkbox" 
              class="todo-checkbox" 
              ${todo.completed ? "checked" : ""}
              onchange="app.toggleTodo(${todo.id})"
            >
            <span class="todo-text">${todo.text}</span>
            <button class="delete-btn" onclick="app.deleteTodo(${
              todo.id
            })" title="삭제">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
      })
      .join("");
  }

  saveTodos() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  showDeleteModal() {
    this.deleteModal.style.display = "block";
  }

  hideDeleteModal() {
    this.deleteModal.style.display = "none";
    this.todoToDelete = null;
  }

  showClearAllModal() {
    if (this.todos.length === 0) {
      this.showNotification("삭제할 할 일이 없습니다.", "info");
      return;
    }
    this.clearAllModal.style.display = "block";
  }

  hideClearAllModal() {
    this.clearAllModal.style.display = "none";
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
});
