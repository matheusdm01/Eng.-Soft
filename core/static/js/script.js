document.addEventListener("DOMContentLoaded", function () {
    const columns = document.querySelectorAll(".kanban-column");
    const addButtons = document.querySelectorAll(".add-task-btn");
    const modal = document.getElementById("taskModal");
    const closeModal = document.querySelector(".close");
    const modalTitle = document.getElementById("modalTitle");
    const subtaskList = document.getElementById("subtaskList");
    const addSubtaskBtn = document.getElementById("addSubtaskBtn");
    const newSubtaskInput = document.getElementById("newSubtaskInput");
    const saveTaskBtn = document.getElementById("saveTaskBtn");

    let currentTask = null;  // tarefa principal ou subtarefa atual
    let currentParent = null; // tarefa que possui a subtarefa aberta

    /* ============================
       ABRIR MODAL PARA NOVA TAREFA
    ============================ */
    addButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const column = btn.closest(".kanban-column");
            modal.dataset.mode = "create";
            modal.dataset.column = column.dataset.status;

            document.getElementById("taskTitle").value = "";
            document.getElementById("taskDesc").value = "";
            document.getElementById("taskCreated").value = new Date().toISOString().slice(0,10);
            document.getElementById("taskDeadline").value = "";
            document.getElementById("taskFile").value = "";
            subtaskList.innerHTML = "";

            currentTask = null;
            currentParent = null;

            modal.style.display = "block";
        });
    });

    /* ============================
       APLICAR EVENTOS NAS TAREFAS
    ============================ */
    function applyTaskEvents(task) {
        const deleteBtn = task.querySelector(".delete-btn");
        const doneBtn = task.querySelector(".done-btn");

        // Drag
        task.addEventListener("dragstart", () => task.classList.add("dragging"));
        task.addEventListener("dragend", () => task.classList.remove("dragging"));

        // Excluir
        deleteBtn.addEventListener("click", e => {
            e.stopPropagation();
            task.remove();
        });

        // Concluir tarefa
        doneBtn.addEventListener("click", e => {
            e.stopPropagation();
            moveTaskTo("concluido", task);
        });

        // Abrir modal ao clicar na tarefa
        task.addEventListener("click", e => {
            if (e.target.classList.contains("delete-btn") || e.target.classList.contains("done-btn")) return;

            currentTask = task;
            currentParent = null;
            modal.dataset.mode = "view";
            modalTitle.textContent = task.dataset.title;

            document.getElementById("taskTitle").value = task.dataset.title;
            document.getElementById("taskDesc").value = task.dataset.desc;
            document.getElementById("taskCreated").value = task.dataset.created;
            document.getElementById("taskDeadline").value = task.dataset.deadline;
            document.getElementById("taskFile").value = task.dataset.file;

            renderSubtasks(task);
            modal.style.display = "block";
        });
    }

    // Inicialmente aplica eventos nas tarefas existentes
    document.querySelectorAll(".task").forEach(applyTaskEvents);

    /* ============================
       RENDERIZAR SUBTAREFAS COM CHECKBOX
    ============================ */
    function renderSubtasks(task) {
        subtaskList.innerHTML = "";
        let subtasks = [];
        try { subtasks = JSON.parse(task.dataset.subtasks || "[]"); } catch {}

        subtasks.forEach((st) => {
            const li = document.createElement("li");
            li.classList.add("subtask-item");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = st.done;

            checkbox.addEventListener("change", () => {
                st.done = checkbox.checked;
                task.dataset.subtasks = JSON.stringify(subtasks);
                checkTaskProgress(task);
            });

            const label = document.createElement("span");
            label.textContent = st.title;
            label.style.marginLeft = "8px";

            li.appendChild(checkbox);
            li.appendChild(label);

            // Abrir modal para subtarefa ao clicar no label
            label.addEventListener("click", () => openSubtask(st, task));

            subtaskList.appendChild(li);
        });
    }

    /* ============================
       ADICIONAR SUBTAREFA
    ============================ */
    addSubtaskBtn.addEventListener("click", () => {
        const text = newSubtaskInput.value.trim();
        if (!text || !currentTask) return;

        const subtask = { title: text, done: false, subtasks: [] };
        let subtasks = [];
        try { subtasks = JSON.parse(currentTask.dataset.subtasks || "[]"); } catch {}
        subtasks.push(subtask);

        currentTask.dataset.subtasks = JSON.stringify(subtasks);
        renderSubtasks(currentTask);
        newSubtaskInput.value = "";
    });

    /* ============================
       ABRIR SUBTAREFA NO MODAL
    ============================ */
    function openSubtask(subtask, parentTask) {
        currentTask = subtask;
        currentParent = parentTask;
        modal.dataset.mode = "view";
        modalTitle.textContent = subtask.title;

        document.getElementById("taskTitle").value = subtask.title;
        document.getElementById("taskDesc").value = subtask.desc || "";
        document.getElementById("taskCreated").value = subtask.created || "";
        document.getElementById("taskDeadline").value = subtask.deadline || "";
        document.getElementById("taskFile").value = subtask.file || "";

        subtaskList.innerHTML = "";
        (subtask.subtasks || []).forEach(st => {
            const li = document.createElement("li");
            li.classList.add("subtask-item");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = st.done;
            checkbox.addEventListener("change", () => {
                st.done = checkbox.checked;
                subtask.dataset.subtasks = JSON.stringify(subtask.subtasks);
                checkTaskProgress(parentTask);
            });

            const label = document.createElement("span");
            label.textContent = st.title;
            label.style.marginLeft = "8px";

            li.appendChild(checkbox);
            li.appendChild(label);
            label.addEventListener("click", () => openSubtask(st, subtask));

            subtaskList.appendChild(li);
        });

        modal.style.display = "block";
    }

    /* ============================
       VERIFICAR PROGRESSO DA TAREFA
    ============================ */
    function checkTaskProgress(task) {
        let subtasks = [];
        try { subtasks = JSON.parse(task.dataset.subtasks || "[]"); } catch {}

        const total = subtasks.length;
        const doneCount = subtasks.filter(st => st.done).length;
        const status = task.closest(".kanban-column").dataset.status;

        if (doneCount === total && total > 0) {
            moveTaskTo("concluido", task);
        } else if (doneCount > 0 && doneCount < total && status !== "fazendo") {
            moveTaskTo("fazendo", task);
        } else if (doneCount === 0 && status !== "pendente") {
            moveTaskTo("pendente", task);
        }
    }

    /* ============================
       MOVER TAREFA PARA COLUNA
    ============================ */
    function moveTaskTo(status, task) {
        const column = document.querySelector(`.kanban-column[data-status="${status}"]`);
        if (column) {
            column.insertBefore(task, column.querySelector(".add-task-btn"));
        }
    }

    /* ============================
       SALVAR TAREFA DO MODAL
    ============================ */
    saveTaskBtn.addEventListener("click", () => {
        const title = document.getElementById("taskTitle").value.trim();
        const desc = document.getElementById("taskDesc").value.trim();
        const created = document.getElementById("taskCreated").value;
        const deadline = document.getElementById("taskDeadline").value;
        const file = document.getElementById("taskFile").value;

        if (!title) return;

        if (modal.dataset.mode === "create") {
            const column = document.querySelector(`.kanban-column[data-status="${modal.dataset.column}"]`);
            const newTask = document.createElement("div");
            newTask.classList.add("task");
            newTask.setAttribute("draggable", "true");
            newTask.dataset.title = title;
            newTask.dataset.desc = desc;
            newTask.dataset.created = created;
            newTask.dataset.deadline = deadline;
            newTask.dataset.file = file;
            newTask.dataset.subtasks = "[]";
            newTask.innerHTML = `${title} <span class="done-btn">✅</span> <span class="delete-btn">❌</span>`;

            applyTaskEvents(newTask);
            column.insertBefore(newTask, column.querySelector(".add-task-btn"));
        } else if (modal.dataset.mode === "view" && currentTask) {
            currentTask.dataset.title = title;
            currentTask.dataset.desc = desc;
            currentTask.dataset.created = created;
            currentTask.dataset.deadline = deadline;
            currentTask.dataset.file = file;

            if (!currentTask.classList.contains("task")) {
                // É uma subtarefa: atualiza apenas o label no modal
                renderSubtasks(currentParent || currentTask);
            } else {
                currentTask.querySelector(".done-btn").previousSibling.textContent = title;
            }
        }

        modal.style.display = "none";
    });

    /* ============================
       FECHAR MODAL
    ============================ */
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", e => {
        if (e.target === modal) modal.style.display = "none";
    });

    /* ============================
       DRAG & DROP
    ============================ */
    columns.forEach(col => {
        col.addEventListener("dragover", e => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            const afterElement = getDragAfterElement(col, e.clientY);
            if (afterElement == null) {
                col.insertBefore(dragging, col.querySelector(".add-task-btn"));
            } else {
                col.insertBefore(dragging, afterElement);
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".task:not(.dragging):not(.add-task-btn)")];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});
