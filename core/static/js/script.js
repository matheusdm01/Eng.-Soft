document.addEventListener("DOMContentLoaded", function () {
    const columns = document.querySelectorAll(".kanban-column");
    const addButtons = document.querySelectorAll(".add-task-btn");
    const modal = document.getElementById("taskModal");
    const closeModal = document.querySelector(".close");
    const modalTitle = document.getElementById("modalTitle");
    const modalDesc = document.getElementById("modalDesc");
    const subtaskList = document.getElementById("subtaskList");
    const addSubtaskBtn = document.getElementById("addSubtaskBtn");
    const newSubtaskInput = document.getElementById("newSubtaskInput");

    let currentTask = null;

    /* === Adicionar nova tarefa === */
    addButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const column = btn.closest(".kanban-column");
            const newTask = document.createElement("div");
            newTask.classList.add("task");
            newTask.setAttribute("draggable", "true");
            newTask.setAttribute("data-title", "Nova tarefa ✏️");
            newTask.setAttribute("data-desc", "Sem descrição.");
            newTask.innerHTML = 'Nova tarefa ✏️ <span class="delete-btn">❌</span>';
            column.insertBefore(newTask, btn);
            applyTaskEvents(newTask);
        });
    });

    /* === Tornar tarefas arrastáveis e deletáveis === */
    function applyTaskEvents(task) {
        // Drag
        task.addEventListener("dragstart", () => task.classList.add("dragging"));
        task.addEventListener("dragend", () => task.classList.remove("dragging"));

        // Delete
        const deleteBtn = task.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            task.remove();
        });

        // Abrir modal ao clicar
        task.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-btn")) return; // ignora clique no X
            currentTask = task;
            modalTitle.textContent = task.dataset.title;
            modalDesc.textContent = task.dataset.desc;
            subtaskList.innerHTML = ""; // limpa subtarefas anteriores
            modal.style.display = "block";
        });
    }

    document.querySelectorAll(".task").forEach(applyTaskEvents);

    /* === Drag & Drop entre colunas === */
    columns.forEach((column) => {
        column.addEventListener("dragover", (e) => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            const afterElement = getDragAfterElement(column, e.clientY);
            if (afterElement == null) {
                column.insertBefore(dragging, column.querySelector(".add-task-btn"));
            } else {
                column.insertBefore(dragging, afterElement);
            }
            column.classList.add("drag-over");
        });

        column.addEventListener("dragleave", () => {
            column.classList.remove("drag-over");
        });

        column.addEventListener("drop", () => {
            column.classList.remove("drag-over");
        });
    });

    /* === Subtarefas === */
    addSubtaskBtn.addEventListener("click", () => {
        const text = newSubtaskInput.value.trim();
        if (!text) return;
        const li = document.createElement("li");
        li.innerHTML = `${text} <button>❌</button>`;
        subtaskList.appendChild(li);
        newSubtaskInput.value = "";
        li.querySelector("button").addEventListener("click", () => li.remove());
    });

    /* === Fechar modal === */
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    /* === Função auxiliar === */
    function getDragAfterElement(column, y) {
        const elements = [...column.querySelectorAll(".task:not(.dragging)")];
        return elements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY }
        ).element;
    }
});

/* === Logout simulado === */
function logout() {
    alert("Logout simulado — voltando à tela de login...");
    window.location.href = "/";
}
