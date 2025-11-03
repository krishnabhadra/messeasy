// --- Supabase Client Init ---
const { createClient } = supabase;
const SUPABASE_URL = "https://jopchllcorrcsxrnjqxq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcGNobGxjb3JyY3N4cm5qcXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzk5NDYsImV4cCI6MjA3MTYxNTk0Nn0.smazSidLT2PySB3GG0nkMaMz-J5d5yDgh5m2lL3OboU";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- UI Elements ---
const dayButtons = document.querySelectorAll(".day-btn");
const formContainer = document.getElementById("form-container");
const formDay = document.getElementById("form-day");
const roomForm = document.getElementById("roomForm");
const tableContainer = document.createElement("div");
tableContainer.id = "selection-table";
document.body.appendChild(tableContainer);

const submitBtn = document.getElementById("submitPrefs");
const downloadBtn = document.getElementById("downloadCSV");
const actionButtons = document.getElementById("action-buttons");

const submittedListDiv = document.getElementById("submitted-rooms");
const submittedList = document.getElementById("submitted-room-list");
const submittedDayLabel = document.getElementById("submitted-day-label");
const notSubmittedListDiv = document.getElementById("not-submitted-rooms");
const notSubmittedList = document.getElementById("not-submitted-room-list");

let activeDay = "";
let menuItems = [];
const currentDataMap = {}; // roomNo => { members, table }
const roomMembers = {
  "114": ["Bhadra", "Archana", "Bliss"],
  "113": ["Anargha", "Chaithra E K","Kavya","Anaswara"],
  "20": ["Chaithra S", "Aleena","Anjana","Ameesha"],
  "115":["Radhika","Vyshnavi","Neeraja","Sandra"],
  "18":["Aiswarya G","Ardra","Shahma","Sandra"],
  "108":["Amjum","Devika","Anjali","Amritha"],
  "16":["Parvathy","Mahima","Lakshmi C R"],
  "19":["Aleena","Anaswara","Lekshmi","Akhila"],
  "21":["Muhsina","Darshana","Lakshmi K S","Vismaya"],
  "23":["Sahala","Fathima","Harishma"],
  "101":["nandana","fiza","arundathi","jismaria","athira"],
  "111":["rinsha","rasha","sneha","theres villy"],
  "112":["ajanya","gopika","uthara","abhirami"],
  "110":["anamika","sithara","vismaya","varsha"],
  "117":["arsha","aiswarya","naza","sneha"],
  "109":["mufeedha","fathima sana","muzawira","afla"],
  "107":["jyothika","abhinadha","amritha","nandana","aiswarya"],
  "116":["avathifa","fathima hala","bhagyalakshmi"],
  "118":["krishna","meghna","sreelakshmi"],
  "119":["riya","abhinaya","vrindha"]
};

// --- Menu Items per Day ---
const dayMenus = {
  "Monday": ["Fish", "Veg"],
  "Tuesday": ["Chicken (Bakery)", "Veg (Bakery)", "Chicken", "Veg"],
  "Wednesday": ["Fish", "Veg"],
  "Thursday": ["Chicken (Bakery)", "Veg (Bakery)", "Chicken", "Veg"],
  "Friday": ["Veg"],
  "Saturday": ["Chicken", "Veg"],
  "Sunday": ["Veg"]
};

// --- Day Selection ---
dayButtons.forEach(button => {
  button.addEventListener("click", async () => {
    activeDay = button.getAttribute("data-day");
    menuItems = dayMenus[activeDay] || [];

    // Special input for Thursday
    const porottaInputDiv = document.getElementById("porottaCountContainer");
    if (activeDay === "Thursday") {
       porottaInputDiv.classList.remove("hidden");
    } else {
       porottaInputDiv.classList.add("hidden");
    }

    formDay.textContent = `Enter Room Number for ${activeDay}`;
    formContainer.classList.remove("hidden");
    actionButtons.classList.remove("hidden");

    // --- Fetch Submitted Rooms ---
   // Fetch data from Supabase for the active day
const { data } = await sb
  .from("messdata")
  .select("*")
  .eq("day", activeDay);

// Clear previous lists
submittedList.innerHTML = "";
notSubmittedList.innerHTML = "";

// Update the heading with the selected day
submittedDayLabel.textContent = activeDay;

// Keep track of submitted rooms
const submittedRooms = new Set();
if (data) data.forEach(r => submittedRooms.add(r.room));

// Render submitted rooms
if (submittedRooms.size > 0) {
  submittedRooms.forEach(room => {
    const li = document.createElement("li");
    li.textContent = room;
    submittedList.appendChild(li);
  });
  submittedListDiv.classList.remove("hidden"); // Show submitted rooms box
} else {
  submittedListDiv.classList.add("hidden"); // Hide if none
}

// Determine not submitted rooms
const allRoomNos = Object.keys(roomMembers);
const notSubmittedRooms = allRoomNos.filter(r => !submittedRooms.has(r));

// Render not submitted rooms
if (notSubmittedRooms.length > 0) {
  notSubmittedRooms.forEach(room => {
    const li = document.createElement("li");
    li.textContent = room;
    notSubmittedList.appendChild(li);
  });
  notSubmittedListDiv.classList.remove("hidden"); // Show not submitted rooms box
} else {
  notSubmittedListDiv.classList.add("hidden"); // Hide if none
}

// Show the entire container only if at least one list is not empty
if (submittedRooms.size > 0 || notSubmittedRooms.length > 0) {
  roomsContainer.classList.remove("hidden");
} else {
  roomsContainer.classList.add("hidden");
}

  });
});

