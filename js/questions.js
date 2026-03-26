// js/questions.js
import { BASE_URL, getToken, setToken, showError, hideError } from "./auth.js";
import { showPage } from "./main.js";

export let editId = null;

// DOM elements
const classInput = document.getElementById("class");
const subjectInput = document.getElementById("subject");
const chapterInput = document.getElementById("chapter");
const typeSelect = document.getElementById("type");
const questionTextarea = document.getElementById("questionText");
const marksInput = document.getElementById("marks");
const correctAnswerInput = document.getElementById("correctAnswer");

const optA = document.getElementById("optA");
const optB = document.getElementById("optB");
const optC = document.getElementById("optC");
const optD = document.getElementById("optD");

const colA1 = document.getElementById("colA1");
const colA2 = document.getElementById("colA2");
const colA3 = document.getElementById("colA3");
const colB1 = document.getElementById("colB1");
const colB2 = document.getElementById("colB2");
const colB3 = document.getElementById("colB3");

const bulkCheckbox = document.getElementById("bulkModeCheckbox");
const bulkArea = document.getElementById("bulkArea");
const bulkQuestionsTextarea = document.getElementById("bulkQuestions");
const bulkStatusDiv = document.getElementById("bulkStatus");

// ==================== Helper Functions ====================
export function clearForm() {
  editId = null;
  classInput.value = "";
  subjectInput.value = "";
  chapterInput.value = "";
  questionTextarea.value = "";
  marksInput.value = "";
  correctAnswerInput.value = "";
  optA.value = "";
  optB.value = "";
  optC.value = "";
  optD.value = "";
  colA1.value = "";
  colA2.value = "";
  colA3.value = "";
  colB1.value = "";
  colB2.value = "";
  colB3.value = "";
  typeSelect.value = "MCQ";
  typeSelect.dispatchEvent(new Event("change"));
}

function getQuestionFromForm() {
  let options = {};
  if (typeSelect.value === "MCQ") {
    options = { A: optA.value, B: optB.value, C: optC.value, D: optD.value };
  } else if (typeSelect.value === "MATCH") {
    options = {
      colA: [colA1.value, colA2.value, colA3.value],
      colB: [colB1.value, colB2.value, colB3.value]
    };
  }
  return {
    cls: classInput.value,
    subject: subjectInput.value,
    chapter: chapterInput.value,
    text: questionTextarea.value,
    marks: marksInput.value,
    type: typeSelect.value,
    options,
    correctAnswer: correctAnswerInput.value
  };
}

// ==================== CRUD Operations ====================
export async function saveQuestion() {
  const token = getToken();
  if (!token) return false;
  const questionData = getQuestionFromForm();

  const url = editId ? `${BASE_URL}/update-question/${editId}` : `${BASE_URL}/add-question`;
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(questionData)
    });
    if (res.ok) {
      alert(editId ? "Question updated!" : "Question saved!");
      editId = null;
      clearForm();
      await loadQuestions();
      showPage("list");
      return true;
    } else {
      if (res.status === 401) logoutAndRedirect();
      else alert("Failed to save question");
      return false;
    }
  } catch (err) {
    alert("Error connecting to server");
    return false;
  }
}

export async function loadQuestions() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${BASE_URL}/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      logoutAndRedirect();
      return;
    }
    const data = await res.json();
    renderFolderView(data);
  } catch (err) {
    console.error(err);
  }
}

