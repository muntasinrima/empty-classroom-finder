// Main JS - Fetch and test Firestore data

import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Test function to fetch all rooms
async function testFetchRooms() {
  const roomsRef = collection(db, "rooms");
  const snapshot = await getDocs(roomsRef);

  console.log("📋 Rooms in Firestore:");
  snapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data());
  });
}

// Test function to fetch all routine entries
async function testFetchRoutine() {
  const routineRef = collection(db, "routine");
  const snapshot = await getDocs(routineRef);

  console.log("📅 Routine entries in Firestore:");
  snapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data());
  });
}

testFetchRooms();
testFetchRoutine();