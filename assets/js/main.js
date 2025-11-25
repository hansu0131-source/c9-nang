// main.js - Firebase / Firestore autosave for C9 pages
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSwLkvSaFVEo8a8-KwURvxzcV_tt1BLnM",
    authDomain: "c9nang.firebaseapp.com",
    projectId: "c9nang",
    storageBucket: "c9nang.firebasestorage.app",
    messagingSenderId: "837147989788",
    appId: "1:837147989788:web:03cd5ebd0162bf3a4e8cd9",
    measurementId: "G-LTS2HVS3KG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function debounce(fn, delay = 1500) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function isHomeworkPage() {
    const h1 = document.querySelector("h1");
    if (!h1) return false;
    return h1.textContent.includes("숙제 체크");
}

function isMembersPage() {
    const h1 = document.querySelector("h1");
    if (!h1) return false;
    return h1.textContent.includes("낭플단");
}

async function loadHomework() {
    const table = document.querySelector(".table");
    if (!table) return;

    const summaryRow = table.querySelector(".summary-row");
    const templateRow = table.querySelector(".data-row");
    if (!summaryRow || !templateRow) return;

    try {
        const colRef = collection(db, "pages_c9_1_homework");
        const snap = await getDocs(colRef);
        if (snap.empty) {
            return;
        }

        // Collect Firestore data
        const rowsData = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            rowsData.push({
                id: docSnap.id,
                nickname: data.nickname || "",
                homework: data.homework || "",
                amount: data.amount || 0,
                photo: data.photo || "",
                gif: data.gif || "",
                memo: data.memo || ""
            });
        });

        rowsData.sort((a, b) => (b.amount || 0) - (a.amount || 0));

        // Remove existing data rows
        table.querySelectorAll(".data-row").forEach(r => r.remove());

        // Build from Firestore
        rowsData.forEach(rowData => {
            const row = templateRow.cloneNode(true);
            row.classList.add("data-row");
            row.setAttribute("data-amount", String(rowData.amount || 0));

            const cells = row.querySelectorAll(".cell");
            if (cells[0]) cells[0].textContent = rowData.id || "";
            if (cells[1]) cells[1].textContent = rowData.nickname || "";
            if (cells[2]) cells[2].textContent = rowData.homework || "";

            const photoCell = cells[4];
            const gifCell = cells[5];
            const memoCell = cells[6];
            if (photoCell) photoCell.textContent = rowData.photo || "";
            if (gifCell) gifCell.textContent = rowData.gif || "";
            if (memoCell) memoCell.textContent = rowData.memo || "";

            summaryRow.insertAdjacentElement("beforebegin", row);
        });

        if (window.updateAll) {
            window.updateAll();
        }
    } catch (err) {
        console.error("loadHomework error:", err);
    }
}

