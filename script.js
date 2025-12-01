/* script.js
   To-Do List Interaktif
   - Add, Complete (toggle), Delete
   - Persist to localStorage
   - DOM traversal via closest / appendChild / querySelector
*/

document.addEventListener('DOMContentLoaded', () => {
  // ----- Elemen DOM -----
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const errorMessage = document.getElementById('error-message');
  const emptyMsg = document.getElementById('empty-msg');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const clearAllBtn = document.getElementById('clear-all');

  // ----- Storage key & state -----
  const STORAGE_KEY = 'todo_items_v1';
  let items = loadFromStorage(); // array of {id, text, completed}

  // ----- Initial render -----
  renderList();

  // ----- Form submit: add new todo -----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();

    if (!text) {
      showError('Nama tugas tidak boleh kosong!');
      return;
    }
    hideError();

    const item = {
      id: Date.now().toString(),
      text,
      completed: false
    };
    items.push(item);
    saveToStorage(items);
    appendItemToDOM(item);
    input.value = '';
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
  });

  // ----- Clear all (confirm) -----
  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Yakin ingin menghapus semua tugas?')) return;
    items = [];
    saveToStorage(items);
    renderList();
  });

  // ----- Functions -----
  function createListItem(item) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (item.completed ? ' completed' : '');
    li.dataset.id = item.id;

    const span = document.createElement('div');
    span.className = 'text';
    span.textContent = item.text;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.className = 'btn complete';
    completeBtn.textContent = item.completed ? 'Batal' : 'Selesai';
    completeBtn.setAttribute('aria-pressed', String(item.completed));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn delete';
    delBtn.textContent = 'Hapus';

    actions.appendChild(completeBtn);
    actions.appendChild(delBtn);

    li.appendChild(span);
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
      return;
    }
    items.forEach(item => {
      const li = createListItem(item);
      list.appendChild(li);
    });
    updateEmptyState();
  }

  function toggleComplete(id, liElement) {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].completed = !items[idx].completed;
    saveToStorage(items);
    // update DOM
    if (items[idx].completed) {
      liElement.classList.add('completed');
      liElement.querySelector('.btn.complete').textContent = 'Batal';
      liElement.querySelector('.btn.complete').setAttribute('aria-pressed', 'true');
    } else {
      liElement.classList.remove('completed');
      liElement.querySelector('.btn.complete').textContent = 'Selesai';
      liElement.querySelector('.btn.complete').setAttribute('aria-pressed', 'false');
    }
  }

  function deleteItem(id, liElement) {
    // remove from state
    items = items.filter(i => i.id !== id);
    saveToStorage(items);
    // remove from DOM via DOM traversal (liElement adalah parent)
    liElement.remove();
    updateEmptyState();
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

  // ----- Storage helpers -----
  function saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      // ignore storage errors
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
});
