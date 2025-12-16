type DialogMode = "hex" | "den" | "bin";

const root = document.querySelector<HTMLElement>("[data-hex-sim]");
if (!root) throw new Error("Hex simulator root not found");

const outDen = root.querySelector<HTMLElement>('[data-out="denary"]')!;
const outHex = root.querySelector<HTMLElement>('[data-out="hex"]')!;
const outBin = root.querySelector<HTMLElement>('[data-out="bin"]')!;
const outDigitsRow = root.querySelector<HTMLElement>('[data-out="digitsRow"]')!;

const toolbox = root.querySelector<HTMLElement>('[data-out="toolbox"]')!;
const toolboxBtn = root.querySelector<HTMLButtonElement>('[data-action="toggleToolbox"]')!;
const digitsCount = root.querySelector<HTMLElement>('[data-out="digitsCount"]')!;
const bitsHint = root.querySelector<HTMLElement>('[data-out="bitsHint"]')!;
const randomBtn = root.querySelector<HTMLButtonElement>("[data-random]")!;

const dialog = root.querySelector<HTMLDialogElement>('[data-out="dialog"]')!;
const dialogTitle = root.querySelector<HTMLElement>('[data-out="dialogTitle"]')!;
const dialogInput = root.querySelector<HTMLInputElement>('[data-out="dialogInput"]')!;
const dialogHint = root.querySelector<HTMLElement>('[data-out="dialogHint"]')!;
const dialogError = root.querySelector<HTMLElement>('[data-out="dialogError"]')!;

let digits = 2;        // 1..8
let value = 0;         // unsigned denary
let randomTimer: number | null = null;
let dialogMode: DialogMode | null = null;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const maxForDigits = (d: number) => (16 ** d) - 1;

const padHex = (n: number, d: number) => n.toString(16).toUpperCase().padStart(d, "0");
const padBin = (n: number, b: number) => n.toString(2).padStart(b, "0");
const groupBin = (b: string) => b.replace(/(.{4})/g, "$1 ").trim();

function stopRandom(): void {
  if (randomTimer !== null) window.clearInterval(randomTimer);
  randomTimer = null;
  randomBtn.classList.remove("is-running");
}

function startRandom(): void {
  stopRandom();
  const max = maxForDigits(digits);
  const start = Date.now();

  randomBtn.classList.add("is-running");

  randomTimer = window.setInterval(() => {
    value = Math.floor(Math.random() * (max + 1));
    render();
    if (Date.now() - start > 1600) stopRandom();
  }, 90);
}

function render(): void {
  const bits = digits * 4;

  digitsCount.textContent = String(digits);
  bitsHint.textContent = `= ${bits} bits`;

  outDen.textContent = String(value);
  outHex.textContent = padHex(value, digits);
  outBin.textContent = groupBin(padBin(value, bits));

  renderDigitsRow();
}

