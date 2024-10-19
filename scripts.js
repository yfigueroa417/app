document.addEventListener('DOMContentLoaded', () => {
    // TASK MANAGEMENT LOGIC 
    const taskList = document.getElementById('task-list');
    if (taskList) {
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskModal = document.getElementById('task-modal');
        const closeBtn = document.getElementById('close-modal-btn');
        const saveTaskBtn = document.getElementById('save-task-btn');
        const taskNameInput = document.getElementById('task-name');
        const taskCategorySelect = document.getElementById('task-category');
        const taskDateInput = document.getElementById('task-date');
        const calendarBody = document.getElementById('calendar-body');
        const prevWeekBtn = document.getElementById('prev-week-btn');
        const nextWeekBtn = document.getElementById('next-week-btn');
        const printCalendarBtn = document.getElementById('print-calendar-btn');

        const dateFilterSelect = document.createElement('select');
        dateFilterSelect.id = 'date-filter';
        dateFilterSelect.innerHTML = `
            <option value="all">All Tasks</option>
            <option value="today">Due Today</option>
            <option value="overdue">Overdue</option>
        `;
        taskList.parentNode.insertBefore(dateFilterSelect, taskList);

        let currentWeekStart = new Date();
        currentWeekStart.setHours(0, 0, 0, 0);

        function adjustToWeekStart(date) {
            const dayOfWeek = date.getDay();
            return new Date(date.setDate(date.getDate() - dayOfWeek));
        }
        currentWeekStart = adjustToWeekStart(new Date());

        function formatDate(date) {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = daysOfWeek[date.getDay()];
            return `${dayOfWeek}, ${month}-${day}-${year}`;
        }

        function getLocalDateFromInput(dateString) {
            const [year, month, day] = dateString.split('-');
            return new Date(year, month - 1, day);
        }

        function loadTasks() {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            updateTaskList(tasks);
            loadTasksIntoCalendar(tasks);
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

            mainTaskCheckbox.addEventListener('change', () => {
                task.completed = mainTaskCheckbox.checked;
                handleTaskCompletion(task, taskItem);
            });

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
                let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
                tasks = tasks.filter(t => t.name !== task.name);
                saveTasks(tasks);

                taskItem.remove();
                loadTasksIntoCalendar(tasks);
            }
        }

        function updateTaskList(tasks) {
            const filterValue = dateFilterSelect.value;
            let filteredTasks = tasks;

            const today = formatDate(new Date());

            if (filterValue === 'today') {
                filteredTasks = tasks.filter(task => task.date === today);
            } else if (filterValue === 'overdue') {
                filteredTasks = tasks.filter(task => new Date(task.date) < new Date());
            }

            filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

            taskList.innerHTML = '';
            filteredTasks.forEach(task => {
                const taskItem = createTaskItem(task);
                taskList.appendChild(taskItem);
            });
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
            const taskDate = taskDateInput.value;

            if (taskName && taskDate) {
                const formattedDate = formatDate(getLocalDateFromInput(taskDate));

                const task = {
                    name: `${taskName} - Due: ${formattedDate}`,
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

                updateTaskList(tasks);
                loadTasksIntoCalendar(tasks);

                taskModal.style.display = 'none';
                taskNameInput.value = '';
                taskDateInput.value = '';
            }
        });

        dateFilterSelect.addEventListener('change', () => {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            updateTaskList(tasks);
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
                    taskElement.innerText = task.name.split(' - ')[0];
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

        loadTasks();
    }

    // MATERIAL STOCK MANAGEMENT LOGIC
    const materialNameInput = document.getElementById('material-name');
    if (materialNameInput) {
        const materialQuantityInput = document.getElementById('material-quantity');
        const addUpdateButton = document.getElementById('add-update-btn');
        const stockListBody = document.getElementById('stock-list-body');
        const notificationDiv = document.getElementById('notification');

        const lowStockThreshold = 5;
        let materials = JSON.parse(localStorage.getItem('materials')) || [];

        loadMaterials();

        addUpdateButton.addEventListener('click', () => {
            const name = materialNameInput.value.trim();
            let quantity = parseInt(materialQuantityInput.value.trim());

            if (!name || isNaN(quantity)) {
                alert("Please enter a valid material name and quantity.");
                return;
            }

            const existingMaterial = materials.find(material => material.name === name);
            if (existingMaterial) {
                existingMaterial.quantity += quantity; // Increment or decrement based on input
            } else {
                materials.push({ name, quantity });
            }

            saveMaterials();
            loadMaterials();
            materialNameInput.value = '';
            materialQuantityInput.value = '';
        });

        function loadMaterials() {
            stockListBody.innerHTML = '';
            notificationDiv.innerHTML = '';

            materials.forEach((material, index) => {
                const row = document.createElement('tr');

                if (material.quantity <= lowStockThreshold) {
                    row.classList.add('low-stock');
                    notificationDiv.innerHTML += `${material.name} is low on stock! <br>`;
                }

                row.innerHTML = `
                    <td>${material.name}</td>
                    <td>${material.quantity}</td>
                    <td>
                        <input type="number" min="0" value="${material.quantity}" class="update-quantity">
                        <button class="update-btn">Update</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                `;
                stockListBody.appendChild(row);

                const updateButton = row.querySelector('.update-btn');
                const updateQuantityInput = row.querySelector('.update-quantity');
                updateButton.addEventListener('click', () => {
                    const newQuantity = parseInt(updateQuantityInput.value);
                    if (isNaN(newQuantity) || newQuantity < 0) {
                        alert("Please enter a valid quantity (0 or higher).");
                    } else {
                        material.quantity = newQuantity;
                        saveMaterials();
                        loadMaterials();
                    }
                });

                const deleteButton = row.querySelector('.delete-btn');
                deleteButton.addEventListener('click', () => {
                    const confirmDelete = confirm("Are you sure you want to delete this material?");
                    if (confirmDelete) {
                        materials.splice(index, 1); // Remove the material from the array
                        saveMaterials();
                        loadMaterials();
                    }
                });
            });
        }

        function saveMaterials() {
            localStorage.setItem('materials', JSON.stringify(materials));
        }
    }
});
