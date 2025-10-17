const fileInput = document.getElementById("file");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const resultEl = document.getElementById("result");
const downloadEl = document.getElementById("download");

fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (f) previewEl.src = URL.createObjectURL(f);
});

btn.addEventListener("click", async () => {
  const f = fileInput.files?.[0];
  if (!f) { alert("Choose an image first."); return; }

  btn.disabled = true;
  statusEl.textContent = "Generating… this can take ~30–60s";
  resultEl.src = "";
  downloadEl.style.display = "none";

  try {
    const fd = new FormData();
    fd.append("photo", f);

    const res = await fetch("/api/transform", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");

    const dataUrl = `data:image/png;base64,${data.imageBase64}`;
    resultEl.src = dataUrl;
    downloadEl.href = dataUrl;
    downloadEl.style.display = "inline-block";
    statusEl.textContent = "Done! 👑";
  } catch (e) {
    console.error(e);
    statusEl.textContent = `Error: ${e.message}`;
  } finally {
    btn.disabled = false;
  }
});
