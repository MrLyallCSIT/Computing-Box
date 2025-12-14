/* Binary simulator for Computing:Box
   - Wrap bits every 8 (CSS handles layout)
   - Bit width 4..64
   - Unsigned + Two’s complement toggle (WORKING)
   - Bulbs + toggle switches for each bit
*/

const bitsGrid = document.getElementById("bitsGrid");
const denaryEl = document.getElementById("denaryNumber");
const binaryEl = document.getElementById("binaryNumber");

const modeToggle = document.getElementById("modeToggle");
const modeHint = document.getElementById("modeHint");

const bitsInput = document.getElementById("bitsInput");
const btnBitsUp = document.getElementById("btnBitsUp");
const btnBitsDown = document.getElementById("btnBitsDown");

const btnShiftLeft = document.getElementById("btnShiftLeft");
const btnShiftRight = document.getElementById("btnShiftRight");
const btnCustomBinary = document.getElementById("btnCustomBinary");
const btnCustomDenary = document.getElementById("btnCustomDenary");

let bitCount = clampInt(Number(bitsInput?.value ?? 8), 4, 64);
let isTwos = false;

// bits[0] is MSB, bits[bitCount-1] is LSB
let bits = new Array(bitCount).fill(false);

function clampInt(n, min, max) {
  n = Number(n);
  if (!Number.isInteger(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

function pow2(exp) {
  // safe up to 2^63 in JS integer precision? (JS uses float) but our usage is display/control, ok.
  return 2 ** exp;
}

/* -----------------------------
   Build UI (bulbs + switches)
----------------------------- */
function buildBits(count) {
  bitCount = clampInt(count, 4, 64);
  bits = resizeBits(bits, bitCount);

  bitsGrid.innerHTML = "";

  for (let i = 0; i < bitCount; i++) {
    const exp = bitCount - 1 - i;  // MSB has highest exponent
    const value = pow2(exp);

    const bit = document.createElement("div");
    bit.className = "bit";
    bit.innerHTML = `
      <div class="bulb" id="bulb-${i}" aria-hidden="true"></div>
      <div class="bitVal">${value}</div>
      <label class="switch" aria-label="Toggle bit ${value}">
        <input type="checkbox" data-index="${i}">
        <span class="slider"></span>
      </label>
    `;

    bitsGrid.appendChild(bit);
  }

  hookSwitches();
  syncUI();
}

function resizeBits(oldBits, newCount) {
  // keep LSB end stable when changing bit width:
  // align old bits to the right (LSB)
  const out = new Array(newCount).fill(false);
  const copy = Math.min(oldBits.length, newCount);

  for (let k = 0; k < copy; k++) {
    // copy from end (LSB)
    out[newCount - 1 - k] = oldBits[oldBits.length - 1 - k];
  }
  return out;
}

function hookSwitches() {
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
    input.addEventListener("change", () => {
      const i = Number(input.dataset.index);
      bits[i] = input.checked;
      updateReadout();
      updateBulb(i);
    });
  });
}

/* -----------------------------
   Mode toggle (Unsigned <-> Two’s)
----------------------------- */
function setModeTwos(on) {
  isTwos = !!on;

  modeHint.textContent = isTwos
    ? "Tip: In two’s complement, the left-most bit (MSB) represents a negative value."
    : "Tip: In unsigned binary, all bits represent positive values.";

  // Just re-calc denary using current bit pattern
  updateReadout();
}

modeToggle?.addEventListener("change", () => setModeTwos(modeToggle.checked));

/* -----------------------------
   Calculations
----------------------------- */
function getUnsignedValue() {
  let n = 0;
  for (let i = 0; i < bitCount; i++) {
    if (!bits[i]) continue;
    const exp = bitCount - 1 - i;
    n += pow2(exp);
  }
  return n;
}

function getTwosValue() {
  // MSB has negative weight
  let n = 0;
  for (let i = 0; i < bitCount; i++) {
    if (!bits[i]) continue;
    const exp = bitCount - 1 - i;
    if (i === 0) n -= pow2(exp);   // MSB
    else n += pow2(exp);
  }
  return n;
}

function getDenary() {
  return isTwos ? getTwosValue() : getUnsignedValue();
}

function getBinaryString() {
  return bits.map(b => (b ? "1" : "0")).join("");
}

/* -----------------------------
   UI updates
----------------------------- */
function updateBulb(i) {
  const bulb = document.getElementById(`bulb-${i}`);
  if (bulb) bulb.classList.toggle("on", bits[i]);
}

function updateReadout() {
  denaryEl.textContent = String(getDenary());
  binaryEl.textContent = getBinaryString();
}

function syncUI() {
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
    const i = Number(input.dataset.index);
    input.checked = !!bits[i];
    updateBulb(i);
  });
  updateReadout();
}

