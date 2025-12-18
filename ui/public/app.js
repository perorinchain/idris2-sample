const tableBody = document.querySelector("#task-table tbody");
const addBtn = document.getElementById("add-task");
const applyBtn = document.getElementById("apply-btn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const coverageEl = document.getElementById("coverage");

let tasks = [];

function renderTable() {
  tableBody.innerHTML = "";
  tasks.forEach((task, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.id}</td>
      <td><input type="text" value="${task.description.replace(/"/g, "&quot;")}" data-index="${index}" data-field="description" /></td>
      <td>
        <select class="status-select" data-index="${index}" data-field="status">
          ${["Todo", "InProgress", "Done"]
            .map(
              (status) =>
                `<option value="${status}" ${
                  status === task.status ? "selected" : ""
                }>${status}</option>`
            )
            .join("")}
        </select>
      </td>
      <td><button data-remove="${index}">Remove</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function nextId() {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map((t) => t.id)) + 1;
}

tableBody.addEventListener("input", (event) => {
  const index = event.target.dataset.index;
  const field = event.target.dataset.field;
  if (index === undefined || !field) return;
  tasks[index][field] = event.target.value;
});

tableBody.addEventListener("change", (event) => {
  const index = event.target.dataset.index;
  const field = event.target.dataset.field;
  if (index === undefined || !field) return;
  tasks[index][field] = event.target.value;
});

tableBody.addEventListener("click", (event) => {
  const removeIndex = event.target.dataset.remove;
  if (removeIndex !== undefined) {
    tasks.splice(Number(removeIndex), 1);
    renderTable();
  }
});

addBtn.addEventListener("click", () => {
  tasks.push({
    id: nextId(),
    description: "New task",
    status: "Todo",
  });
  renderTable();
});

applyBtn.addEventListener("click", async () => {
  statusEl.textContent = "Applying changes...";
  try {
    const response = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();
    statusEl.textContent = "Rebuilt Idris sample and refreshed coverage.";
    outputEl.textContent = result.appOutput;
    renderCoverage(result.coverage);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed: " + err.message;
  }
});

function renderCoverage(coverage) {
  if (!coverage) {
    coverageEl.textContent = "No coverage data.";
    return;
  }
  const list = coverage.high_impact_targets || [];
  const summary = coverage.summary;
  let html = "";
  if (summary) {
    html += `<p>Total functions: ${summary.total_functions}, canonical: ${summary.total_canonical}</p>`;
  }
  if (list.length === 0) {
    html += "<p>No high impact targets.</p>";
  } else {
    html += "<ul>";
    list.forEach((entry) => {
      html += `<li><code>${entry.moduleName}.${entry.funcName}</code> - ${entry.note}</li>`;
    });
    html += "</ul>";
  }
  coverageEl.innerHTML = html;
}

async function loadInitialBoard() {
  const response = await fetch("/api/board");
  const data = await response.json();
  tasks = data.tasks;
  renderTable();
  if (data.lastCoverage) {
    renderCoverage(data.lastCoverage);
  }
  if (data.lastAppOutput) {
    outputEl.textContent = data.lastAppOutput;
  }
}

loadInitialBoard().catch((err) => {
  console.error(err);
  statusEl.textContent = "Failed to load board: " + err.message;
});
