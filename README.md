# 🏫 Empty Classroom Finder

A web application that shows real-time classroom availability in a university department — helping teachers and students quickly find free rooms for extra classes, tests, or study, without wandering from room to room.

🔗 **Live Demo:** https://muntasinrima.github.io/empty-classroom-finder/

---

## 📌 Problem It Solves

In busy departments, finding an empty classroom for an extra class, a surprise test, or quiet study time is often a hassle — teachers and students waste time checking room after room only to find them occupied. Empty Classroom Finder solves this by showing live room status and letting users book available rooms directly from the app.

---

## ✨ Features

- 🔐 **Authentication** — Secure signup/login with role-based access (Student, Teacher, Admin)
- 🔍 **Search Room** — Check if a specific room is free at a chosen day/time
- 📅 **Full Routine View** — Browse the complete department class schedule, filterable by day and room
- 📝 **Room Booking** — Book a free room for an extra class or test, with automatic conflict detection to prevent double-booking
- 📋 **My Bookings** — View and cancel your own upcoming bookings
- ⚙️ **Admin Panel** — Manage class routines, rooms, and all bookings across the department
- 📱 **Fully Responsive** — Works smoothly on desktop, tablet, and mobile devices
- 🔔 **Toast Notifications** — Clean, non-intrusive feedback for actions like booking and deleting

---

## 🛠️ Tech Stack

| Layer              | Technology                        |
| ------------------ | --------------------------------- |
| Frontend           | HTML5, CSS3, JavaScript (Vanilla) |
| Backend / Database | Firebase Firestore                |
| Authentication     | Firebase Authentication           |
| Hosting            | GitHub Pages                      |
| Version Control    | Git & GitHub                      |

---

## 📸 Screenshots

| Login            | Dashboard        | Search Room      |
| ---------------- | ---------------- | ---------------- |
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

| Full Routine     | My Bookings      | Admin Panel      |
| ---------------- | ---------------- | ---------------- |
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

---

## 📂 Project Structure

classroom-finder/
├── index.html # Login page
├── signup.html # Sign up page
├── dashboard.html # Main dashboard
├── search.html # Room search page
├── routine.html # Full routine view
├── bookings.html # User's bookings
├── admin.html # Admin panel
├── style.css # Global stylesheet
├── js/
│ ├── firebase-config.js # Firebase setup
│ ├── main.js # Core app logic
│ └── auth.js # Authentication logic
└── README.md

---

## ⚙️ How It Works

1. Users sign up and log in (role: Student, Teacher, or Admin)
2. Students/Teachers can search for a room by selecting a room, day, and time
3. If the room is free at that time, a "Book This Room" option appears
4. Booking a room checks for time conflicts with existing bookings before confirming
5. Admins can manage the full class routine, add/remove rooms, and oversee all bookings

---

## 🚀 Getting Started (Run Locally)

1. Clone this repository
   git clone https://github.com/muntasinrima/empty-classroom-finder.git

2. Open the project folder in VS Code
3. Install the **Live Server** extension
4. Right-click `index.html` → **Open with Live Server**
5. Create your own Firebase project and replace the config in `js/firebase-config.js` with your own credentials

---

## 👩‍💻 Developed By

Mst. Muntasin Rima — Dept. of CSE

---

## 📄 License

This project is built for educational/academic purposes.
