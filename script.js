const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'style.css';
document.head.appendChild(style);

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.className = 'container';

  const errorMsg = document.createElement('div');
  errorMsg.className = 'error-message';
  container.appendChild(errorMsg);

  const title = document.createElement('h1');
  title.textContent = 'To-Do list';

  const form = document.createElement('form');

  const inputText = document.createElement('input');
  inputText.type = 'text';
  inputText.placeholder = 'Введите задачу...';

  const inputDate = document.createElement('input');
  inputDate.type = 'date';

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Добавить';
  addBtn.type = 'submit';

  form.append(inputText, inputDate, addBtn);

  const controls = document.createElement('div');
  controls.style.marginTop = '15px';
  controls.style.display = 'flex';
  controls.style.flexWrap = 'wrap';
  controls.style.gap = '10px';

  const filter = document.createElement('select');
  const optionAll = document.createElement('option');
  optionAll.value = 'all';
  optionAll.textContent = 'Все';
  const optionActive = document.createElement('option');
  optionActive.value = 'active';
  optionActive.textContent = 'Невыполненные';
  const optionCompleted = document.createElement('option');
  optionCompleted.value = 'completed';
  optionCompleted.textContent = 'Выполненные';
  filter.append(optionAll, optionActive, optionCompleted);

  const sort = document.createElement('select');
  const optionNone = document.createElement('option');
  optionNone.value = 'none';
  optionNone.textContent = 'Без сортировки';
  const optionAsc = document.createElement('option');
  optionAsc.value = 'asc';
  optionAsc.textContent = 'По дате ↑';
  const optionDesc = document.createElement('option');
  optionDesc.value = 'desc';
  optionDesc.textContent = 'По дате ↓';
  sort.append(optionNone, optionAsc, optionDesc);

  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Поиск...';

  controls.append(filter, sort, search);

  const list = document.createElement('div');
  list.className = 'todo-list';

  container.append(title, form, controls, list);
  document.body.appendChild(container);

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hide');
    errorMsg.classList.add('show');
    setTimeout(() => {
      errorMsg.classList.remove('show');
      errorMsg.classList.add('hide');
    }, 2500);
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function renderTasks() {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    let filtered = [...tasks];
    if (filter.value === 'active') filtered = filtered.filter(t => !t.done);
    if (filter.value === 'completed') filtered = filtered.filter(t => t.done);
    const term = search.value.toLowerCase();
    filtered = filtered.filter(t => t.title.toLowerCase().includes(term));
    if (sort.value === 'asc') filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (sort.value === 'desc') filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'Нет задач';
      empty.style.textAlign = 'center';
      empty.style.color = 'gray';
      list.appendChild(empty);
      return;
    }

    filtered.forEach(task => {
      const item = document.createElement('div');
      item.className = 'todo-item';
      if (task.done) item.classList.add('completed');
      item.draggable = true;
      item.dataset.id = task.id;

      const left = document.createElement('div');
      left.className = 'left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        task.done = !task.done;
        saveTasks();
        renderTasks();
      });

      const text = document.createElement('span');
      text.className = 'title';
      text.textContent = task.title;

      const date = document.createElement('span');
      date.className = 'date';
      if (task.date) date.textContent = `(${task.date})`;

      left.append(checkbox, text, date);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => enterEditMode(item, task));

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      actions.append(editBtn, delBtn);
      item.append(left, actions);

      item.addEventListener('dragstart', () => item.classList.add('dragging'));
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        const ids = [...list.querySelectorAll('.todo-item')].map(el => el.dataset.id);
        tasks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        saveTasks();
      });

      list.appendChild(item);
    });

    list.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getDragAfterElement(list, e.clientY);
      const dragging = document.querySelector('.dragging');
      if (!dragging) return;
      if (after == null) list.appendChild(dragging);
      else list.insertBefore(dragging, after);
    });
  }

  function enterEditMode(item, task) {
    item.textContent = '';
    const left = document.createElement('div');
    left.className = 'edit-fields';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = task.title;

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = task.date || '';

    left.append(titleInput, dateInput);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Сохранить';
    saveBtn.addEventListener('click', () => {
      if (!titleInput.value.trim()) {
        showError('Введите название задачи!');
        return;
      }
      task.title = titleInput.value.trim();
      task.date = dateInput.value;
      saveTasks();
      renderTasks();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌ Отмена';
    cancelBtn.addEventListener('click', renderTasks);

    actions.append(saveBtn, cancelBtn);
    item.append(left, actions);
  }

  function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    return els.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = inputText.value.trim();
    if (!title) {
      showError('Введите название задачи!');
      return;
    }
    const date = inputDate.value;
    tasks.push({ id: Date.now().toString(), title, date, done: false });
    inputText.value = '';
    inputDate.value = '';
    saveTasks();
    renderTasks();
  });

  filter.addEventListener('change', renderTasks);
  sort.addEventListener('change', renderTasks);
  search.addEventListener('input', renderTasks);

  renderTasks();
});
