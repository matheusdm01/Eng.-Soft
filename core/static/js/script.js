document.addEventListener("DOMContentLoaded", function () {
    // A URL base da sua API Django. Deve ser '/api/tarefas/' se você usou as rotas sugeridas.
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
    
    // ===================================
    // VARIÁVEIS DE ESTADO
    // ===================================

    // Variável para armazenar a tarefa principal sendo editada/visualizada (o elemento DOM)
    let currentTaskElement = null;

    // ===================================
    // FUNÇÕES DE UTILIDADE E AJAX (CSRF, API REQUEST)
    // ===================================

    // Obtém o CSRF Token (necessário para segurança do Django)
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
    // MANIPULAÇÃO DO MODAL
    // ===================================

    /* REVERTE A VISUALIZAÇÃO DO MODAL PARA O MODO PADRÃO (TAREFA PRINCIPAL) */
    function resetModalView() {
        // Exibe/Restaura campos de Tarefa Principal (usando 'closest(div)' para encontrar os wrappers)
        const createdDiv = document.getElementById("taskCreated").closest('div');
        if (createdDiv) createdDiv.style.display = 'block'; // Usando 'block' para restaurar
        
        const deadlineDiv = document.getElementById("taskDeadline").closest('div');
        if (deadlineDiv) deadlineDiv.style.display = 'block';
        
        const fileDiv = document.getElementById("taskFile").closest('div');
        if (fileDiv) fileDiv.style.display = 'block';
        
        // Restaura a visibilidade dos elementos de sub-tarefa e input
        const subtaskListContainer = document.getElementById('subtaskList').closest('div') || document.getElementById('subtaskList').parentNode;
        if (subtaskListContainer) subtaskListContainer.style.display = 'block';

        const subtaskInputDiv = document.querySelector('.subtask-input');
        if(subtaskInputDiv) subtaskInputDiv.style.display = 'flex'; // Usando 'flex' para restaurar o layout

        saveTaskBtn.textContent = 'Salvar';
        saveTaskBtn.dataset.actionType = 'task_update_create';
        
        // Limpa os campos para evitar confusão se o modal for reaberto
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDesc").value = "";
        document.getElementById("taskCreated").value = ""; 
        document.getElementById("taskDeadline").value = "";
        document.getElementById("taskFile").value = "";
        subtaskList.innerHTML = "";
    }

    /* ABRIR MODAL PARA NOVA TAREFA (CREATE) */
    addButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            resetModalView();
            const column = btn.closest(".kanban-column");
            modal.dataset.mode = "create";
            modal.dataset.column = column.dataset.status;
            modal.dataset.taskId = ""; 
            modalTitle.textContent = "Criar Nova Tarefa";
            
            // Define data de criação padrão para hoje
            document.getElementById("taskCreated").value = new Date().toISOString().slice(0,10); 
            
            subtaskList.innerHTML = "<li>Subtarefas só podem ser adicionadas após a criação da tarefa principal.</li>";
            addSubtaskBtn.disabled = true;

            currentTaskElement = null;
            modal.style.display = "flex"; 
        });
    });

    /* ABRIR MODAL AO CLICAR NA TAREFA PRINCIPAL (VIEW/UPDATE) */
    function openTaskModal(taskElement) {
        resetModalView();
        const taskId = taskElement.dataset.id;
        if (!taskId) return; 

        currentTaskElement = taskElement;
        modal.dataset.mode = "view";
        modal.dataset.taskId = taskId;
        modalTitle.textContent = taskElement.dataset.title;

        const fileUrl = taskElement.dataset.file;
        
        document.getElementById("taskTitle").value = taskElement.dataset.title;
        document.getElementById("taskDesc").value = taskElement.dataset.desc;
        document.getElementById("taskCreated").value = taskElement.dataset.created;
        document.getElementById("taskDeadline").value = taskElement.dataset.deadline;
        document.getElementById("taskFile").value = fileUrl;

        const subtasksJson = taskElement.dataset.subtasks;
        renderSubtasks(subtasksJson, taskId); 
        addSubtaskBtn.disabled = false;

        modal.style.display = "flex"; 
    }
    
    /* ABRIR MODAL EXCLUSIVO PARA SUBTAREFA (VIEW/UPDATE) */
    function openTaskModalForSubtask(subtaskData, parentId) {
        // 1. Configura o modal para o modo 'subtask'
        modal.dataset.mode = "subtask_view";
        modal.dataset.taskId = subtaskData.id;
        modal.dataset.parentId = parentId;

        modalTitle.textContent = `Subtarefa: ${subtaskData.title}`;

        // 2. Preenche os campos 
        document.getElementById("taskTitle").value = subtaskData.title;
        document.getElementById("taskDesc").value = subtaskData.desc || ''; 
        document.getElementById("taskDeadline").value = subtaskData.deadline || '';
        document.getElementById("taskCreated").value = ''; 

        // 3. Desabilita/esconde campos irrelevantes
        // Usando .closest('div') para encontrar os wrappers no HTML
        document.getElementById("taskCreated").closest('div').style.display = 'none';
        document.getElementById("taskFile").closest('div').style.display = 'none';
        document.getElementById("taskDeadline").closest('div').style.display = 'block'; // Prazo é relevante para subtarefas
        
        document.querySelector('.subtask-input').style.display = 'none';
        const subtaskListContainer = document.getElementById('subtaskList').closest('div') || document.getElementById('subtaskList').parentNode;
        if (subtaskListContainer) subtaskListContainer.style.display = 'none';

        // 4. Muda o botão Salvar
        saveTaskBtn.textContent = 'Salvar Subtarefa';
        saveTaskBtn.dataset.actionType = 'subtask_update';

        modal.style.display = "flex"; 
    }

    /* SALVAR TAREFA DO MODAL (CREATE/UPDATE/SUBTASK UPDATE) */
    saveTaskBtn.addEventListener("click", async () => {
        const title = document.getElementById("taskTitle").value.trim();
        const desc = document.getElementById("taskDesc").value.trim();
        
        // CORREÇÃO CRÍTICA: Envia null se a string estiver vazia para evitar o erro 'isoformat' do Django.
        const deadline = document.getElementById("taskDeadline").value || null; 
        
        const file = document.getElementById("taskFile").value.trim() || null;

        if (!title) {
            alert("O título da tarefa é obrigatório!");
            return;
        }

        let success = false;
        let resultTask = null;

        if (modal.dataset.mode === "create") {
            // Lógica para CRIAR TAREFA PRINCIPAL (POST)
            const taskData = {
                titulo: title,
                descricao: desc,
                // data_criacao é opcional/automatico no seu serializer, mas enviamos prazo/arquivo
                prazo: deadline, 
                arquivo: file,
            };
            
            resultTask = await apiRequest(API_URL, 'POST', taskData);
            if (resultTask) {
                const newStatus = "pendente"; 
                const column = document.querySelector(`.kanban-column[data-status="${newStatus}"]`);
                const newTaskElement = createNewTaskElement(resultTask, newStatus);
                // Insere a nova tarefa após o container do botão 'Adicionar Tarefa'
                const insertPoint = column.querySelector(".add-task-btn").parentNode.nextSibling;
                column.insertBefore(newTaskElement, insertPoint); 
                success = true;
            }

        } else if (modal.dataset.mode === "view" && currentTaskElement) {
            // Lógica para EDITAR TAREFA PRINCIPAL (PATCH)
            const taskId = currentTaskElement.dataset.id;
            const taskData = {
                titulo: title,
                descricao: desc,
                prazo: deadline, // Agora envia null ou a data
                arquivo: file,
            };
            
            resultTask = await apiRequest(`${API_URL}${taskId}/`, 'PATCH', taskData);
            
            if (resultTask) {
                updateTaskElement(currentTaskElement, resultTask);
                success = true;
            }
        } else if (modal.dataset.mode === "subtask_view") {
            // Lógica para EDITAR SUBTAREFA (PATCH)
            const subtaskId = modal.dataset.taskId;
            
            const subtaskUpdateData = {
                titulo: title,
                descricao: desc,
                prazo: deadline, // CORREÇÃO: Envia null se vazio
            };

            // ATENÇÃO: Se o seu Django forçar 'parent' para subtarefas, pode falhar.
            // O endpoint correto DEVE ser: /api/tarefas/{subtask_id}/ para atualização.
            resultTask = await apiRequest(`${API_URL}${subtaskId}/`, 'PATCH', subtaskUpdateData);
            
            if (resultTask) {
                // Notifica o usuário de que a alteração foi salva
                alert(`Subtarefa "${title}" salva com sucesso!`);
                success = true;
            }
        }
        
        if (success) {
            // FECHA O MODAL
            modal.style.display = "none";
            // Reseta a view para garantir a próxima abertura correta
            resetModalView();
        }
    });

    // ===================================
    // MANIPULAÇÃO DO DOM E SUBTAREFAS
    // ===================================
    
    /* CRIA NOVO ELEMENTO DOM DE TAREFA (APÓS POST) */
    function createNewTaskElement(task, status) {
        const newTask = document.createElement("div");
        newTask.classList.add("task");
        newTask.setAttribute("draggable", "true");
        newTask.dataset.id = task.pk; 
        newTask.dataset.status = status; 
        newTask.dataset.title = task.titulo;
        newTask.dataset.desc = task.descricao;
        const dateCreated = task.data_criacao ? task.data_criacao.substring(0, 10) : new Date().toISOString().slice(0,10);
        newTask.dataset.created = dateCreated; 
        newTask.dataset.deadline = task.prazo || '';
        newTask.dataset.file = task.arquivo || '';
        // Assume que uma nova tarefa não tem subtarefas por enquanto
        newTask.dataset.subtasks = '[]'; 
        
        // Exibição da tarefa (pode ser ajustada para mostrar o progresso real)
        newTask.innerHTML = `${task.titulo} <span class="done-btn"> - 📌 0%</span> <span class="delete-btn">❌</span>`;

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

    /* CRIA LI DE SUBTAREFA E APLICA EVENTOS */
    function createSubtaskListItem(subtaskData, parentId) {
        const li = document.createElement("li");
        li.classList.add("subtask-item");
        li.dataset.subtaskId = subtaskData.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = subtaskData.done;
        
        // Evento para marcar/desmarcar (PATCH)
        checkbox.addEventListener("change", async () => {
            const SUBTASK_API_URL = `${API_URL}${subtaskData.id}/`; 
            const data = { concluido: checkbox.checked };
            
            const updatedSubtask = await apiRequest(SUBTASK_API_URL, 'PATCH', data);
            
            if (updatedSubtask) {
                subtaskData.done = checkbox.checked;
                li.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
            } else {
                checkbox.checked = !checkbox.checked; 
            }
        });

        const label = document.createElement("span");
        label.textContent = subtaskData.title;
        label.style.marginLeft = "8px";
        li.style.textDecoration = subtaskData.done ? 'line-through' : 'none';

        // Abre o modal para edição da subtarefa
        label.addEventListener("click", () => {
            openTaskModalForSubtask(subtaskData, parentId);
        });

        li.appendChild(checkbox);
        li.appendChild(label);
        return li;
    }
    
    /* RENDERIZAR SUBTAREFAS */
    function renderSubtasks(subtasksJson, parentId) {
        subtaskList.innerHTML = "";
        let subtasks = [];
        try { 
            // O JSON.parse pode falhar se a string for inválida
            subtasks = JSON.parse(subtasksJson || "[]"); 
        } catch (e) {
            console.error("Erro ao fazer parse das subtarefas:", e);
        }

        if (subtasks.length === 0) {
            subtaskList.innerHTML = "<li>Nenhuma subtarefa adicionada.</li>";
            return;
        }

        subtasks.forEach((st) => {
            const st_data = {
                id: st.id || st.pk,
                title: st.title || st.titulo,
                done: st.done || st.concluido,
                desc: st.descricao || '', 
                prazo: st.prazo || '' // Usando 'prazo'
            };

            const li = createSubtaskListItem(st_data, parentId);
            subtaskList.appendChild(li);
        });
    }

    /* ADICIONAR SUBTAREFA (API) */
    addSubtaskBtn.addEventListener("click", async () => {
        const title = newSubtaskInput.value.trim();
        const parentId = modal.dataset.taskId; 

        if (!title || !parentId) {
            alert("Atenção! ID da tarefa principal ausente.");
            return;
        }

        // Endpoint de criação de subtarefas, que deve ser implementado no backend
        const SUBTASK_CREATE_URL = `${API_URL}${parentId}/subtarefas/`; 
        
        const data = { 
            titulo: title,
            // O backend deve usar o parentId da URL para atribuir o campo 'parent'
            // parent: parentId // Não deve ser necessário se o endpoint for bem configurado
        }; 

        const newSubtask = await apiRequest(SUBTASK_CREATE_URL, 'POST', data); 
        
        if (newSubtask) {
            const st_data = {
                id: newSubtask.id || newSubtask.pk,
                title: newSubtask.title || newSubtask.titulo,
                done: newSubtask.done || newSubtask.concluido,
                desc: newSubtask.descricao || '', 
                prazo: newSubtask.prazo || ''
            };
            
            const li = createSubtaskListItem(st_data, parentId);
            
            // Remove a mensagem inicial se existir
            const firstLi = subtaskList.querySelector('li');
            if (firstLi && firstLi.textContent.includes("Subtarefas só podem ser adicionadas")) {
                subtaskList.innerHTML = '';
            }
            
            subtaskList.appendChild(li);
            newSubtaskInput.value = "";
        }
    });

    // ===================================
    // EVENTOS GERAIS (DRAG & DELETE)
    // ===================================
    
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

        // Abrir modal ao clicar na tarefa principal
        task.addEventListener("click", e => {
            if (e.target.classList.contains("delete-btn") || e.target.classList.contains("done-btn")) return;
            openTaskModal(task);
        });
    }
    document.querySelectorAll(".task").forEach(applyTaskEvents);

    /* ATUALIZAR STATUS DA TAREFA (PATCH no Drag & Drop) */
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
            // Você precisará atualizar o progresso visual aqui, se o backend retornar o novo progresso.
        }
    }
    
    /* LÓGICA DE MOVER E DRAG & DROP */
    function moveTaskTo(status, task) {
        const column = document.querySelector(`.kanban-column[data-status="${status}"]`);
        if (column) {
            // Ponto de inserção: após o container do botão "Adicionar Tarefa"
            const nextInsertPoint = column.querySelector(".add-task-btn").parentNode.nextSibling;
            column.insertBefore(task, nextInsertPoint); 
        }
    }
    
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

    function getDragAfterElement(container, y) {
        // Ignora o botão 'Adicionar Tarefa' e usa apenas elementos '.task'
        const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")];

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
    
    /* FECHAR MODAL PELO BOTÃO X */
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
        resetModalView();
    });

    /* FECHAR MODAL AO CLICAR FORA */
    window.addEventListener("click", e => {
        if (e.target === modal) {
            modal.style.display = "none";
            resetModalView();
        }
    });
});