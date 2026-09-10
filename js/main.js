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
document.getElementById("searchBtn").addEventListener("click", searchRooms);

// Also run search once when page loads (shows all rooms as free by default)
searchRooms();