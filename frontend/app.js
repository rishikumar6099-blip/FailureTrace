async function checkHealth() {
  const statusEl = document.getElementById("status");
  try {
    const response = await fetch("/health");
    const data = await response.json();
    statusEl.textContent =
      data.status === "ok"
        ? "Backend is running."
        : "Backend responded, but health is not ok.";
  } catch (error) {
    statusEl.textContent = "Could not reach the backend.";
  }
}

checkHealth();
