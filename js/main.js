// js/main.js
import { BASE_URL, getToken, setToken, register, login, showError, hideError } from "./auth.js";
import { saveQuestion, loadQuestions, clearForm, editQuestion, deleteQuestion, uploadImage, addBulkQuestions, clearBulkArea, initTypeSwitch, initBulkMode } from "./questions.js";
import { initUI, bindNavigation, initTheme, initDropdown, bindLogout, initPasswordToggle, setShowPageCallback } from "./ui.js";

// DOM elements
const loginDiv = document.getElementById("login");
const dashboardDiv = document.getElementById("dashboard");
const homeDiv = document.getElementById("home");
const addSection = document.getElementById("addQuestionSection");
const listSection = document.getElementById("myQuestionsSection");

const signinTab = document.getElementById("signinTabBtn");
const signupTab = document.getElementById("signupTabBtn");
const signinContainer = document.getElementById("signinFormContainer");
const signupContainer = document.getElementById("signupFormContainer");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const msgDiv = document.getElementById("msg");
const signupMsgDiv = document.getElementById("signupMsg");

// Helper: show/hide auth tabs
function setActiveTab(tab) {
  if (tab === "signin") {
    signinTab.classList.add("active");
    signupTab.classList.remove("active");
    signinContainer.classList.remove("form-hidden");
    signupContainer.classList.add("form-hidden");
    hideError(msgDiv);
    hideError(signupMsgDiv);
  } else {
    signupTab.classList.add("active");
    signinTab.classList.remove("active");
    signupContainer.classList.remove("form-hidden");
    signinContainer.classList.add("form-hidden");
    hideError(msgDiv);
    hideError(signupMsgDiv);
  }
}

// Page navigation
export function showPage(page) {
  homeDiv.style.display = page === "home" ? "block" : "none";
  addSection.style.display = page === "add" ? "block" : "none";
  listSection.style.display = page === "list" ? "block" : "none";
  if (page === "list") loadQuestions();
  if (page === "add") clearForm();
}

// Logout function
function handleLogout() {
  setToken(null);
  loginDiv.style.display = "flex";
  dashboardDiv.style.display = "none";
  setActiveTab("signin");
  document.getElementById("questionList").innerHTML = "";
  document.getElementById("signinEmail").value = "";
  document.getElementById("signinPassword").value = "";
}

// Auth event handlers
signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signinEmail").value.trim();
  const password = document.getElementById("signinPassword").value;
  const result = await login(email, password);
  if (result.ok) {
    loginDiv.style.display = "none";
    dashboardDiv.style.display = "block";
    showPage("home");
    loadQuestions();
    clearForm();
    if (window.innerWidth < 768) {
      document.getElementById("sidebar").classList.remove("show-mobile");
    }
  } else {
    showError(msgDiv, result.message);
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const school = document.getElementById("signupSchool").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirmPassword").value;
  const result = await register(school, email, password, confirm);
  if (result.ok) {
    alert("Account created! Please sign in.");
    setActiveTab("signin");
    document.getElementById("signupSchool").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("signupConfirmPassword").value = "";
  } else {
    showError(signupMsgDiv, result.message);
  }
});

signinTab.addEventListener("click", () => setActiveTab("signin"));
signupTab.addEventListener("click", () => setActiveTab("signup"));

// Initialize UI modules
initUI();
initTheme();
initDropdown();
initPasswordToggle();
initTypeSwitch();
initBulkMode();

// Bind navigation
bindNavigation(showPage);
bindLogout(handleLogout);

// Set callback for ui.js to call showPage (circular dependency handled)
setShowPageCallback(showPage);

// Bind button events for question actions
document.getElementById("saveQuestionBtn").addEventListener("click", saveQuestion);
document.getElementById("clearFormBtn").addEventListener("click", clearForm);
document.getElementById("scanImageBtn").addEventListener("click", uploadImage);
document.getElementById("bulkAddBtn").addEventListener("click", addBulkQuestions);
document.getElementById("clearBulkBtn").addEventListener("click", clearBulkArea);

// Initial token check
window.onload = async () => {
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${BASE_URL}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        setToken(null);
        loginDiv.style.display = "flex";
        dashboardDiv.style.display = "none";
        setActiveTab("signin");
      } else {
        loginDiv.style.display = "none";
        dashboardDiv.style.display = "block";
        showPage("home");
        loadQuestions();
        if (window.innerWidth < 768) {
          document.getElementById("sidebar").classList.remove("show-mobile");
        } else {
          document.getElementById("sidebar").classList.remove("collapsed");
          document.getElementById("content").style.marginLeft = "260px";
        }
      }
    } catch (err) {
      setToken(null);
      loginDiv.style.display = "flex";
      dashboardDiv.style.display = "none";
      setActiveTab("signin");
    }
  } else {
    loginDiv.style.display = "flex";
    dashboardDiv.style.display = "none";
    setActiveTab("signin");
  }
};
