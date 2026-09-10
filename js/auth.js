// Authentication Logic (Day 6)

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function showError(message) {
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  } else {
    alert(message);
  }
}

// ============================================
// SIGN UP
// ============================================
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: role
      });

      // Redirect based on role
      window.location.href = "dashboard.html";

    } catch (error) {
      showError(error.message);
    }
  });
}

// ============================================
// LOGIN
// ============================================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user's role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } else {
        window.location.href = "dashboard.html";
      }

    } catch (error) {
      showError("Invalid email or password.");
    }
  });
}

// ============================================
// LOGOUT (works on any page with a logout link)
// ============================================
const logoutLinks = document.querySelectorAll(".logout");
logoutLinks.forEach((link) => {
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = "index.html";
  });
});

// ============================================
// PROTECT PAGES (redirect to login if not signed in)
// ============================================
const protectedPages = ["dashboard.html", "search.html", "routine.html", "bookings.html", "admin.html"];
const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
    }
  });
}