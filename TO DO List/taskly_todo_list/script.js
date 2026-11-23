const STORAGE_KEY = 'taskly_tasks_v1';

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const formMessage = document.getElementById('formMessage');
const filterButtons = document.querySelectorAll('.filter');

let tasks = loadTasks();
let currentFilter = 'all';

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(task =>
      task && typeof task.id === 'string' &&
      typeof task.text === 'string' &&
      typeof task.completed === 'boolean'
    );
  } catch (error) {
    console.warn('Could not load saved tasks:', error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.warn('Could not save tasks:', error);
    formMessage.textContent = 'Could not save tasks. Check your browser storage settings.';
    return false;
  }
}

function makeId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisibleTasks() {
  if (currentFilter === 'active') return tasks.filter(task => !task.completed);
  if (currentFilter === 'completed') return tasks.filter(task => task.completed);
  return tasks;
}

function updateSummary() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const active = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('taskCount').textContent = total;
  document.getElementById('allCount').textContent = total;
  document.getElementById('activeCount').textContent = active;
  document.getElementById('completedCount').textContent = completed;
  document.getElementById('progressPercent').textContent = `${percent}%`;
  document.getElementById('progressRing').style.background =
    `conic-gradient(var(--purple) ${percent * 3.6}deg, #eeeff7 0deg)`;
  document.getElementById('progressRing').setAttribute('aria-label', `${percent} percent complete`);
  document.getElementById('remainingText').textContent =
    `${active} ${active === 1 ? 'task' : 'tasks'} left`;
  document.getElementById('clearCompleted').disabled = completed === 0;
  document.getElementById('clearCompleted').style.opacity = completed === 0 ? '.45' : '1';
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = getVisibleTasks();
  emptyState.hidden = visibleTasks.length > 0;

  if (visibleTasks.length === 0) {
    const message = currentFilter === 'active'
      ? 'You have no active tasks. Nice work!'
      : currentFilter === 'completed'
        ? 'No completed tasks yet. Keep going!'
        : 'Add a task above and make your day productive.';
    emptyState.querySelector('span').textContent = message;
  }

  for (const task of visibleTasks) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'active' : 'completed'}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteButton.title = 'Delete task';
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  }

  updateSummary();
}

function addTask(text) {
  tasks.unshift({ id: makeId(), text, completed: false, createdAt: Date.now() });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id
    ? { ...task, completed: !task.completed }
    : task);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const text = taskInput.value.trim();

  if (!text) {
    formMessage.textContent = 'Please enter a task first.';
    taskInput.focus();
    return;
  }
  if (text.length > 120) {
    formMessage.textContent = 'Please keep your task under 120 characters.';
    return;
  }

  addTask(text);
  taskInput.value = '';
  formMessage.textContent = 'Task added successfully.';
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderTasks();
  });
});

document.getElementById('clearCompleted').addEventListener('click', () => {
  const completedCount = tasks.filter(task => task.completed).length;
  if (completedCount === 0) return;
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
  formMessage.textContent = `${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'} cleared.`;
});

document.getElementById('todayLabel').textContent =
  new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

renderTasks();
