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

import { doc, getDoc, addDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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

      // Ignore cancelled bookings — they no longer hold the room
      if (existing.status === "cancelled") return;

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

let currentBookingsFilter = "upcoming";

async function loadMyBookings(filter = currentBookingsFilter) {
  const bookingsList = document.getElementById("bookingsList");
  if (!bookingsList) return; // only run on bookings.html

  const user = auth.currentUser;
  if (!user) return;

  currentBookingsFilter = filter;
  bookingsList.innerHTML = "<p>Loading...</p>";

  const bookingsRef = collection(db, "bookings");
  const q = query(bookingsRef, where("booked_by", "==", user.email));
  const snapshot = await getDocs(q);

  const today = new Date().toISOString().split("T")[0];

  let bookings = [];
  snapshot.forEach((docSnap) => {
    bookings.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Apply the selected tab's filter
  if (filter === "cancelled") {
    bookings = bookings.filter((b) => b.status === "cancelled");
  } else if (filter === "past") {
    bookings = bookings.filter((b) => b.status !== "cancelled" && b.date < today);
  } else {
    // upcoming (default)
    bookings = bookings.filter((b) => b.status !== "cancelled" && b.date >= today);
  }

  // Soonest first for upcoming, most recent first for past/cancelled
  bookings.sort((a, b) => (filter === "upcoming" ? (a.date > b.date ? 1 : -1) : (a.date < b.date ? 1 : -1)));

  bookingsList.innerHTML = "";

  if (bookings.length === 0) {
    const emptyText = filter === "cancelled" ? "No cancelled bookings." : filter === "past" ? "No past bookings." : "You have no upcoming bookings.";
    bookingsList.innerHTML = `<p>${emptyText}</p>`;
    return;
  }

  bookings.forEach((booking) => {
    const isCancelled = booking.status === "cancelled";
    const isPast = !isCancelled && booking.date < today;

    const icon = isCancelled ? "🚫" : isPast ? "✔️" : "📌";
    const badgeClass = isCancelled ? "booked-badge" : isPast ? "booked-badge" : "free-badge";
    const badgeText = isCancelled ? "Cancelled" : isPast ? "Past" : "Confirmed";

    const card = document.createElement("div");
    card.className = `booking-card ${isPast || isCancelled ? "past" : ""}`;

    card.innerHTML = `
      <div class="booking-icon">${icon}</div>
      <div class="booking-info">
        <h4>Room ${booking.room_number}</h4>
        <p class="booking-meta">📅 ${booking.date} &nbsp;•&nbsp; ⏰ ${booking.start_time} - ${booking.end_time}</p>
        <p class="booking-purpose">Purpose: ${booking.purpose}</p>
      </div>
      <div class="booking-actions">
        <span class="status-badge ${badgeClass}">${badgeText}</span>
        ${!isCancelled && !isPast ? `<button class="cancel-btn" data-id="${booking.id}">Cancel</button>` : ""}
      </div>
    `;

    bookingsList.appendChild(card);
  });

  // Cancel button handling — marks the booking as cancelled instead of deleting it,
  // so it still shows up under the "Cancelled" tab
  bookingsList.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to cancel this booking?")) {
        await updateDoc(doc(db, "bookings", btn.dataset.id), { status: "cancelled" });
        loadMyBookings(currentBookingsFilter); // refresh list
      }
    });
  });
}

// Tab click handling (Upcoming / Past / Cancelled)
const bookingsTabsContainer = document.getElementById("bookingsTabs");
if (bookingsTabsContainer) {
  const bookingsTabs = bookingsTabsContainer.querySelectorAll(".day-tab");
  bookingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      bookingsTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      loadMyBookings(tab.dataset.filter);
    });
  });
}

// ============================================
// Dashboard Page (Day 8 gap-fill)
// ============================================

