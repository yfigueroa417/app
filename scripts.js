document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const taskModal = document.getElementById('task-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskNameInput = document.getElementById('task-name');
    const taskCategorySelect = document.getElementById('task-category');
    const taskDateInput = document.getElementById('task-date');
    const taskRecurrenceSelect = document.getElementById('task-recurrence');
    const calendarBody = document.getElementById('calendar-body');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const printCalendarBtn = document.getElementById('print-calendar-btn');

    let currentWeekStart = new Date();

    function adjustToWeekStart(date) {
        const dayOfWeek = date.getDay();
        return new Date(date.setDate(date.getDate() - dayOfWeek));
    }
    currentWeekStart = adjustToWeekStart(new Date());

    function formatDate(date) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
    }

    function getLocalDateFromInput(dateString) {
        const [year, month, day] = dateString.split('-');
        return new Date(year, month - 1, day);
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskItem = createTaskItem(task);
            taskList.appendChild(taskItem);
        });

        loadTasksIntoCalendar(tasks); // Ensure tasks load into the calendar
    }

    function saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function createTaskItem(task) {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');
        taskItem.dataset.date = task.date;
        taskItem.innerHTML = `
            <input type="checkbox" class="main-task-checkbox" ${task.completed ? 'checked' : ''}> ${task.name}
            ${task.subtasks.length > 0 ? `   
                <ul class="subtask-list">
                    ${task.subtasks.map(subtask => `
                        <li><input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}> ${subtask.name}</li>
                    `).join('')}
                </ul>
            ` : ''}
        `;

        const mainTaskCheckbox = taskItem.querySelector('.main-task-checkbox');
        const subtaskCheckboxes = taskItem.querySelectorAll('.subtask-checkbox');

        // Mark main task as completed 
        mainTaskCheckbox.addEventListener('change', () => {
            task.completed = mainTaskCheckbox.checked;
            handleTaskCompletion(task, taskItem);
        });

        // Mark subtasks as completed
        subtaskCheckboxes.forEach((subtaskCheckbox, index) => {
            subtaskCheckbox.addEventListener('change', () => {
                task.subtasks[index].completed = subtaskCheckbox.checked;
                const allCompleted = Array.from(subtaskCheckboxes).every(cb => cb.checked);
                mainTaskCheckbox.checked = allCompleted;
                task.completed = allCompleted;
                handleTaskCompletion(task, taskItem);
            });
        });

        return taskItem;
    }

    function handleTaskCompletion(task, taskItem) {
        if (task.completed) {
            // Remove task
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks = tasks.filter(t => t.name !== task.name);
            saveTasks(tasks);

            taskItem.remove();

            // Update the calendar to show removed tasks
            loadTasksIntoCalendar(tasks);
        }
    }

    addTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    saveTaskBtn.addEventListener('click', () => {
        const taskName = taskNameInput.value.trim();
        const taskCategory = taskCategorySelect.value;
        const taskDate = getLocalDateFromInput(taskDateInput.value);
        const taskRecurrence = taskRecurrenceSelect.value;

        if (taskName && taskDate) {
            const formattedDate = formatDate(taskDate);

            const task = {
                name: `${taskName} - Due: ${formattedDate}, Repeat: ${taskRecurrence}`,
                completed: false,
                subtasks: [],
                date: formattedDate
            };

            if (taskCategory === 'order-fulfillment') {
                task.subtasks = ['Design', 'Production', 'Shipping'].map(subtask => ({ name: subtask, completed: false }));
            }

            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks.push(task);
            saveTasks(tasks);

            // Update UI with new task
            const taskItem = createTaskItem(task);
            taskList.appendChild(taskItem);
            loadTasksIntoCalendar(tasks);

            // Reset and close modal
            taskModal.style.display = 'none';
            taskNameInput.value = '';
            taskDateInput.value = '';
            taskRecurrenceSelect.value = 'none';
        }
    });

    function loadTasksIntoCalendar(tasks = []) {
        calendarBody.innerHTML = '';
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + i);
            return formatDate(day);
        });

        weekDays.forEach(date => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.innerText = date;

            const tasksForDay = tasks.filter(task => task.date === date);
            tasksForDay.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'calendar-task';
                taskElement.innerText = task.name.split(' - ')[0]; // Get only the task name
                dayDiv.appendChild(taskElement);
            });

            calendarBody.appendChild(dayDiv);
        });
    }

    prevWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        loadTasksIntoCalendar(JSON.parse(localStorage.getItem('tasks')) || []);
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        loadTasksIntoCalendar(JSON.parse(localStorage.getItem('tasks')) || []);
    });

    printCalendarBtn.addEventListener('click', () => {
        window.print();
    });

    loadTasks(); // Ensure tasks are loaded
});