/* -----------------------------
   Set from Binary / Denary
----------------------------- */
function setFromBinary(bin) {
  const clean = String(bin).replace(/\s+/g, "");
  if (!/^[01]+$/.test(clean)) return false;

  const padded = clean.slice(-bitCount).padStart(bitCount, "0");
  bits = [...padded].map(ch => ch === "1");
  syncUI();
  return true;
}

function setFromDenary(n) {
  if (!Number.isInteger(n)) return false;

  if (!isTwos) {
    const min = 0;
    const max = pow2(bitCount) - 1;
    if (n < min || n > max) return false;

    // unsigned fill from MSB->LSB
    let remaining = n;
    bits = bits.map((_, i) => {
      const exp = bitCount - 1 - i;
      const value = pow2(exp);
      if (remaining >= value) {
        remaining -= value;
        return true;
      }
      return false;
    });

    syncUI();
    return true;
  }

  // Two's complement bounds
  const min = -pow2(bitCount - 1);
  const max = pow2(bitCount - 1) - 1;
  if (n < min || n > max) return false;

  // Convert to raw unsigned representation:
  // if negative, represent as 2^bitCount + n
  let raw = n;
  if (raw < 0) raw = pow2(bitCount) + raw;

  let remaining = raw;
  bits = bits.map((_, i) => {
    const exp = bitCount - 1 - i;
    const value = pow2(exp);
    if (remaining >= value) {
      remaining -= value;
      return true;
    }
    return false;
  });

  syncUI();
  return true;
}

/* -----------------------------
   Shifts
----------------------------- */
function shiftLeft() {
  // drop MSB, append 0 at LSB
  bits.shift();
  bits.push(false);
  syncUI();
}

function shiftRight() {
  // unsigned: logical shift right (prepend 0)
  // twos: arithmetic shift right (prepend old MSB)
  const msb = bits[0];
  bits.pop();
  bits.unshift(isTwos ? msb : false);
  syncUI();
}

/* -----------------------------
   Bit width controls
----------------------------- */
function applyBitCount(next) {
  const v = clampInt(next, 4, 64);
  bitsInput.value = String(v);
  buildBits(v);
}

btnBitsUp?.addEventListener("click", () => applyBitCount(bitCount + 1));
btnBitsDown?.addEventListener("click", () => applyBitCount(bitCount - 1));

bitsInput?.addEventListener("change", () => {
  applyBitCount(Number(bitsInput.value));
});

/* -----------------------------
   Buttons
----------------------------- */
btnShiftLeft?.addEventListener("click", shiftLeft);
btnShiftRight?.addEventListener("click", shiftRight);

btnCustomBinary?.addEventListener("click", () => {
  const v = prompt(`Enter a ${bitCount}-bit binary number:`);
  if (v === null) return;
  if (!setFromBinary(v)) alert("Invalid input. Use only 0 and 1.");
});

btnCustomDenary?.addEventListener("click", () => {
  const min = isTwos ? -pow2(bitCount - 1) : 0;
  const max = isTwos ? (pow2(bitCount - 1) - 1) : (pow2(bitCount) - 1);

  const v = prompt(`Enter a denary number (${min} to ${max}):`);
  if (v === null) return;

  const n = Number(v);
  if (!Number.isInteger(n) || !setFromDenary(n)) {
    alert(`Invalid input. Enter an integer from ${min} to ${max}.`);
  }
});

/* -----------------------------
   INIT
----------------------------- */
function init() {
  // default mode: unsigned
  setModeTwos(false);
  modeToggle.checked = false;

  // build initial bits
  applyBitCount(bitCount);
}

init();