async function loadDashboard(user) {
  const dateBadge = document.getElementById("dateBadge");
  if (!dateBadge) return; // only run on dashboard.html

  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDateStr = now.toISOString().split("T")[0];

  dateBadge.textContent = `📅 ${today}, ${now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;

  // Welcome heading with the user's actual name
  const welcomeHeading = document.getElementById("welcomeHeading");
  if (welcomeHeading && user) {
    let firstName = user.email;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().name) {
        firstName = userDoc.data().name.split(" ")[0];
      }
    } catch (e) {
      // ignore — fall back to email
    }
    welcomeHeading.textContent = `Welcome back, ${firstName} 👋`;
  }

  // Free / Booked right now, based on today's routine
  const [allRooms, allRoutine] = await Promise.all([getAllRooms(), getAllRoutine()]);

  let freeCount = 0;
  const freeRoomNumbers = [];

  allRooms.forEach((room) => {
    const matched = allRoutine.find((entry) => {
      if (entry.room_number !== room.room_number) return false;
      if (entry.day !== today) return false;
      const start = timeToMinutes(entry.start_time);
      const end = timeToMinutes(entry.end_time);
      return nowMinutes >= start && nowMinutes < end;
    });

    if (matched) {
      // booked right now
    } else {
      freeCount++;
      freeRoomNumbers.push(room.room_number);
    }
  });

  const bookedCount = allRooms.length - freeCount;

  document.getElementById("statFreeNow").textContent = allRooms.length ? freeCount : 0;
  document.getElementById("statBookedNow").textContent = allRooms.length ? bookedCount : 0;

  // This user's bookings for today
  if (user) {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("booked_by", "==", user.email), where("date", "==", todayDateStr));
    const bookingsSnap = await getDocs(q);
    let myTodayCount = 0;
    bookingsSnap.forEach((docSnap) => {
      if (docSnap.data().status !== "cancelled") myTodayCount++;
    });
    document.getElementById("statMyBookingsToday").textContent = myTodayCount;
  }

  // Free rooms preview chips
  const previewContainer = document.getElementById("freeRoomsPreview");
  if (previewContainer) {
    previewContainer.innerHTML = "";

    if (freeRoomNumbers.length === 0) {
      previewContainer.innerHTML = "<p>No free rooms right now.</p>";
    } else {
      freeRoomNumbers.slice(0, 4).forEach((roomNumber) => {
        const chip = document.createElement("div");
        chip.className = "mini-room-chip free";
        chip.textContent = `Room ${roomNumber}`;
        previewContainer.appendChild(chip);
      });
    }

    const seeAll = document.createElement("a");
    seeAll.href = "search.html";
    seeAll.className = "mini-room-chip see-all";
    seeAll.textContent = "See all →";
    previewContainer.appendChild(seeAll);
  }
}

// Run when auth state is ready (so we know the current user)
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadMyBookings("upcoming");
    loadDashboard(user);
  }
});











// ============================================
// Admin Panel - Manage Routine (Day 8)
// ============================================

async function loadAdminRoutine() {
  const tbody = document.getElementById("adminRoutineBody");
  if (!tbody) return;

  tbody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

  const routineRef = collection(db, "routine");
  const snapshot = await getDocs(routineRef);

  tbody.innerHTML = "";

  if (snapshot.empty) {
    tbody.innerHTML = "<tr><td colspan='6'>No routine entries yet.</td></tr>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const entry = docSnap.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="day-pill">${entry.day}</span></td>
      <td>${entry.start_time} - ${entry.end_time}</td>
      <td><strong>${entry.room_number}</strong></td>
      <td>${entry.subject}</td>
      <td>${entry.teacher}</td>
      <td><button class="cancel-btn" data-id="${docSnap.id}">Delete</button></td>
    `;
    tbody.appendChild(row);
  });

  // Attach delete handlers
  tbody.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this routine entry?")) {
        await deleteDoc(doc(db, "routine", btn.dataset.id));
        loadAdminRoutine();
      }
    });
  });
}

// Fill the "Room" dropdown in the Add Routine form from the real rooms collection
async function populateRoutineRoomDropdown() {
  const roomSelect = document.getElementById("newRoutineRoom");
  if (!roomSelect) return;

  const rooms = await getAllRooms();
  roomSelect.innerHTML = "";

  if (rooms.length === 0) {
    roomSelect.innerHTML = "<option value=''>No rooms yet — add one in Manage Rooms</option>";
    return;
  }

  rooms
    .sort((a, b) => a.room_number.localeCompare(b.room_number))
    .forEach((room) => {
      const option = document.createElement("option");
      option.value = room.room_number;
      option.textContent = `Room ${room.room_number}`;
      roomSelect.appendChild(option);
    });
}

// Add new routine entry
const addRoutineBtn = document.getElementById("addRoutineBtn");
if (addRoutineBtn) {
  addRoutineBtn.addEventListener("click", async () => {
    const room = document.getElementById("newRoutineRoom").value;
    const day = document.getElementById("newRoutineDay").value;
    const start = document.getElementById("newRoutineStart").value;
    const end = document.getElementById("newRoutineEnd").value;
    const subject = document.getElementById("newRoutineSubject").value;
    const teacher = document.getElementById("newRoutineTeacher").value;
    const errorMsg = document.getElementById("routineFormError");

    if (!room || !start || !end || !subject || !teacher) {
      errorMsg.textContent = "Please fill in all fields.";
      errorMsg.style.display = "block";
      return;
    }

    if (timeToMinutes(start) >= timeToMinutes(end)) {
      errorMsg.textContent = "End time must be after start time.";
      errorMsg.style.display = "block";
      return;
    }

    errorMsg.style.display = "none";

    await addDoc(collection(db, "routine"), {
      room_number: room,
      day: day,
      start_time: start,
      end_time: end,
      subject: subject,
      teacher: teacher
    });

    // Clear form
    document.getElementById("newRoutineStart").value = "";
    document.getElementById("newRoutineEnd").value = "";
    document.getElementById("newRoutineSubject").value = "";
    document.getElementById("newRoutineTeacher").value = "";

    loadAdminRoutine();
    updateAdminStats();
  });
}

