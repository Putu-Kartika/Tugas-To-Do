document.addEventListener('DOMContentLoaded', () => {
  // ----- Elemen DOM -----
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const notesInput = document.getElementById('todo-notes');
  const list = document.getElementById('todo-list');
  const errorMessage = document.getElementById('error-message');
  const emptyMsg = document.getElementById('empty-msg');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const clearAllBtn = document.getElementById('clear-all');
  const addBtn = document.getElementById('add-btn');

  // ----- Storage key & state -----
  const STORAGE_KEY = 'todo_items_v1';
  let items = loadFromStorage();

  // ----- Initial render -----
  renderList();
  updateProgressBar();

  // ----- Tombol Tambah -----
  addBtn.addEventListener('click', () => {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });

  // ----- Form submit: add new todo -----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();

    if (!text) {
      showError('Nama tugas tidak boleh kosong!');
      showToast("❗ Tugas tidak boleh kosong!", "error");
      return;
    }
    hideError();

    const notes = notesInput.value.trim();

    const item = {
      id: Date.now().toString(),
      text,
      notes: notes || "",
      completed: false
    };

    items.push(item);
    saveToStorage(items);
    appendItemToDOM(item);
    updateProgressBar();

    showToast("➕ Tugas berhasil ditambahkan!", "success");

    input.value = '';
    notesInput.value = '';
    input.focus();
  });

  // ----- Event delegation for list (complete / delete) -----
  list.addEventListener('click', (e) => {
    const target = e.target;

    // COMPLETE button
    if (target.matches('.btn.complete')) {
      const li = target.closest('li');
      if (!li) return;
      const id = li.dataset.id;
      toggleComplete(id, li);
      return;
    }

    // DELETE button
    if (target.matches('.btn.delete')) {
      const li = target.closest('li');
      if (!li) return;
      const id = li.dataset.id;
      deleteItem(id, li);
      return;
    }
  });

  // ----- Clear completed -----
  clearCompletedBtn.addEventListener('click', () => {
    items = items.filter(i => !i.completed);
    saveToStorage(items);
    renderList();
    updateProgressBar();

    showToast("🧹 Tugas selesai dibersihkan!", "success");
  });

  // ----- Clear all (confirm) -----
  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Yakin ingin menghapus semua tugas?')) return;

    items = [];
    saveToStorage(items);
    renderList();
    updateProgressBar();

    showToast("🗑️ Semua tugas dihapus.", "warning");
  });

  // ----- Functions -----
  function createListItem(item) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (item.completed ? ' completed' : '');
    li.dataset.id = item.id;

    // Judul
    const title = document.createElement('div');
    title.className = 'text';
    title.textContent = item.text;

    // Catatan
    const notesBox = document.createElement('div');
    notesBox.className = "notes-box";
    notesBox.style.display = "none";
    notesBox.innerHTML = `
      <div class="notes-title">Catatan:</div>
      <div class="notes-content">${item.notes || "(Tidak ada catatan)"}</div>
    `;

    // Toggle detail
    const toggleBtn = document.createElement('button');
    toggleBtn.className = "btn toggle";
    toggleBtn.textContent = "Detail ▼";
    toggleBtn.addEventListener('click', () => {
      const show = notesBox.style.display === "none";
      notesBox.style.display = show ? "block" : "none";
      toggleBtn.textContent = show ? "Detail ▲" : "Detail ▼";
    });

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'actions';

    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.className = 'btn complete';
    completeBtn.textContent = item.completed ? 'Batal' : 'Selesai';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn delete';
    delBtn.textContent = 'Hapus';

    actions.appendChild(toggleBtn);
    actions.appendChild(completeBtn);
    actions.appendChild(delBtn);

    li.appendChild(title);
    li.appendChild(notesBox);
    li.appendChild(actions);

    return li;
  }

  function appendItemToDOM(item) {
    const li = createListItem(item);
    list.appendChild(li);
    updateEmptyState();
  }

  function renderList() {
    list.innerHTML = '';

    if (!items.length) {
      updateEmptyState();
      updateProgressBar();
      return;
    }

    items.forEach(item => {
      const li = createListItem(item);
      list.appendChild(li);
    });

    updateEmptyState();
    updateProgressBar();
  }

  function toggleComplete(id, liElement) {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;

    items[idx].completed = !items[idx].completed;
    saveToStorage(items);
    updateProgressBar();

    if (items[idx].completed) {
      liElement.classList.add('completed');
      liElement.querySelector('.btn.complete').textContent = 'Batal';
      showToast("✔️ Tugas ditandai selesai!", "success");
    } else {
      liElement.classList.remove('completed');
      liElement.querySelector('.btn.complete').textContent = 'Selesai';
      showToast("🔄 Tugas dibatalkan!", "warning");
    }
  }

  function deleteItem(id, liElement) {
    items = items.filter(i => i.id !== id);
    saveToStorage(items);
    liElement.remove();
    updateEmptyState();
    updateProgressBar();
    showToast("🗑️ Tugas dihapus.", "warning");
  }

  function updateEmptyState() {
    emptyMsg.style.display = items.length ? 'none' : 'block';
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    input.focus();
  }

  function hideError() {
    errorMessage.textContent = '';
  }

  // Storage
  function saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('localStorage error', err);
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function updateProgressBar() {
    const done = items.filter(i => i.completed).length;
    const total = items.length;
    const percent = total === 0 ? 0 : (done / total) * 100;

    document.querySelector(".progress-text").textContent =
      `${done} dari ${total} selesai`;

    document.querySelector(".progress-fill").style.width = percent + "%";
  }
});

// ===========================
//     TOAST NOTIFICATION
// ===========================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.classList.add("toast");

  if (type === "success") toast.classList.add("toast-success");
  if (type === "error") toast.classList.add("toast-error");
  if (type === "warning") toast.classList.add("toast-warning");

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "fadeOut 0.5s forwards";
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}
