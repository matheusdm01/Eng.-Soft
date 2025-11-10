document.addEventListener("DOMContentLoaded", function () {
    // URL base da sua API Django. Deve ser '/api/tarefas/' se você usou as rotas sugeridas.
    const API_URL = '/api/tarefas/'; 

    const columns = document.querySelectorAll(".kanban-column");
    const addButtons = document.querySelectorAll(".add-task-btn");
    const modal = document.getElementById("taskModal");
    const closeModal = document.querySelector(".close");
    const modalTitle = document.getElementById("modalTitle");
    const subtaskList = document.getElementById("subtaskList");
    const addSubtaskBtn = document.getElementById("addSubtaskBtn");
    const newSubtaskInput = document.getElementById("newSubtaskInput");
    const saveTaskBtn = document.getElementById("saveTaskBtn");
    // O elemento de download não está no seu HTML, por isso não é mais necessário
    // const downloadLink = document.getElementById("fileDownloadLink"); 

    // Variável para armazenar a tarefa principal sendo editada/visualizada (o elemento DOM)
    let currentTaskElement = null;
    
    // ===================================
    // FUNÇÕES DE UTILIDADE E AJAX
    // ===================================

    // Função para obter o CSRF Token (necessário para segurança do Django)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookies[i].substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // Função genérica para requisições Fetch/AJAX (CREATE, READ, UPDATE, DELETE)
    async function apiRequest(url, method, data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
        };
        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (response.ok) {
                if (method === 'DELETE' || response.status === 204) {
                    return {}; 
                }
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    return await response.json();
                }
                return {};
            } else {
                const errorText = await response.text();
                let error = { detail: 'Erro desconhecido.' };
                try {
                    error = JSON.parse(errorText);
                } catch (e) {
                    error.detail = errorText || 'Erro de resposta do servidor.';
                }
                
                console.error("API Error:", error);
                alert(`Erro na requisição ${method} (${response.status}): ${JSON.stringify(error.detail || error.error || error)}`);
                return null;
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Erro de conexão com o servidor ou de rede.");
            return null;
        }
    }
    
    // ===================================
    // LÓGICA DO MODAL (CREATE/VIEW/UPDATE)
    // ===================================

    /* ABRIR MODAL PARA NOVA TAREFA (CREATE) */
    addButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const column = btn.closest(".kanban-column");
            modal.dataset.mode = "create";
            modal.dataset.column = column.dataset.status;
            modal.dataset.taskId = ""; 
            modalTitle.textContent = "Criar Nova Tarefa";
            
            // Limpa e preenche o formulário
            document.getElementById("taskTitle").value = "";
            document.getElementById("taskDesc").value = "";
            // Usa a data de hoje como sugestão de criação
            document.getElementById("taskCreated").value = new Date().toISOString().slice(0,10); 
            document.getElementById("taskDeadline").value = "";
            document.getElementById("taskFile").value = "";
            
            subtaskList.innerHTML = "<li>Subtarefas só podem ser adicionadas após a criação da tarefa principal.</li>";
            addSubtaskBtn.disabled = true;

            currentTaskElement = null;
            modal.style.display = "block";
        });
    });

    /* ABRIR MODAL AO CLICAR NA TAREFA (VIEW/UPDATE) */
    function openTaskModal(taskElement) {
        const taskId = taskElement.dataset.id;
        if (!taskId) return; 

        currentTaskElement = taskElement;
        modal.dataset.mode = "view";
        modal.dataset.taskId = taskId;
        modalTitle.textContent = taskElement.dataset.title;

        const fileUrl = taskElement.dataset.file;
        
        // Preenche o formulário com os dados do elemento DOM
        document.getElementById("taskTitle").value = taskElement.dataset.title;
        document.getElementById("taskDesc").value = taskElement.dataset.desc;
        document.getElementById("taskCreated").value = taskElement.dataset.created;
        document.getElementById("taskDeadline").value = taskElement.dataset.deadline;
        document.getElementById("taskFile").value = fileUrl;
        
        // Nota: A lógica de download foi removida daqui, pois a tag não existe no seu HTML.
        // Se precisar de download, adicione <a id="fileDownloadLink"></a> ao seu modal.

        // Renderiza as subtarefas usando os dados JSON pré-carregados no HTML
        const subtasksJson = taskElement.dataset.subtasks;
        renderSubtasks(subtasksJson); 
        addSubtaskBtn.disabled = false;

        modal.style.display = "block";
    }

    /* SALVAR TAREFA DO MODAL (CREATE/UPDATE) */
    saveTaskBtn.addEventListener("click", async () => {
        const title = document.getElementById("taskTitle").value.trim();
        const desc = document.getElementById("taskDesc").value.trim();
        // Os inputs tipo="date" retornam "" se vazios, o que é tratado no views.py
        const deadline = document.getElementById("taskDeadline").value; 
        const file = document.getElementById("taskFile").value.trim() || null;

        if (!title) {
            alert("O título da tarefa é obrigatório!");
            return;
        }

        const taskData = {
            titulo: title,
            descricao: desc,
            prazo: deadline,
            arquivo: file,
        };

        let success = false;
        let resultTask = null;

        if (modal.dataset.mode === "create") {
            // Requisição POST para criar nova tarefa principal
            resultTask = await apiRequest(API_URL, 'POST', taskData);

            if (resultTask) {
                const newStatus = "pendente"; 
                const column = document.querySelector(`.kanban-column[data-status="${newStatus}"]`);
                const newTaskElement = createNewTaskElement(resultTask, newStatus);
                // Insere a nova tarefa logo após o botão "Adicionar Tarefa"
                column.insertBefore(newTaskElement, column.querySelector(".add-task-btn").parentNode.nextSibling); 
                success = true;
            }

        } else if (modal.dataset.mode === "view" && currentTaskElement) {
            const taskId = currentTaskElement.dataset.id;
            
            // Requisição PATCH para atualizar tarefa principal
            resultTask = await apiRequest(`${API_URL}${taskId}/`, 'PATCH', taskData);
            
            if (resultTask) {
                updateTaskElement(currentTaskElement, resultTask);
                success = true;
            }
        }
        
        if (success) {
            modal.style.display = "none";
        }
    });

    // ===================================
    // MANIPULAÇÃO DO DOM PÓS-API
    // ===================================
    
    /* CRIA NOVO ELEMENTO DOM DE TAREFA */
    function createNewTaskElement(task, status) {
        const newTask = document.createElement("div");
        newTask.classList.add("task");
        newTask.setAttribute("draggable", "true");
        // pk do Django
        newTask.dataset.id = task.pk; 
        newTask.dataset.status = status; 
        newTask.dataset.title = task.titulo;
        newTask.dataset.desc = task.descricao;
        newTask.dataset.created = task.data_criacao || new Date().toISOString().slice(0,10); 
        newTask.dataset.deadline = task.prazo || '';
        newTask.dataset.file = task.arquivo || '';
        newTask.dataset.subtasks = '[]'; 
        newTask.innerHTML = `${task.titulo} <span class="done-btn">✅</span> <span class="delete-btn">❌</span>`;

        applyTaskEvents(newTask);
        return newTask;
    }

    /* ATUALIZA ELEMENTO DOM DE TAREFA */
    function updateTaskElement(element, taskData) {
        element.dataset.title = taskData.titulo;
        element.dataset.desc = taskData.descricao;
        element.dataset.deadline = taskData.prazo || '';
        element.dataset.file = taskData.arquivo || '';
        element.childNodes[0].nodeValue = taskData.titulo; 
        modalTitle.textContent = taskData.titulo; 
    }

    /* APLICA EVENTOS NAS TAREFAS (EDITAR, DELETAR, CONCLUIR) */
    function applyTaskEvents(task) {
        const deleteBtn = task.querySelector(".delete-btn");
        const doneBtn = task.querySelector(".done-btn");

        // Drag
        task.addEventListener("dragstart", () => task.classList.add("dragging"));
        task.addEventListener("dragend", () => task.classList.remove("dragging"));

        // Excluir (DELETE)
        deleteBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                const taskId = task.dataset.id;
                const success = await apiRequest(`${API_URL}${taskId}/`, 'DELETE'); 
                if (success !== null) {
                    task.remove();
                }
            }
        });

        // Concluir tarefa (PATCH)
        doneBtn.addEventListener("click", e => {
            e.stopPropagation();
            updateTaskStatus("concluido", task, true); 
        });

        // Abrir modal ao clicar na tarefa
        task.addEventListener("click", e => {
            if (e.target.classList.contains("delete-btn") || e.target.classList.contains("done-btn")) return;
            openTaskModal(task);
        });
    }

    // Inicialmente aplica eventos nas tarefas existentes
    document.querySelectorAll(".task").forEach(applyTaskEvents);

    // ===================================
    // LÓGICA DE SUBTAREFAS
    // ===================================

    // Função auxiliar para criar o <li> da subtarefa no DOM
    function createSubtaskListItem(subtaskData, parentId) {
        const li = document.createElement("li");
        li.classList.add("subtask-item");
        li.dataset.subtaskId = subtaskData.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = subtaskData.done;
        
        // Evento para marcar/desmarcar subtarefa (usa a rota de detalhe com PATCH)
        checkbox.addEventListener("change", async () => {
            const SUBTASK_API_URL = `${API_URL}${subtaskData.id}/`; 
            const data = { concluido: checkbox.checked };
            
            const updatedSubtask = await apiRequest(SUBTASK_API_URL, 'PATCH', data);
            
            if (updatedSubtask) {
                subtaskData.done = checkbox.checked;
                li.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
                console.log(`Subtarefa ${subtaskData.id} atualizada.`);
            } else {
                checkbox.checked = !checkbox.checked; 
            }
        });

        const label = document.createElement("span");
        label.textContent = subtaskData.title;
        label.style.marginLeft = "8px";
        li.style.textDecoration = subtaskData.done ? 'line-through' : 'none';

        li.appendChild(checkbox);
        li.appendChild(label);
        return li;
    }
    
    /* RENDERIZAR SUBTAREFAS (USANDO DADOS PRÉ-CARREGADOS) */
    function renderSubtasks(subtasksJson) {
        subtaskList.innerHTML = "";
        let subtasks = [];
        try { 
            // O JSON está em formato string, precisamos fazer o parse
            subtasks = JSON.parse(subtasksJson || "[]"); 
        } catch (e) {
            console.error("Erro ao fazer parse das subtarefas:", e);
        }

        if (subtasks.length === 0) {
            subtaskList.innerHTML = "<li>Nenhuma subtarefa adicionada.</li>";
            return;
        }

        const parentId = modal.dataset.taskId;
        subtasks.forEach((st) => {
            const li = createSubtaskListItem(st, parentId);
            subtaskList.appendChild(li);
        });
    }

    /* ADICIONAR SUBTAREFA (USA NOVO ENDPOINT DE CRIAÇÃO) */
    addSubtaskBtn.addEventListener("click", async () => {
        const title = newSubtaskInput.value.trim();
        const parentId = modal.dataset.taskId; 
        if (!title || !parentId) return;

        // USA A NOVA ROTA: /api/tarefas/<parent_pk>/subtarefas/
        const SUBTASK_CREATE_URL = `${API_URL}${parentId}/subtarefas/`; 
        
        const data = { 
            titulo: title
        }; 

        const newSubtask = await apiRequest(SUBTASK_CREATE_URL, 'POST', data); 
        
        if (newSubtask) {
            const li = createSubtaskListItem(newSubtask, parentId);
            
            // Remove a mensagem de "Nenhuma subtarefa" se ela existir
            if (subtaskList.querySelector('li').textContent === "Nenhuma subtarefa adicionada.") {
                subtaskList.innerHTML = '';
            }
            
            subtaskList.appendChild(li);
            newSubtaskInput.value = "";
            alert(`Subtarefa "${newSubtask.title}" criada com sucesso! Você precisará recarregar a página para que os dados da tarefa principal sejam atualizados.`);
            newSubtaskInput.value = "";
        }
    });

    // ===================================
    // LÓGICA DE MOVER E DRAG & DROP
    // ===================================

    /* ATUALIZAR STATUS DA TAREFA (PATCH) */
    async function updateTaskStatus(newStatus, taskElement, setConcluido = false) {
        const taskId = taskElement.dataset.id;
        let concluido = setConcluido;

        if (newStatus === "concluido") {
             concluido = true;
        } else if (newStatus === "pendente" || newStatus === "fazendo") {
            concluido = false;
        }
        
        const data = { concluido: concluido };

        const updatedTask = await apiRequest(`${API_URL}${taskId}/`, 'PATCH', data);
        
        if (updatedTask) {
            moveTaskTo(newStatus, taskElement);
            taskElement.dataset.status = newStatus; 
        }
    }
    
    /* MOVER TAREFA PARA COLUNA */
    function moveTaskTo(status, task) {
        const column = document.querySelector(`.kanban-column[data-status="${status}"]`);
        if (column) {
            // Insere antes do próximo elemento (que não seja o botão add-task-btn), ou no final
            const nextElement = column.querySelector(".add-task-btn").parentNode.nextSibling;
            column.insertBefore(task, nextElement); 
        }
    }

    /* DRAG & DROP EVENTOS */
    columns.forEach(col => {
        col.addEventListener("dragover", e => {
            e.preventDefault();
            col.classList.add("drag-over");
            const dragging = document.querySelector(".dragging");
            if (dragging) {
                const afterElement = getDragAfterElement(col, e.clientY);
                const nextInsertPoint = col.querySelector(".add-task-btn").parentNode.nextSibling;
                
                if (afterElement == null) {
                    col.insertBefore(dragging, nextInsertPoint); 
                } else {
                    col.insertBefore(dragging, afterElement);
                }
            }
        });
        
        col.addEventListener("dragleave", () => {
            col.classList.remove("drag-over");
        });

        col.addEventListener("drop", e => {
            e.preventDefault();
            col.classList.remove("drag-over");
            const dragging = document.querySelector(".dragging");
            if (dragging) {
                const newStatus = col.dataset.status;
                updateTaskStatus(newStatus, dragging);
            }
        });
    });

    // Encontra o elemento (tarefa) que está abaixo do cursor durante o drag
    function getDragAfterElement(container, y) {
        // Exclui a div do cabeçalho e o elemento que está sendo arrastado
        const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")].filter(el => !el.closest('div').querySelector('h2'));

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
    
    // ===================================
    // FECHAR MODAL
    // ===================================
    
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", e => {
        if (e.target === modal) modal.style.display = "none";
    });
});