// --- 1. SYSTEM DIAGNOSTICS LOGIC ---
function getSystemInfo() {
    // Detect CPU Cores
    const cores = navigator.hardwareConcurrency || "??";
    document.getElementById('pc-cpu').innerText = `${cores} LOGICAL THREADS`;

    // Detect RAM (Approx)
    // Beberapa browser membutuhkan pengecekan spesifik
    const ramAmount = navigator.deviceMemory || "N/A";
    const ramElem = document.getElementById('pc-ram');
    
    if (ramAmount === "N/A") {
        ramElem.innerText = "UNAVAILABLE (PRIVACY)";
        ramElem.style.color = "#888"; // Beri warna abu-abu jika gagal
    } else {
        ramElem.innerText = `${ramAmount}GB (APPROX)`;
        ramElem.style.color = "var(--slate-blue)";
    }

    // Detect Browser
    const agent = navigator.userAgent;
    let brwName = "Unknown Browser";
    if (agent.indexOf("Chrome") > -1) brwName = "Google Chrome";
    else if (agent.indexOf("Firefox") > -1) brwName = "Mozilla Firefox";
    else if (agent.indexOf("Safari") > -1) brwName = "Safari";
    document.getElementById('pc-brw').innerText = brwName;

    // Ping Test
    const pingVal = document.getElementById('pc-ping');
    pingVal.innerText = "FETCHING...";
    
    const start = Date.now();
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' })
        .then(() => {
            const ms = Date.now() - start;
            pingVal.innerText = `${ms}ms`;
            pingVal.className = ms < 150 ? 'val good' : 'val bad';
        })
        .catch(() => {
            pingVal.innerText = "OFFLINE";
            pingVal.className = 'val bad';
        });
}

// --- 2. NAVIGATION & POPUP LOGIC ---
const screens = {
    specs: document.getElementById('specs-screen'),
    about: document.getElementById('about-screen')
};

// Open Specs
document.getElementById('btn-specs').onclick = () => {
    getSystemInfo();
    screens.specs.style.display = 'flex';
};

// Open About
document.getElementById('btn-about').onclick = () => {
    screens.about.style.display = 'flex';
};

// Close Buttons
document.getElementById('btn-back-specs').onclick = () => screens.specs.style.display = 'none';
document.getElementById('btn-back-about').onclick = () => screens.about.style.display = 'none';

// Close on Overlay Click
window.onclick = (event) => {
    if (event.target.classList.contains('screen-overlay')) {
        event.target.style.display = 'none';
    }
};

// Shortcut: ESC to close all popups
window.onkeydown = (e) => {
    if (e.key === "Escape") {
        screens.specs.style.display = 'none';
        screens.about.style.display = 'none';
    }
};