// ============================================
// Admin Panel - Manage Rooms (Day 8)
// ============================================

async function loadAdminRooms() {
  const grid = document.getElementById("adminRoomsGrid");
  if (!grid) return;

  grid.innerHTML = "<p>Loading...</p>";

  const roomsRef = collection(db, "rooms");
  const snapshot = await getDocs(roomsRef);

  grid.innerHTML = "";

  if (snapshot.empty) {
    grid.innerHTML = "<p>No rooms yet. Add one above.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const room = docSnap.data();
    const card = document.createElement("div");
    card.className = "room-card free";
    card.innerHTML = `
      <div class="room-card-top">
        <h4>Room ${room.room_number}</h4>
        <button class="cancel-btn" data-id="${docSnap.id}">Remove</button>
      </div>
      <p class="room-info">📍 ${room.floor || "—"} — ${room.building || "—"}</p>
    `;
    grid.appendChild(card);
  });

  // Attach remove handlers
  grid.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Remove this room? This does not delete its routine entries or bookings.")) {
        await deleteDoc(doc(db, "rooms", btn.dataset.id));
        loadAdminRooms();
        populateRoutineRoomDropdown();
        updateAdminStats();
      }
    });
  });
}

// Add new room
const addRoomBtn = document.getElementById("addRoomBtn");
if (addRoomBtn) {
  addRoomBtn.addEventListener("click", async () => {
    const roomNumber = document.getElementById("newRoomNumber").value.trim();
    const floor = document.getElementById("newRoomFloor").value.trim();
    const building = document.getElementById("newRoomBuilding").value.trim();
    const errorMsg = document.getElementById("roomFormError");

    if (!roomNumber || !floor || !building) {
      errorMsg.textContent = "Please fill in all fields.";
      errorMsg.style.display = "block";
      return;
    }

    errorMsg.style.display = "none";

    await addDoc(collection(db, "rooms"), {
      room_number: roomNumber,
      floor: floor,
      building: building
    });

    // Clear form
    document.getElementById("newRoomNumber").value = "";
    document.getElementById("newRoomFloor").value = "";
    document.getElementById("newRoomBuilding").value = "";

    loadAdminRooms();
    populateRoutineRoomDropdown();
    updateAdminStats();
  });
}

// ============================================
// Admin Panel - All Bookings (Day 8)
// ============================================

async function loadAdminBookings() {
  const list = document.getElementById("adminBookingsList");
  if (!list) return;

  list.innerHTML = "<p>Loading...</p>";

  const bookingsRef = collection(db, "bookings");
  const snapshot = await getDocs(bookingsRef);

  list.innerHTML = "";

  if (snapshot.empty) {
    list.innerHTML = "<p>No bookings yet.</p>";
    return;
  }

  const bookings = [];
  snapshot.forEach((docSnap) => bookings.push({ id: docSnap.id, ...docSnap.data() }));

  // Most recent date first
  bookings.sort((a, b) => (a.date < b.date ? 1 : -1));

  bookings.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "booking-card";
    card.innerHTML = `
      <div class="booking-icon">📌</div>
      <div class="booking-info">
        <h4>Room ${booking.room_number} — Booked by ${booking.booked_by || "unknown"}</h4>
        <p class="booking-meta">📅 ${booking.date} &nbsp;•&nbsp; ⏰ ${booking.start_time} - ${booking.end_time}</p>
        <p class="booking-purpose">Purpose: ${booking.purpose}</p>
      </div>
      <div class="booking-actions">
        <span class="status-badge free-badge">${booking.status || "confirmed"}</span>
        <button class="cancel-btn" data-id="${booking.id}">Cancel</button>
      </div>
    `;
    list.appendChild(card);
  });

  // Attach cancel handlers
  list.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Cancel this booking?")) {
        await deleteDoc(doc(db, "bookings", btn.dataset.id));
        loadAdminBookings();
        updateAdminStats();
      }
    });
  });
}

// ============================================
// Admin Panel - Dynamic Stats (Day 8)
// ============================================

async function updateAdminStats() {
  const routineStat = document.getElementById("statRoutineCount");
  if (!routineStat) return; // only run on admin.html

  const [routineSnap, roomsSnap, bookingsSnap] = await Promise.all([
    getDocs(collection(db, "routine")),
    getDocs(collection(db, "rooms")),
    getDocs(collection(db, "bookings"))
  ]);

  document.getElementById("statRoutineCount").textContent = routineSnap.size;
  document.getElementById("statRoomCount").textContent = roomsSnap.size;
  document.getElementById("statBookingCount").textContent = bookingsSnap.size;
}

// Load everything on page load (only runs on admin.html since each function checks for its element)
loadAdminRoutine();
populateRoutineRoomDropdown();
loadAdminRooms();
loadAdminBookings();
updateAdminStats();