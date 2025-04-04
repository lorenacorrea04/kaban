
let currentFontSize = 100;

function adjustFontSize(step) {
    currentFontSize += step * 10;
    if (currentFontSize < 50) currentFontSize = 50;
    if (currentFontSize > 200) currentFontSize = 200;
    document.documentElement.style.fontSize = currentFontSize + "%";
}


document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("taskModal");
    const editModal = document.getElementById("editTaskModal");

    const addTaskBtns = document.querySelectorAll(".icon-add, .task-button");
    const closeModal = document.querySelector(".close");
    const closeEditModal = document.querySelector(".close-edit");

    const addTaskBtn = document.getElementById("addTaskBtn");
    const updateTaskBtn = document.getElementById("updateTaskBtn");

    let currentPhase = "a-fazer";
    let draggedTask = null;
    let editingTask = null;

    addTaskBtns.forEach(button => {
        button.addEventListener("click", (event) => {
            currentPhase = event.target.getAttribute("data-column") || "a-fazer";
            openModal();
        });
    });

    closeModal.addEventListener("click", closeModalAndReset);
    closeEditModal.addEventListener("click", closeEditModalAndReset);

    window.addEventListener("click", (event) => {
        if (event.target === modal) closeModalAndReset();
        if (event.target === editModal) closeEditModalAndReset();
    });

    addTaskBtn.addEventListener("click", () => {
        const title = document.getElementById("taskTitle").value.trim();
        const desc = document.getElementById("taskDesc").value.trim();
        const date = document.getElementById("taskDate").value;

        if (!title) return alert("Por favor, insira um título para a tarefa!");

        const newCard = criarTarefa(title, desc, date);
        document.querySelector(`.kanban-column.${currentPhase} .tasks`).appendChild(newCard);
        updateAllCounters();
        closeModalAndReset();
    });

    updateTaskBtn.addEventListener("click", () => {
        const title = document.getElementById("editTaskTitle").value.trim();
        const desc = document.getElementById("editTaskDesc").value.trim();
        const date = document.getElementById("editTaskDate").value;

        if (!title) return alert("Por favor, insira um título!");

        if (editingTask) {
            updateTaskCard(editingTask, title, desc, date);
        }

        updateAllCounters();
        closeEditModalAndReset();
    });

    function criarTarefa(title, desc, date) {
        const taskCard = document.createElement("div");
        taskCard.classList.add("task-card");
        taskCard.setAttribute("draggable", "true");

        const html = `
            <button class="menu-btn"><i class="fas fa-ellipsis-v"></i></button>
            <div class="menu-options">
                <button class="edit-task"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-task"><i class="fas fa-trash-alt"></i> Excluir</button>
            </div>
            <h3>${title}</h3>
            ${desc ? getDescriptionBlock(desc) : ""}
            <div class="footer">
                <i class="far fa-calendar-alt"></i>
                <span class="due-date">
                    ${date ? `<span class="badge">Venc ${formatDate(date)}</span>` : "Sem prazo"}
                </span>
            </div>
        `;

        taskCard.innerHTML = html;
        setupTaskEvents(taskCard);
        return taskCard;
    }

    function updateTaskCard(card, title, desc, date) {
        card.querySelector("h3").textContent = title;

        const descBlock = card.querySelector(".description-block");
        if (descBlock) descBlock.remove();

        if (desc) {
            const footer = card.querySelector(".footer");
            footer.insertAdjacentHTML("beforebegin", getDescriptionBlock(desc));
        }

        const badgeEl = card.querySelector(".badge");
        const dueSpan = card.querySelector(".due-date");

        if (date) {
            const newDate = `<span class="badge">Venc ${formatDate(date)}</span>`;
            if (badgeEl) badgeEl.outerHTML = newDate;
            else dueSpan.innerHTML = newDate;
        } else {
            dueSpan.textContent = "Sem prazo";
        }
    }

    function setupTaskEvents(taskCard) {
        const menuBtn = taskCard.querySelector(".menu-btn");
        const menuOptions = taskCard.querySelector(".menu-options");

        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // Oculta todos os outros menus abertos antes de abrir o atual
            document.querySelectorAll(".menu-options").forEach(menu => {
                if (menu !== menuOptions) menu.style.display = "none";
            });
            menuOptions.style.display = menuOptions.style.display === "flex" ? "none" : "flex";
        });

        taskCard.querySelector(".edit-task").addEventListener("click", () => {
            const title = taskCard.querySelector("h3")?.textContent.trim() || "";
            const desc = taskCard.querySelector(".task-text")?.textContent.trim() || "";
            const date = extractDateFromCard(taskCard);

            document.getElementById("editTaskTitle").value = title;
            document.getElementById("editTaskDesc").value = desc;
            document.getElementById("editTaskDate").value = date;

            editingTask = taskCard;
            openEditModal();
            menuOptions.style.display = "none";
        });

        taskCard.querySelector(".delete-task").addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                taskCard.remove();
                updateAllCounters();
            }
        });

        taskCard.addEventListener("dragstart", (e) => {
            draggedTask = taskCard;
            e.dataTransfer.setData("text/plain", "");
            taskCard.classList.add("dragging");
        });

        taskCard.addEventListener("dragend", () => {
            draggedTask = null;
            taskCard.classList.remove("dragging");
        });
    }

    // Evento global para fechar todos os menus ao clicar fora
    document.addEventListener("click", (e) => {
        document.querySelectorAll(".menu-options").forEach(menu => {
            if (!menu.contains(e.target) && !e.target.classList.contains("menu-btn") && !e.target.closest(".menu-btn")) {
                menu.style.display = "none";
            }
        });
    });

    function getDescriptionBlock(desc) {
        return `
            <div class="description-block">
                <div class="description-header">
                    <i class="fas fa-align-left"></i>
                    <span>Descrição</span>
                </div>
                <p class="task-text" title="${desc}">${desc}</p>
            </div>
        `;
    }

    function extractDateFromCard(taskCard) {
        const badge = taskCard.querySelector(".badge");
        if (!badge) return "";

        const match = badge.textContent.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!match) return "";

        const [_, day, month, year] = match;
        return `${year}-${month}-${day}`;
    }

    function formatDate(dateString) {
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    }

    function openModal() {
        modal.style.display = "flex";
    }

    function closeModalAndReset() {
        modal.style.display = "none";
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDesc").value = "";
        document.getElementById("taskDate").value = "";
    }

    function openEditModal() {
        editModal.style.display = "flex";
    }

    function closeEditModalAndReset() {
        editModal.style.display = "none";
        document.getElementById("editTaskTitle").value = "";
        document.getElementById("editTaskDesc").value = "";
        document.getElementById("editTaskDate").value = "";
        editingTask = null;
    }

    function updateAllCounters() {
        document.querySelectorAll(".kanban-column").forEach(column => {
            const counter = column.querySelector(".counter");
            const taskCount = column.querySelectorAll(".task-card").length;
            counter.textContent = taskCount;
        });
    }

    document.querySelectorAll(".kanban-column").forEach(column => {
        column.addEventListener("dragover", (e) => e.preventDefault());

        column.addEventListener("drop", () => {
            if (draggedTask) {
                column.querySelector(".tasks").appendChild(draggedTask);
                updateAllCounters();
            }
        });
    });


});
