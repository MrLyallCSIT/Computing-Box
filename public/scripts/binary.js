const bitsRows = document.getElementById("bitsRows");
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

let bitCount = clampInt(Number(bitsInput.value || 8), 1, 64);
let bits = new Array(bitCount).fill(false); // index 0 = MSB

function clampInt(n, min, max){
  n = Number(n);
  if (!Number.isFinite(n)) n = min;
  n = Math.floor(n);
  return Math.max(min, Math.min(max, n));
}

function isTwos(){
  return !!modeToggle.checked;
}

function msbValue(){
  return 2 ** (bitCount - 1);
}

function unsignedValueAt(i){
  // i=0 is MSB
  return 2 ** (bitCount - 1 - i);
}

function computeUnsigned(){
  let sum = 0;
  for (let i = 0; i < bitCount; i++){
    if (bits[i]) sum += unsignedValueAt(i);
  }
  return sum;
}

function computeDenary(){
  const u = computeUnsigned();
  if (!isTwos()) return u;

  // Two's complement:
  // if MSB is 1, value = unsigned - 2^n
  if (bits[0]) return u - (2 ** bitCount);
  return u;
}

function bitsToString(){
  return bits.map(b => (b ? "1" : "0")).join("");
}

function updateModeHint(){
  if (isTwos()){
    modeHint.textContent = "Tip: In two's complement, the left-most bit (MSB) represents a negative value.";
  } else {
    modeHint.textContent = "Tip: In unsigned binary, all bits represent positive values.";
  }
}

function buildBitsUI(){
  bitsRows.innerHTML = "";

  // Build rows of 8 bits
  const rowCount = Math.ceil(bitCount / 8);

  for (let r = 0; r < rowCount; r++){
    const row = document.createElement("div");
    row.className = "byteRow";

    const start = r * 8;
    const end = Math.min(start + 8, bitCount);

    for (let i = start; i < end; i++){
      const bitEl = document.createElement("div");
      bitEl.className = "bit";

      // label: show -MSB in two's complement
      const labelVal = (isTwos() && i === 0) ? -msbValue() : unsignedValueAt(i);

      bitEl.innerHTML = `
        <span class="bulb" id="bulb-${i}" aria-hidden="true">💡</span>
        <div class="bitVal">${labelVal}</div>
        <label class="switch" aria-label="Toggle bit ${labelVal}">
          <input type="checkbox" data-index="${i}">
          <span class="slider"></span>
        </label>
      `;

      row.appendChild(bitEl);
    }

    bitsRows.appendChild(row);
  }

  // Hook switches
  bitsRows.querySelectorAll('input[type="checkbox"][data-index]').forEach(input => {
    input.addEventListener("change", () => {
      const i = Number(input.dataset.index);
      bits[i] = input.checked;
      updateReadout();
    });
  });

  syncUI();
}

function syncUI(){
  // sync inputs
  bitsRows.querySelectorAll('input[type="checkbox"][data-index]').forEach(input => {
    const i = Number(input.dataset.index);
    input.checked = !!bits[i];
  });

  // sync bulbs
  for (let i = 0; i < bitCount; i++){
    const bulb = document.getElementById(`bulb-${i}`);
    if (bulb) bulb.classList.toggle("on", !!bits[i]);
  }

  updateReadout();
}

function updateReadout(){
  denaryEl.textContent = String(computeDenary());
  binaryEl.textContent = bitsToString();
}

function setFromBinary(bin){
  const clean = String(bin).replace(/\s+/g, "");
  if (!/^[01]+$/.test(clean)) return false;

  const padded = clean.slice(-bitCount).padStart(bitCount, "0");
  for (let i = 0; i < bitCount; i++){
    bits[i] = padded[i] === "1";
  }

  syncUI();
  return true;
}

function setFromDenary(n){
  n = Number(n);
  if (!Number.isInteger(n)) return false;

  if (!isTwos()){
    // unsigned: 0 .. (2^n - 1)
    const max = (2 ** bitCount) - 1;
    if (n < 0 || n > max) return false;

    for (let i = 0; i < bitCount; i++){
      const v = unsignedValueAt(i);
      if (n >= v){
        bits[i] = true;
        n -= v;
      } else {
        bits[i] = false;
      }
    }
    syncUI();
    return true;
  }

  // two's complement: -(2^(n-1)) .. (2^(n-1)-1)
  const min = -(2 ** (bitCount - 1));
  const max = (2 ** (bitCount - 1)) - 1;
  if (n < min || n > max) return false;

  // convert to unsigned representation
  let u = n;
  if (u < 0) u = (2 ** bitCount) + u; // wrap

  for (let i = 0; i < bitCount; i++){
    const v = unsignedValueAt(i);
    if (u >= v){
      bits[i] = true;
      u -= v;
    } else {
      bits[i] = false;
    }
  }

  syncUI();
  return true;
}

function shiftLeft(){
  bits.shift();     // drop MSB
  bits.push(false); // add LSB
  syncUI();
}

function shiftRight(){
  bits.pop();       // drop LSB
  bits.unshift(false); // add MSB
  syncUI();
}

function setBitCount(newCount){
  newCount = clampInt(newCount, 4, 64);
  if (newCount === bitCount) return;

  // preserve right-most bits (LSB side) when resizing
  const old = bits.slice();
  const next = new Array(newCount).fill(false);

  const copy = Math.min(old.length, next.length);
  for (let k = 0; k < copy; k++){
    // copy from end (LSB)
    next[newCount - 1 - k] = old[old.length - 1 - k];
  }

  bitCount = newCount;
  bits = next;

  bitsInput.value = String(bitCount);
  buildBitsUI();
}

/* -------------------- events -------------------- */

modeToggle.addEventListener("change", () => {
  updateModeHint();
  buildBitsUI(); // rebuild labels (MSB becomes negative/positive)
});

btnBitsUp.addEventListener("click", () => setBitCount(bitCount + 1));
btnBitsDown.addEventListener("click", () => setBitCount(bitCount - 1));

bitsInput.addEventListener("change", () => setBitCount(Number(bitsInput.value)));

btnShiftLeft.addEventListener("click", shiftLeft);
btnShiftRight.addEventListener("click", shiftRight);

btnCustomBinary.addEventListener("click", () => {
  const v = prompt(`Enter ${bitCount}-bit binary:`);
  if (v === null) return;
  if (!setFromBinary(v)) alert("Invalid binary. Use only 0 and 1.");
});

btnCustomDenary.addEventListener("click", () => {
  const min = isTwos() ? -(2 ** (bitCount - 1)) : 0;
  const max = isTwos() ? (2 ** (bitCount - 1)) - 1 : (2 ** bitCount) - 1;

  const v = prompt(`Enter a denary number (${min} to ${max}):`);
  if (v === null) return;
  if (!setFromDenary(Number(v))) alert("Invalid denary for current mode/bit width.");
});

/* -------------------- init -------------------- */

bitsInput.value = String(bitCount);
updateModeHint();
buildBitsUI();
