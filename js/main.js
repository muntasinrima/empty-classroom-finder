// Main JS - Search Room Feature (Day 4)

import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Convert "HH:MM" time string to total minutes (for easy comparison)
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Fetch all rooms from Firestore
async function getAllRooms() {
  const roomsRef = collection(db, "rooms");
  const snapshot = await getDocs(roomsRef);
  const rooms = [];
  snapshot.forEach((doc) => {
    rooms.push(doc.data());
  });
  return rooms;
}

// Fetch all routine entries from Firestore
async function getAllRoutine() {
  const routineRef = collection(db, "routine");
  const snapshot = await getDocs(routineRef);
  const routine = [];
  snapshot.forEach((doc) => {
    routine.push(doc.data());
  });
  return routine;
}

// Main search function
async function searchRooms() {
  const selectedRoom = document.getElementById("roomSelect").value;
  const selectedDay = document.getElementById("daySelect").value;
  const selectedTime = document.getElementById("timeSelect").value;

  const resultsGrid = document.getElementById("resultsGrid");
  resultsGrid.innerHTML = "<p>Loading...</p>";

  const allRooms = await getAllRooms();
  const allRoutine = await getAllRoutine();

  // Filter rooms if a specific room is selected
  const roomsToShow = selectedRoom
    ? allRooms.filter((r) => r.room_number === selectedRoom)
    : allRooms;

  resultsGrid.innerHTML = "";

  roomsToShow.forEach((room) => {
    // Find if this room has a class at the selected day/time
    let matchedClass = null;

    if (selectedDay && selectedTime) {
      const selectedMinutes = timeToMinutes(selectedTime);

      matchedClass = allRoutine.find((entry) => {
        if (entry.room_number !== room.room_number) return false;
        if (entry.day !== selectedDay) return false;

        const startMinutes = timeToMinutes(entry.start_time);
        const endMinutes = timeToMinutes(entry.end_time);

        return selectedMinutes >= startMinutes && selectedMinutes < endMinutes;
      });
    }

    const isBooked = matchedClass !== null && matchedClass !== undefined;

    const card = document.createElement("div");
    card.className = `room-card ${isBooked ? "booked" : "free"}`;

    if (isBooked) {
      card.innerHTML = `
        <div class="room-card-top">
          <h4>Room ${room.room_number}</h4>
          <span class="status-badge booked-badge">● Booked</span>
        </div>
        <p class="room-info">${matchedClass.subject} — ${matchedClass.teacher} (${matchedClass.start_time} - ${matchedClass.end_time})</p>
      `;
    } else {
      card.innerHTML = `
        <div class="room-card-top">
          <h4>Room ${room.room_number}</h4>
          <span class="status-badge free-badge">● Free</span>
        </div>
        <p class="room-info">No class scheduled at this time</p>
        <button class="room-card-action">Book This Room</button>
      `;
    }

    resultsGrid.appendChild(card);
  });
}

// Run search when button is clicked
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.addEventListener("click", searchRooms);
  searchRooms(); // run once on page load too
}













// ============================================
// Full Routine Page Logic (Day 5)
// ============================================

let selectedDayFilter = "";

async function loadRoutineTable() {
  const routineBody = document.getElementById("routineBody");
  if (!routineBody) return; // Only run this on routine.html

  routineBody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  const allRoutine = await getAllRoutine();
  const selectedRoom = document.getElementById("filterRoom").value;

  // Apply filters
  let filteredRoutine = allRoutine;

  if (selectedDayFilter) {
    filteredRoutine = filteredRoutine.filter((entry) => entry.day === selectedDayFilter);
  }

  if (selectedRoom) {
    filteredRoutine = filteredRoutine.filter((entry) => entry.room_number === selectedRoom);
  }

  routineBody.innerHTML = "";

  if (filteredRoutine.length === 0) {
    routineBody.innerHTML = "<tr><td colspan='5'>No classes found.</td></tr>";
    return;
  }

  filteredRoutine.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="day-pill">${entry.day}</span></td>
      <td>${entry.start_time} - ${entry.end_time}</td>
      <td><strong>${entry.room_number}</strong></td>
      <td>${entry.subject}</td>
      <td>${entry.teacher}</td>
    `;
    routineBody.appendChild(row);
  });
}

// Day Tab click handling
const dayTabsContainer = document.getElementById("dayTabs");
if (dayTabsContainer) {
  const dayTabs = dayTabsContainer.querySelectorAll(".day-tab");

  dayTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      dayTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      selectedDayFilter = tab.dataset.day;
      loadRoutineTable();
    });
  });
}

// Room filter change handling
const filterRoomSelect = document.getElementById("filterRoom");
if (filterRoomSelect) {
  filterRoomSelect.addEventListener("change", loadRoutineTable);
}

// Load routine table on page load (only runs if routineBody exists)
loadRoutineTable();