function renderDigitsRow(): void {
  const hex = padHex(value, digits);
  outDigitsRow.innerHTML = "";

  for (let i = 0; i < digits; i++) {
    const pow = digits - 1 - i;
    const placeValue = 16 ** pow;

    const digitChar = hex[i];
    const digitVal = parseInt(digitChar, 16);
    const nibbleBits = [(digitVal >> 3) & 1, (digitVal >> 2) & 1, (digitVal >> 1) & 1, digitVal & 1]; // 8 4 2 1

    const col = document.createElement("div");
    col.className = "hex-digit-col";
    col.innerHTML = `
      <div class="hex-digit-controls">
        <button class="hex-btn hex-btn--square hex-btn--green2" type="button" data-action="digitUp" data-i="${i}" title="Increase">▲</button>
        <button class="hex-btn hex-btn--square hex-btn--red" type="button" data-action="digitDown" data-i="${i}" title="Decrease">▼</button>
      </div>

      <div class="hex-digit-char hex-font-number">${digitChar}</div>

      <!-- bulbs: brightness changes based on nibble bits -->
      <div class="hex-bulbs" aria-label="Nibble bits">
        ${[8,4,2,1].map((w, idx) => {
          const on = nibbleBits[idx] === 1;
          return `
            <div class="hex-bulb ${on ? "is-on" : ""}">
              <div class="hex-bulb-cap"></div>
              <div class="hex-bulb-glow"></div>
              <div class="hex-bulb-label">${w}</div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="hex-digit-place">${placeValue}</div>
    `;
    outDigitsRow.appendChild(col);
  }
}

function openDialog(mode: DialogMode): void {
  stopRandom();
  dialogMode = mode;

  dialogError.textContent = "";
  dialogInput.value = "";

  if (mode === "hex") {
    dialogTitle.textContent = "Custom Hexadecimal";
    dialogHint.textContent = `Enter 1–${digits} hex digit(s) (0–9, A–F).`;
    dialogInput.placeholder = "A1";
    dialogInput.inputMode = "text";
  } else if (mode === "den") {
    dialogTitle.textContent = "Custom Denary";
    dialogHint.textContent = `Enter a whole number from 0 to ${maxForDigits(digits)}.`;
    dialogInput.placeholder = "42";
    dialogInput.inputMode = "numeric";
  } else {
    dialogTitle.textContent = "Custom Binary";
    dialogHint.textContent = `Enter up to ${digits * 4} bit(s) using 0 and 1.`;
    dialogInput.placeholder = "00101010";
    dialogInput.inputMode = "text";
  }

  dialog.showModal();
  window.setTimeout(() => dialogInput.focus(), 0);
}

function closeDialog(): void {
  dialogMode = null;
  dialogError.textContent = "";
  if (dialog.open) dialog.close();
}

function applyDialog(): void {
  const raw = (dialogInput.value || "").trim();
  if (!dialogMode) return closeDialog();
  if (raw.length === 0) return closeDialog();

  const max = maxForDigits(digits);
  const bits = digits * 4;

  if (dialogMode === "hex") {
    const v = raw.toUpperCase();
    if (!/^[0-9A-F]+$/.test(v)) { dialogError.textContent = "Hex must use 0–9 and A–F only."; return; }
    if (v.length > digits) { dialogError.textContent = `Max length is ${digits} hex digit(s).`; return; }
    value = clamp(parseInt(v, 16), 0, max);
    render();
    return closeDialog();
  }

  if (dialogMode === "den") {
    if (!/^\d+$/.test(raw)) { dialogError.textContent = "Denary must be whole numbers only."; return; }
    const n = Number(raw);
    if (!Number.isFinite(n)) { dialogError.textContent = "Invalid number."; return; }
    value = clamp(n, 0, max);
    render();
    return closeDialog();
  }

  // bin
  if (!/^[01]+$/.test(raw)) { dialogError.textContent = "Binary must use 0 and 1 only."; return; }
  if (raw.length > bits) { dialogError.textContent = `Max length is ${bits} bit(s).`; return; }
  value = clamp(parseInt(raw, 2), 0, max);
  render();
  return closeDialog();
}

function applyDigitDelta(i: number, delta: number): void {
  stopRandom();
  const hexArr = padHex(value, digits).split("");
  let v = parseInt(hexArr[i], 16);
  v = (v + delta) % 16;
  if (v < 0) v += 16;
  hexArr[i] = v.toString(16).toUpperCase();
  value = clamp(parseInt(hexArr.join(""), 16), 0, maxForDigits(digits));
  render();
}

// dialog cancel / backdrop
dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); });
dialog.addEventListener("click", (e) => {
  const card = dialog.querySelector(".hex-dialog-card");
  if (card && !card.contains(e.target as Node)) closeDialog();
});
dialogInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applyDialog();
  if (e.key === "Escape") closeDialog();
});

// main click handler
root.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!btn) return;
  const action = btn.getAttribute("data-action")!;

  if (action === "toggleToolbox") {
    toolbox.classList.toggle("is-open");
    toolboxBtn.setAttribute("aria-expanded", toolbox.classList.contains("is-open") ? "true" : "false");
    return;
  }

  if (action === "digitsMinus") { digits = clamp(digits - 1, 1, 8); value = clamp(value, 0, maxForDigits(digits)); return render(); }
  if (action === "digitsPlus")  { digits = clamp(digits + 1, 1, 8); value = clamp(value, 0, maxForDigits(digits)); return render(); }

  if (action === "increment") { stopRandom(); value = clamp(value + 1, 0, maxForDigits(digits)); return render(); }
  if (action === "decrement") { stopRandom(); value = clamp(value - 1, 0, maxForDigits(digits)); return render(); }

  if (action === "reset")     { stopRandom(); value = 0; return render(); }
  if (action === "random")    { return startRandom(); }

  if (action === "customHex")    return openDialog("hex");
  if (action === "customDenary") return openDialog("den");
  if (action === "customBinary") return openDialog("bin");

  if (action === "dialogCancel") return closeDialog();
  if (action === "dialogApply")  return applyDialog();

  if (action === "digitUp")   return applyDigitDelta(Number(btn.getAttribute("data-i")), +1);
  if (action === "digitDown") return applyDigitDelta(Number(btn.getAttribute("data-i")), -1);
});

render();
