const today = new Date();
const currentDay = today.getDate();
const currentMonth = today.getMonth(); // 11 = December

document.querySelectorAll('.day').forEach(day => {
    const num = parseInt(day.dataset.day);

    // Check if previously opened (saved)
    const wasOpened = localStorage.getItem("day" + num) === "open";

    // DECEMBER restriction
    const isLocked = !(currentMonth === 11 && num <= currentDay);

    if (isLocked && !wasOpened) {
        day.classList.add("locked");
        if (day.tagName === "A") {
            day.addEventListener("click", e => e.preventDefault());
        }
        return;
    }

    // If previously opened → restore it
    if (wasOpened) {
        day.classList.add("open");
    }

    // Click behavior
    day.addEventListener("click", () => {
        if (day.classList.contains("locked")) return;

        // Open the day
        day.classList.add("open");

        // Save it
        localStorage.setItem("day" + num, "open");

        // Play music (if exists)
        const audio = day.querySelector(".music");
        if (audio) audio.play();
    });
});


// ---------------------------
// IMAGE ZOOM FEATURE
// ---------------------------

// Create viewer container (added via JS so you don't need HTML changes)
const viewer = document.createElement("div");
viewer.id = "img-viewer";
viewer.style.display = "none";
viewer.style.position = "fixed";
viewer.style.top = "0";
viewer.style.left = "0";
viewer.style.width = "100vw";
viewer.style.height = "100vh";
viewer.style.background = "rgba(0,0,0,0.8)";
viewer.style.justifyContent = "center";
viewer.style.alignItems = "center";
viewer.style.zIndex = "2000";

const viewerImg = document.createElement("img");
viewerImg.id = "viewer-img";
viewerImg.style.maxWidth = "90%";
viewerImg.style.maxHeight = "90%";
viewerImg.style.borderRadius = "10px";
viewerImg.style.boxShadow = "0 0 20px black";
viewerImg.style.cursor = "pointer";

viewer.appendChild(viewerImg);
document.body.appendChild(viewer);

// Open fullscreen image when clicking content images
document.addEventListener("click", function(e) {
    if (e.target.matches(".content img")) {
        viewerImg.src = e.target.src;
        viewer.style.display = "flex";
    }

    // Close when clicking dark background or the large image
    if (e.target.id === "img-viewer" || e.target.id === "viewer-img") {
        viewer.style.display = "none";
    }
});
