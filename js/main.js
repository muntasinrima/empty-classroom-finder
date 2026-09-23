// Main JS - Search Room Feature (Day 4)

import { db, auth } from "./firebase-config.js";
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













// ============================================
// Booking Feature 
// ============================================

import { doc, addDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

let currentBookingRoom = null;

const bookingModal = document.getElementById("bookingModal");

if (bookingModal) {

  // Open modal when any "Book This Room" button is clicked
  // (using event delegation since these buttons are created dynamically)
  document.getElementById("resultsGrid").addEventListener("click", (e) => {
    if (e.target.classList.contains("room-card-action")) {
      const card = e.target.closest(".room-card");
      const roomNumber = card.querySelector("h4").textContent.replace("Room ", "");
      currentBookingRoom = roomNumber;

      document.getElementById("modalRoomNumber").textContent = roomNumber;
      document.getElementById("modalError").style.display = "none";
      document.getElementById("bookingPurpose").value = "Extra Class";
      document.getElementById("bookingDate").value = "";
      document.getElementById("bookingStartTime").value = "";
      document.getElementById("bookingEndTime").value = "";

      bookingModal.style.display = "flex";
    }
  });

  // Close modal
  document.getElementById("modalCloseBtn").addEventListener("click", () => {
    bookingModal.style.display = "none";
  });

  // Close modal if clicking outside the box
  bookingModal.addEventListener("click", (e) => {
    if (e.target === bookingModal) {
      bookingModal.style.display = "none";
    }
  });

  // Confirm Booking
  document.getElementById("confirmBookingBtn").addEventListener("click", async () => {
    const purpose = document.getElementById("bookingPurpose").value;
    const date = document.getElementById("bookingDate").value;
    const startTime = document.getElementById("bookingStartTime").value;
    const endTime = document.getElementById("bookingEndTime").value;
    const errorMsg = document.getElementById("modalError");

    // Basic validation
    if (!date || !startTime || !endTime) {
      errorMsg.textContent = "Please fill in date, start time and end time.";
      errorMsg.style.display = "block";
      return;
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      errorMsg.textContent = "End time must be after start time.";
      errorMsg.style.display = "block";
      return;
    }

    // Check for conflicts with existing bookings on same room+date
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("room_number", "==", currentBookingRoom), where("date", "==", date));
    const snapshot = await getDocs(q);

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    let hasConflict = false;
    snapshot.forEach((docSnap) => {
      const existing = docSnap.data();
      const existingStart = timeToMinutes(existing.start_time);
      const existingEnd = timeToMinutes(existing.end_time);

      // Overlap check
      if (newStart < existingEnd && existingStart < newEnd) {
        hasConflict = true;
      }
    });

    if (hasConflict) {
      errorMsg.textContent = "This room is already booked for an overlapping time on this date.";
      errorMsg.style.display = "block";
      return;
    }

    // No conflict - save booking
    const user = auth.currentUser;

    await addDoc(bookingsRef, {
      room_number: currentBookingRoom,
      date: date,
      start_time: startTime,
      end_time: endTime,
      purpose: purpose,
      booked_by: user ? user.email : "unknown",
      status: "confirmed"
    });

    bookingModal.style.display = "none";
    alert("✅ Room booked successfully!");
    searchRooms(); // refresh results
  });
}












// ============================================
// My Bookings Page (Day 7)
// ============================================

async function loadMyBookings() {
  const bookingsList = document.getElementById("bookingsList");
  if (!bookingsList) return; // only run on bookings.html

  const user = auth.currentUser;
  if (!user) return;

  bookingsList.innerHTML = "<p>Loading...</p>";

  const bookingsRef = collection(db, "bookings");
  const q = query(bookingsRef, where("booked_by", "==", user.email));
  const snapshot = await getDocs(q);

  bookingsList.innerHTML = "";

  if (snapshot.empty) {
    bookingsList.innerHTML = "<p>You have no bookings yet.</p>";
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  snapshot.forEach((docSnap) => {
    const booking = docSnap.data();
    const bookingId = docSnap.id;
    const isPast = booking.date < today;

    const card = document.createElement("div");
    card.className = `booking-card ${isPast ? "past" : ""}`;

    card.innerHTML = `
      <div class="booking-icon">${isPast ? "✔️" : "📌"}</div>
      <div class="booking-info">
        <h4>Room ${booking.room_number}</h4>
        <p class="booking-meta">📅 ${booking.date} &nbsp;•&nbsp; ⏰ ${booking.start_time} - ${booking.end_time}</p>
        <p class="booking-purpose">Purpose: ${booking.purpose}</p>
      </div>
      <div class="booking-actions">
        <span class="status-badge ${isPast ? 'booked-badge' : 'free-badge'}">${isPast ? 'Past' : 'Confirmed'}</span>
        ${!isPast ? `<button class="cancel-btn" data-id="${bookingId}">Cancel</button>` : ""}
      </div>
    `;

    bookingsList.appendChild(card);
  });

  // Cancel button handling
  bookingsList.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to cancel this booking?")) {
        await deleteDoc(doc(db, "bookings", btn.dataset.id));
        loadMyBookings(); // refresh list
      }
    });
  });
}

// Run when auth state is ready (so we know the current user)
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadMyBookings();
  }
});