// --- Handle Room Form Submission ---
roomForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const roomNo = document.getElementById("roomNo").value.trim();
  const members = roomMembers[roomNo];

  if (!members) {
    alert("Room not found!");
    return;
  }

  // Check duplicate
  const { data } = await sb
    .from("messdata")
    .select("*")
    .eq("day", activeDay)
    .eq("room", roomNo);

  if (data && data.length > 0) {
    alert(`Room ${roomNo} already submitted for ${activeDay}!`);
    roomForm.reset();
    return;
  }

  if (currentDataMap[roomNo]) {
    alert(`Room ${roomNo} already entered!`);
    roomForm.reset();
    return;
  }

  // Build Table
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Room ${roomNo}</th>` + menuItems.map(item => `<th>${item}</th>`).join("");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  members.forEach(name => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${name}</td>` +
      menuItems.map(() => `<td><span class="bubble"></span></td>`).join("");
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableContainer.appendChild(table);
  formContainer.classList.add("hidden");
  roomForm.reset();

  currentDataMap[roomNo] = { members, table };

  // Bubble selection
  table.querySelectorAll("tbody tr").forEach(row => {
    const bubbles = row.querySelectorAll(".bubble");
    bubbles.forEach(bubble => {
      bubble.addEventListener("click", () => {
        const isMultiDay = activeDay === "Tuesday" || activeDay === "Thursday";
        const selected = row.querySelectorAll(".bubble.selected");

        if (bubble.classList.contains("selected")) {
          bubble.classList.remove("selected");
        } else {
          if (isMultiDay && selected.length < 2) {
            bubble.classList.add("selected");
          } else if (!isMultiDay && selected.length < 1) {
            bubble.classList.add("selected");
          } else {
            alert(`You can only select ${isMultiDay ? 2 : 1} item${isMultiDay ? 's' : ''}`);
          }
        }
      });
    });
  });
});

// --- Submit Preferences ---
submitBtn.addEventListener("click", async () => {
  let submittedAny = false;

  for (const [room, { table, members }] of Object.entries(currentDataMap)) {
    const { data } = await sb
      .from("messdata")
      .select("*")
      .eq("day", activeDay)
      .eq("room", room);

    if (data && data.length > 0) continue;

    const rows = table.querySelectorAll("tbody tr");
    const porottaCountValue = document.getElementById("porottaCount").value.trim();

    const roomData = [];
    rows.forEach((row, i) => {
      const name = members[i];
      const preferences = {};
      menuItems.forEach((item, idx) => {
        const selected = row.children[idx + 1].querySelector(".bubble").classList.contains("selected");
        preferences[item] = selected ? "Yes" : "No";
      });

      const entry = { room, name, ...preferences };

      if (activeDay === "Thursday" && i === 0 && porottaCountValue !== "" && !isNaN(porottaCountValue)) {
        entry["Porotta/Appam Count"] = parseInt(porottaCountValue);
      }

      roomData.push(entry);
    });

    await sb.from("messdata").insert([{
      day: activeDay,
      room,
      timestamp: new Date().toISOString(),
      data: roomData
    }]);

    submittedAny = true;
  }

  if (submittedAny) {
    document.getElementById("porottaCount").value = "";
    alert("✅ Preferences saved!");
    location.reload();
  } else {
    alert("⚠️ No new rooms to submit.");
  }
});

// --- Download CSV ---
downloadBtn.addEventListener("click", async () => {
  const { data, error } = await sb
    .from("messdata")
    .select("*")
    .order("timestamp", { ascending: true });

  if (!data || data.length === 0) {
    alert("No data to download!");
    return;
  }

  const dayWiseData = {};
  data.forEach(entry => {
    const day = entry.day || "Unknown";
    const preferences = entry.data || [];
    if (!dayWiseData[day]) dayWiseData[day] = [];
    preferences.forEach(p => dayWiseData[day].push(p));
  });

  Object.entries(dayWiseData).forEach(([day, entries]) => {
    const headers = new Set(["Day", "Room", "Name"]);
    entries.forEach(p => {
      Object.keys(p).forEach(key => {
        if (key !== "room" && key !== "name") headers.add(key);
      });
    });

    const headerArray = Array.from(headers);
    let csv = headerArray.join(",") + "\n";
    const counts = {};
    let porottaTotal = 0;

    entries.forEach(p => {
      const line = [
        day,
        p.room,
        p.name,
        ...headerArray.slice(3).map(menu => {
          const val = p[menu] || "No";
          if (val === "Yes") counts[menu] = (counts[menu] || 0) + 1;
          if (menu === "Porotta/Appam Count" && day === "Thursday") {
            const num = parseInt(val);
            if (!isNaN(num)) porottaTotal += num;
          }
          return val;
        })
      ];
      csv += line.join(",") + "\n";
    });

    const totalsRow = ["", "", "Total"];
    headerArray.slice(3).forEach(menu => {
      if (menu === "Porotta/Appam Count" && day === "Thursday") {
        totalsRow.push(porottaTotal);
      } else {
        totalsRow.push(counts[menu] || 0);
      }
    });
    csv += "\n" + totalsRow.join(",");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${day}_MessData.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// --- Reset Button ---
const resetBtn = document.getElementById("resetAll");
resetBtn.addEventListener("click", async () => {
  const passkey = prompt("Enter Secretary Passkey to reset:");
  const SECRET_PASSKEY = "mess2025";

  if (passkey !== SECRET_PASSKEY) {
    alert("❌ Incorrect passkey. Reset aborted.");
    return;
  }
  const confirmReset = confirm("⚠️ Are you sure you want to delete ALL submissions?");
  if (!confirmReset) return;

  const { error } = await sb.from("messdata").delete().neq("id", 0);
  if (!error) {
    alert("✅ All data has been reset.");
    location.reload();
  } else {
    console.error(error);
    alert("❌ Reset failed.");
  }
});