export async function deleteQuestion(id) {
  const token = getToken();
  if (!token || !confirm("Delete this question?")) return;
  const res = await fetch(`${BASE_URL}/delete-question/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) logoutAndRedirect();
  else await loadQuestions();
}

export async function editQuestion(id) {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${BASE_URL}/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      logoutAndRedirect();
      return;
    }
    const questions = await res.json();
    const question = questions.find(q => q._id === id);
    if (!question) return;

    editId = id;
    classInput.value = question.cls || "";
    subjectInput.value = question.subject || "";
    chapterInput.value = question.chapter || "";
    questionTextarea.value = question.text || "";
    marksInput.value = question.marks || "";
    correctAnswerInput.value = question.correctAnswer || "";

    typeSelect.value = question.type || "MCQ";
    typeSelect.dispatchEvent(new Event("change"));

    if (question.type === "MCQ" && question.options) {
      optA.value = question.options.A || "";
      optB.value = question.options.B || "";
      optC.value = question.options.C || "";
      optD.value = question.options.D || "";
    } else if (question.type === "MATCH" && question.options) {
      const colA = question.options.colA || [];
      const colB = question.options.colB || [];
      colA1.value = colA[0] || "";
      colA2.value = colA[1] || "";
      colA3.value = colA[2] || "";
      colB1.value = colB[0] || "";
      colB2.value = colB[1] || "";
      colB3.value = colB[2] || "";
    }

    showPage("add");
  } catch (err) {
    alert("Could not load question for editing");
  }
}

// ==================== Folder View ====================
function renderFolderView(questions) {
  const container = document.getElementById("questionList");
  container.innerHTML = "";

  if (!questions || questions.length === 0) {
    container.innerHTML = "<p>No questions yet. Add some!</p>";
    return;
  }

  // Group by class
  const groupedByClass = {};
  questions.forEach(q => {
    const className = q.cls && q.cls.trim() !== "" ? q.cls : "Uncategorized";
    if (!groupedByClass[className]) groupedByClass[className] = [];
    groupedByClass[className].push(q);
  });

  for (const className in groupedByClass) {
    const classQuestions = groupedByClass[className];

    // Group by chapter
    const groupedByChapter = {};
    classQuestions.forEach(q => {
      const chapterName = q.chapter && q.chapter.trim() !== "" ? q.chapter : "General";
      if (!groupedByChapter[chapterName]) groupedByChapter[chapterName] = [];
      groupedByChapter[chapterName].push(q);
    });

    const classDiv = document.createElement("div");
    classDiv.className = "folder";
    const classHeader = document.createElement("div");
    classHeader.className = "folder-header";
    classHeader.innerHTML = `<i class="fas fa-folder"></i> <span>${className}</span> <i class="fas fa-chevron-right" style="margin-left:auto;"></i>`;
    classDiv.appendChild(classHeader);

    const classChildren = document.createElement("div");
    classChildren.className = "folder-children";
    classDiv.appendChild(classChildren);

    for (const chapterName in groupedByChapter) {
      const chapterQuestions = groupedByChapter[chapterName];
      const chapterDiv = document.createElement("div");
      chapterDiv.className = "chapter-folder";
      const chapterHeader = document.createElement("div");
      chapterHeader.className = "chapter-header";
      chapterHeader.innerHTML = `<i class="fas fa-folder-open"></i> <span>${chapterName}</span> <i class="fas fa-chevron-right" style="margin-left:auto;"></i>`;
      chapterDiv.appendChild(chapterHeader);

      const chapterChildren = document.createElement("div");
      chapterChildren.className = "chapter-children";
      chapterDiv.appendChild(chapterChildren);

      chapterQuestions.forEach(q => {
        const card = createQuestionCard(q);
        chapterChildren.appendChild(card);
      });

      classChildren.appendChild(chapterDiv);

      // Toggle chapter expansion
      chapterHeader.addEventListener("click", (e) => {
        e.stopPropagation();
        const icon = chapterHeader.querySelector("i:last-child");
        chapterChildren.classList.toggle("open");
        icon.classList.toggle("fa-chevron-right");
        icon.classList.toggle("fa-chevron-down");
      });
      chapterChildren.classList.remove("open");
      chapterHeader.querySelector("i:last-child").classList.add("fa-chevron-right");
    }

    container.appendChild(classDiv);

    // Toggle class expansion
    classHeader.addEventListener("click", () => {
      const icon = classHeader.querySelector("i:last-child");
      classChildren.classList.toggle("open");
      icon.classList.toggle("fa-chevron-right");
      icon.classList.toggle("fa-chevron-down");
    });
    classChildren.classList.remove("open");
    classHeader.querySelector("i:last-child").classList.add("fa-chevron-right");
  }
}

function createQuestionCard(q) {
  const card = document.createElement("div");
  card.className = "question-card";
  let optionsHtml = "";
  if (q.type === "MCQ" && q.options) {
    optionsHtml = `<br>A. ${q.options.A || ""}<br>B. ${q.options.B || ""}<br>C. ${q.options.C || ""}<br>D. ${q.options.D || ""}<br>`;
  } else if (q.type === "MATCH" && q.options) {
    optionsHtml = `<br>Column A: ${(q.options.colA || []).join(", ")}<br>Column B: ${(q.options.colB || []).join(", ")}<br>`;
  }
  card.innerHTML = `
    <b>${q.subject || "No subject"} | ${q.type}</b><br>
    ${q.text}<br>
    ${optionsHtml}
    ✅ Correct: ${q.correctAnswer || "—"}<br>
    ⭐ Marks: ${q.marks || 0}<br>
    <div class="flex-buttons" style="margin-top:8px;">
      <button class="edit-question" data-id="${q._id}" style="background:#3b82f6;">Edit</button>
      <button class="delete-question" data-id="${q._id}" style="background:#ef4444;">Delete</button>
    </div>
  `;
  const editBtn = card.querySelector(".edit-question");
  const deleteBtn = card.querySelector(".delete-question");
  editBtn.addEventListener("click", () => editQuestion(q._id));
  deleteBtn.addEventListener("click", () => deleteQuestion(q._id));
  return card;
}

function logoutAndRedirect() {
  setToken(null);
  window.location.reload();
}

// ==================== OCR ====================
export async function uploadImage() {
  const token = getToken();
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];
  if (!file) return alert("Select an image");
  const fd = new FormData();
  fd.append("image", file);
  try {
    const res = await fetch(`${BASE_URL}/ocr`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });
    if (res.status === 401) logoutAndRedirect();
    const data = await res.json();
    questionTextarea.value = data.text || "OCR failed";
  } catch (err) {
    alert("OCR error");
  }
}

// ==================== Bulk Import ====================
export async function addBulkQuestions() {
  const token = getToken();
  if (!token) return;
  const rawText = bulkQuestionsTextarea.value;
  if (!rawText.trim()) {
    showError(bulkStatusDiv, "Please paste at least one question.");
    return;
  }

  // Split by newline first
  let lines = rawText.split(/\r?\n/);
  let questions = [];
  if (lines.length === 1 && lines[0].includes("/")) {
    questions = lines[0].split("/").map(q => q.trim()).filter(q => q.length > 0);
  } else {
    questions = lines.filter(line => line.trim().length > 0);
  }

  if (questions.length === 0) {
    showError(bulkStatusDiv, "No valid questions found.");
    return;
  }

  const commonClass = classInput.value;
  const commonSubject = subjectInput.value;
  const commonChapter = chapterInput.value;
  const commonType = typeSelect.value;
  const commonMarks = marksInput.value;
  const commonCorrectAnswer = correctAnswerInput.value;

  let commonOptions = {};
  if (commonType === "MCQ") {
    commonOptions = { A: optA.value, B: optB.value, C: optC.value, D: optD.value };
  } else if (commonType === "MATCH") {
    commonOptions = {
      colA: [colA1.value, colA2.value, colA3.value],
      colB: [colB1.value, colB2.value, colB3.value]
    };
  }

  let successCount = 0, failCount = 0;

  for (const text of questions) {
    const questionData = {
      cls: commonClass,
      subject: commonSubject,
      chapter: commonChapter,
      text: text,
      marks: commonMarks,
      type: commonType,
      options: commonOptions,
      correctAnswer: commonCorrectAnswer
    };
    try {
      const res = await fetch(`${BASE_URL}/add-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });
      if (res.ok) successCount++;
      else failCount++;
    } catch (err) {
      failCount++;
    }
  }

  if (successCount > 0) {
    bulkStatusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Added ${successCount} questions successfully.${failCount > 0 ? ` ${failCount} failed.` : ""}`;
    bulkStatusDiv.style.backgroundColor = "#d1fae5";
    bulkStatusDiv.style.color = "#065f46";
    bulkStatusDiv.style.display = "block";
    await loadQuestions();
    bulkQuestionsTextarea.value = "";
    showPage("list");
  } else {
    showError(bulkStatusDiv, `Failed to add any questions. ${failCount} errors.`);
  }
  setTimeout(() => {
    bulkStatusDiv.style.display = "none";
  }, 5000);
}

export function clearBulkArea() {
  bulkQuestionsTextarea.value = "";
  hideError(bulkStatusDiv);
}

// ==================== UI Initialisers ====================
export function initBulkMode() {
  if (bulkCheckbox) {
    bulkCheckbox.addEventListener("change", () => {
      bulkArea.style.display = bulkCheckbox.checked ? "block" : "none";
      const singleForm = document.getElementById("singleQuestionForm");
      if (singleForm) {
        singleForm.style.opacity = bulkCheckbox.checked ? "0.5" : "1";
      }
    });
  }
}

export function initTypeSwitch() {
  const mcqBox = document.getElementById("mcqBox");
  const matchBox = document.getElementById("matchBox");
  if (typeSelect && mcqBox && matchBox) {
    typeSelect.addEventListener("change", () => {
      mcqBox.style.display = typeSelect.value === "MCQ" ? "block" : "none";
      matchBox.style.display = typeSelect.value === "MATCH" ? "block" : "none";
    });
    // initial call
    typeSelect.dispatchEvent(new Event("change"));
  }
}