async function saveHomework() {
    const table = document.querySelector(".table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll(".data-row"));
    if (!rows.length) return;

    const docsToSave = [];
    for (const row of rows) {
        const cells = row.querySelectorAll(".cell");
        const id = (cells[0]?.textContent || "").trim();
        if (!id) continue;

        const nickname = (cells[1]?.textContent || "").trim();
        const homework = (cells[2]?.textContent || "").trim();
        const amount = parseInt(row.getAttribute("data-amount") || "0", 10) || 0;

        const yeokCell = row.querySelector(".yeok-cell");
        const yeokfan = yeokCell
            ? parseInt(yeokCell.textContent.replace(/,/g, ""), 10) || 0
            : Math.floor(amount * 0.03);

        const photo = (cells[4]?.textContent || "").trim();
        const gif = (cells[5]?.textContent || "").trim();
        const memo = (cells[6]?.textContent || "").trim();

        docsToSave.push({ id, nickname, homework, amount, yeokfan, photo, gif, memo });
    }

    if (!docsToSave.length) return;

    try {
        const colRef = collection(db, "pages_c9_1_homework");
        await Promise.all(
            docsToSave.map(row =>
                setDoc(doc(colRef, row.id), {
                    id: row.id,
                    nickname: row.nickname,
                    homework: row.homework,
                    amount: row.amount,
                    yeokfan: row.yeokfan,
                    photo: row.photo,
                    gif: row.gif,
                    memo: row.memo,
                    updatedAt: serverTimestamp()
                })
            )
        );

        const historyCol = collection(db, "pages_c9_1_homework_history");
        await addDoc(historyCol, {
            rows: docsToSave,
            createdAt: serverTimestamp()
        });

        console.log("Homework autosaved:", docsToSave.length, "rows");
    } catch (err) {
        console.error("saveHomework error:", err);
    }
}

async function loadMembers() {
    const table = document.querySelector(".table");
    if (!table) return;
    const summaryRow = table.querySelector(".summary-row");
    const templateRow = table.querySelector(".data-row");
    if (!summaryRow || !templateRow) return;

    try {
        const colRef = collection(db, "pages_c9_1_members");
        const snap = await getDocs(colRef);
        if (snap.empty) {
            return;
        }

        const rowsData = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            rowsData.push({
                id: docSnap.id,
                nickname: data.nickname || "",
                amount: data.amount || 0,
                bonus: data.bonus || "",
                memo: data.memo || ""
            });
        });

        rowsData.sort((a, b) => (b.amount || 0) - (a.amount || 0));

        table.querySelectorAll(".data-row").forEach(r => r.remove());

        rowsData.forEach(rowData => {
            const row = templateRow.cloneNode(true);
            row.classList.add("data-row");
            row.setAttribute("data-amount", String(rowData.amount || 0));

            const cells = row.querySelectorAll(".cell");
            if (cells[0]) cells[0].textContent = rowData.id || "";
            if (cells[1]) cells[1].textContent = rowData.nickname || "";
            if (cells[2]) cells[2].textContent = String(rowData.amount || 0);
            if (cells[3]) cells[3].textContent = rowData.bonus || "";
            if (cells[4]) cells[4].textContent = rowData.memo || "";

            summaryRow.insertAdjacentElement("beforebegin", row);
        });

        if (window.refreshAll) {
            window.refreshAll();
        }
    } catch (err) {
        console.error("loadMembers error:", err);
    }
}

async function saveMembers() {
    const table = document.querySelector(".table");
    if (!table) return;
    const rows = Array.from(table.querySelectorAll(".data-row"));
    if (!rows.length) return;

    const docsToSave = [];
    for (const row of rows) {
        const cells = row.querySelectorAll(".cell");
        const id = (cells[0]?.textContent || "").trim();
        if (!id) continue;
        const nickname = (cells[1]?.textContent || "").trim();
        const amount = parseInt((cells[2]?.textContent || "0").replace(/,/g, ""), 10) || 0;
        const bonus = (cells[3]?.textContent || "").trim();
        const memo = (cells[4]?.textContent || "").trim();

        docsToSave.push({ id, nickname, amount, bonus, memo });
    }

    if (!docsToSave.length) return;

    try {
        const colRef = collection(db, "pages_c9_1_members");
        await Promise.all(
            docsToSave.map(row =>
                setDoc(doc(colRef, row.id), {
                    id: row.id,
                    nickname: row.nickname,
                    amount: row.amount,
                    bonus: row.bonus,
                    memo: row.memo,
                    updatedAt: serverTimestamp()
                })
            )
        );

        const historyCol = collection(db, "pages_c9_1_members_history");
        await addDoc(historyCol, {
            rows: docsToSave,
            createdAt: serverTimestamp()
        });

        console.log("Members autosaved:", docsToSave.length, "rows");
    } catch (err) {
        console.error("saveMembers error:", err);
    }
}

function attachAutosave(handler) {
    const debounced = debounce(handler, 1500);
    document.addEventListener("input", () => debounced());
    document.addEventListener("click", (e) => {
        if (e.target.closest(".add") || e.target.closest(".del")) {
            debounced();
        }
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    try {
        if (isHomeworkPage()) {
            await loadHomework();
            if (window.updateAll) window.updateAll();
            attachAutosave(saveHomework);
        } else if (isMembersPage()) {
            await loadMembers();
            if (window.refreshAll) window.refreshAll();
            attachAutosave(saveMembers);
        }
    } catch (err) {
        console.error("init main.js error:", err);
    }
});
