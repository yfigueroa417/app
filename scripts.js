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
    const printCalendarBtn = document.getElementById('print-calendar-btn');

    // Load tasks 
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        taskList.innerHTML = ''; 

        tasks.forEach(task => {
            if (!task.completed) { 
                const taskItem = createTaskItem(task);
                taskList.appendChild(taskItem);
            }
        });

        loadTasksIntoCalendar(tasks);
    }

    // Save tasks 
    function saveTasks() {
        const tasks = Array.from(taskList.children).map(taskItem => {
            const taskName = taskItem.querySelector('.main-task-checkbox').nextSibling.textContent.trim();
            const isCompleted = taskItem.querySelector('.main-task-checkbox').checked;
            const subtasks = Array.from(taskItem.querySelectorAll('.subtask-checkbox')).map(cb => ({
                name: cb.nextSibling.textContent.trim(),
                completed: cb.checked
            }));
            return { name: taskName, completed: isCompleted, subtasks, date: taskItem.dataset.date };
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Create a task item element
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

        mainTaskCheckbox.addEventListener('change', () => {
            task.completed = mainTaskCheckbox.checked; 
            saveTasks(); 
            
            // Remove task from the task list if completed
            if (task.completed) {
                taskList.removeChild(taskItem);
                loadTasksIntoCalendar(); 
            }
        });

        subtaskCheckboxes.forEach(subtaskCheckbox => {
            subtaskCheckbox.addEventListener('change', () => {
                // Check if all subtasks are completed
                const allCompleted = Array.from(subtaskCheckboxes).every(cb => cb.checked);
                mainTaskCheckbox.checked = allCompleted;
                saveTasks(); 

                // If all subtasks are completed, remove the main task from the list
                if (allCompleted) {
                    task.completed = true; 
                    taskList.removeChild(taskItem);
                    loadTasksIntoCalendar(); 
                }
            });
        });

        return taskItem;
    }

    // Show the modal when "Add New Task" button is clicked
    addTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'flex';
    });

    // Close the modal when "X" button is clicked
    closeBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    // Save the task when "Save Task" button is clicked
    saveTaskBtn.addEventListener('click', () => {
        const taskName = taskNameInput.value.trim();
        const taskCategory = taskCategorySelect.value;
        const taskDate = new Date(taskDateInput.value); 
        const taskRecurrence = taskRecurrenceSelect.value;

        if (taskName && taskDate) {
            const formattedDate = `${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}-${taskDate.getFullYear()}`; // Format date as MM-DD-YYYY

            const task = {
                name: `${taskName} - Due: ${formattedDate}, Repeat: ${taskRecurrence}`,
                completed: false,
                subtasks: [],
                date: formattedDate
            };

            if (taskCategory === 'order-fulfillment') {
                task.subtasks = ['Design', 'Production', 'Shipping'].map(subtask => ({ name: subtask, completed: false }));
            }

            const taskItem = createTaskItem(task);
            taskList.appendChild(taskItem);
            saveTasks(); 

            // Update the calendar to reflect the new task
            loadTasksIntoCalendar(); 

            // Reset and close the modal
            taskModal.style.display = 'none';
            taskNameInput.value = '';
            taskDateInput.value = '';
            taskRecurrenceSelect.value = 'none';
        }
    });

    // Load tasks when the page is loaded
    loadTasks();

    // Load tasks into the calendar
    function loadTasksIntoCalendar(tasks = JSON.parse(localStorage.getItem('tasks')) || []) {
        calendarBody.innerHTML = ''; 

        const today = new Date();
        const startOfWeek = today.getDate() - today.getDay(); 
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(startOfWeek + i);
            return date;
        });

        weekDates.forEach(date => {
            const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getFullYear()}`; 
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            const taskNames = tasks
                .filter(task => task.date === formattedDate && !task.completed)
                .map(task => task.name.split(' - ')[0])
                .join(', ');

            const taskDayElement = document.createElement('div');
            taskDayElement.classList.add('calendar-day');
            taskDayElement.innerHTML = `<strong>${dayOfWeek}, ${date.getDate()}</strong><br>${taskNames || 'No Tasks'}`;
            calendarBody.appendChild(taskDayElement);
        });
    }

    // Print calendar functionality
    printCalendarBtn.addEventListener('click', () => {
        const calendarContent = document.getElementById('calendar-body').innerHTML; 
        const weekDays = document.querySelectorAll('.calendar-day');

        // Prepare the print content
        let printContents = '<h2>Weekly Schedule</h2>';
        weekDays.forEach(day => {
            printContents += `<div style="margin-bottom: 20px;">${day.innerHTML}</div>`; 
        });

        // Create a new window for printing
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print Calendar</title>');
        printWindow.document.write('<style>body { font-family: Arial, sans-serif; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContents); 
        printWindow.document.write('</body></html>');
        printWindow.document.close(); 
        printWindow.print(); 
        printWindow.close(); 
    });
});

