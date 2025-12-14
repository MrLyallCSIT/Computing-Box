// Binary simulator: unsigned + two's complement, 4–64 bits.
// Key fixes:
// - CSS moved to /public so dynamically-created switches & bulbs are styled.
// - Bits grid wraps into rows of 8 (CSS).
// - Binary readout wraps every 8 bits (JS -> adds \n).

const bitsGrid   = document.getElementById("bitsGrid");
const denaryEl   = document.getElementById("denaryNumber");
const binaryEl   = document.getElementById("binaryNumber");

const modeToggle = document.getElementById("modeToggle");
const modeHint   = document.getElementById("modeHint");

const bitsInput  = document.getElementById("bitsInput");
const btnUp      = document.getElementById("btnBitsUp");
const btnDown    = document.getElementById("btnBitsDown");

const btnShiftL  = document.getElementById("btnShiftLeft");
const btnShiftR  = document.getElementById("btnShiftRight");
const btnCustBin = document.getElementById("btnCustomBinary");
const btnCustDen = document.getElementById("btnCustomDenary");

let bitCount = clampInt(Number(bitsInput.value || 8), 4, 64);
bitsInput.value = String(bitCount);

let isTwos = false;

// bits[0] = MSB, bits[bitCount-1] = LSB
let bits = new Array(bitCount).fill(false);

/* -----------------------------
   Helpers
----------------------------- */
function clampInt(n, min, max){
  n = Number(n);
  if (!Number.isFinite(n)) return min;
  n = Math.floor(n);
  return Math.max(min, Math.min(max, n));
}

function maxUnsigned(nBits){
  // nBits up to 64 -> use BigInt for correctness
  return (1n << BigInt(nBits)) - 1n;
}

function rangeTwos(nBits){
  const min = -(1n << BigInt(nBits - 1));
  const max = (1n << BigInt(nBits - 1)) - 1n;
  return { min, max };
}

function bitsToBigIntUnsigned(){
  let v = 0n;
  for (let i = 0; i < bitCount; i++){
    v = (v << 1n) + (bits[i] ? 1n : 0n);
  }
  return v;
}

function bitsToBigIntTwos(){
  // Interpret current bit pattern as signed two's complement.
  const unsigned = bitsToBigIntUnsigned();
  const signBit = bits[0] ? 1n : 0n;

  if (signBit === 0n) return unsigned; // positive

  // negative: unsigned - 2^n
  const mod = 1n << BigInt(bitCount);
  return unsigned - mod;
}

function bigIntToBitsUnsigned(v){
  // v assumed 0..2^n-1
  const out = new Array(bitCount).fill(false);
  let x = BigInt(v);
  for (let i = bitCount - 1; i >= 0; i--){
    out[i] = (x & 1n) === 1n;
    x >>= 1n;
  }
  return out;
}

function bigIntToBitsTwos(v){
  // v assumed in signed range; convert to 0..2^n-1 representation
  const mod = 1n << BigInt(bitCount);
  let x = BigInt(v);
  if (x < 0n) x = mod + x;
  return bigIntToBitsUnsigned(x);
}

function formatBinaryForReadout(){
  // Wrap every 8 bits into a new line; keep spaces between groups.
  const raw = bits.map(b => (b ? "1" : "0")).join("");
  const groupsOf8 = raw.match(/.{1,8}/g) || [raw];
  return groupsOf8.join("\n");
}

/* -----------------------------
   UI build
----------------------------- */
function buildBitsGrid(){
  bitsGrid.innerHTML = "";

  for (let i = 0; i < bitCount; i++){
    const weightUnsigned = 1n << BigInt(bitCount - 1 - i);
    const isMSB = i === 0;

    const bitEl = document.createElement("div");
    bitEl.className = "bit";

    const bulb = document.createElement("div");
    bulb.className = "bulb";
    bulb.id = `bulb-${i}`;
    bulb.setAttribute("aria-hidden", "true");

    const val = document.createElement("div");
    val.className = "bitVal";
    // if in two's complement, show MSB as negative label visually
    if (isTwos && isMSB) val.classList.add("msbNeg");
    val.textContent = weightUnsigned.toString(); // show magnitude only ( "-" is via CSS )

    const label = document.createElement("label");
    label.className = "switch";
    label.setAttribute("aria-label", `Toggle bit ${i + 1}`);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.index = String(i);

    const slider = document.createElement("span");
    slider.className = "slider";

    label.appendChild(input);
    label.appendChild(slider);

    bitEl.appendChild(bulb);
    bitEl.appendChild(val);
    bitEl.appendChild(label);

    bitsGrid.appendChild(bitEl);
  }

  // Hook listeners after build
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach(input => {
    input.addEventListener("change", () => {
      const idx = Number(input.dataset.index);
      bits[idx] = input.checked;
      updateAll();
    });
  });

  syncInputsToBits();
  updateAll();
}

function syncInputsToBits(){
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach(input => {
    const idx = Number(input.dataset.index);
    input.checked = !!bits[idx];
  });
}

function syncBulbsToBits(){
  for (let i = 0; i < bitCount; i++){
    const bulb = document.getElementById(`bulb-${i}`);
    if (bulb) bulb.classList.toggle("on", !!bits[i]);
  }
}

function updateModeHint(){
  modeHint.textContent = isTwos
    ? "Tip: In two’s complement, the left-most bit (MSB) represents a negative value."
    : "Tip: In unsigned binary, all bits represent positive values.";
}

function updateAll(){
  const denary = isTwos ? bitsToBigIntTwos() : bitsToBigIntUnsigned();
  denaryEl.textContent = denary.toString();
  binaryEl.textContent = formatBinaryForReadout();
  syncBulbsToBits();
}

/* -----------------------------
   Bit-count changes (preserve LSBs)
----------------------------- */
function setBitCount(newCount){
  newCount = clampInt(newCount, 4, 64);
  if (newCount === bitCount) return;

  // preserve LSB-aligned pattern:
  // take from the right end of old bits, pad on the left with zeros.
  const old = bits.slice();
  const newBits = new Array(newCount).fill(false);

  const take = Math.min(bitCount, newCount);
  for (let i = 0; i < take; i++){
    // copy from LSB side
    newBits[newCount - 1 - i] = old[bitCount - 1 - i];
  }

  bitCount = newCount;
  bits = newBits;
  bitsInput.value = String(bitCount);

  buildBitsGrid(); // rebuild with correct styling + rows
}

/* -----------------------------
   Custom input
----------------------------- */
function requestBinary(){
  const v = prompt(`Enter a ${bitCount}-bit binary number (0/1):`);
  if (v === null) return;

  const clean = v.replace(/\s+/g, "");
  if (!/^[01]+$/.test(clean)){
    alert("Invalid input. Use only 0 and 1.");
    return;
  }

  const padded = clean.slice(-bitCount).padStart(bitCount, "0");
  bits = [...padded].map(ch => ch === "1");
  syncInputsToBits();
  updateAll();
}

function requestDenary(){
  const promptText = isTwos
    ? `Enter a denary number (${rangeTwos(bitCount).min} to ${rangeTwos(bitCount).max}):`
    : `Enter a denary number (0 to ${maxUnsigned(bitCount)}):`;

  const raw = prompt(promptText);
  if (raw === null) return;

  // allow leading +/- and digits
  if (!/^[+-]?\d+$/.test(raw.trim())){
    alert("Invalid input. Enter a whole number.");
    return;
  }

  const n = BigInt(raw.trim());

  if (isTwos){
    const { min, max } = rangeTwos(bitCount);
    if (n < min || n > max){
      alert(`Out of range. Enter between ${min} and ${max}.`);
      return;
    }
    bits = bigIntToBitsTwos(n);
  } else {
    const maxU = maxUnsigned(bitCount);
    if (n < 0n || n > maxU){
      alert(`Out of range. Enter between 0 and ${maxU}.`);
      return;
    }
    bits = bigIntToBitsUnsigned(n);
  }

  syncInputsToBits();
  updateAll();
}

/* -----------------------------
   Shifts
----------------------------- */
function shiftLeft(){
  bits.shift();
  bits.push(false);
  syncInputsToBits();
  updateAll();
}

function shiftRight(){
  if (isTwos){
    // arithmetic shift right (preserve sign bit)
    const sign = bits[0];
    bits.pop();
    bits.unshift(sign);
  } else {
    // logical shift right
    bits.pop();
    bits.unshift(false);
  }
  syncInputsToBits();
  updateAll();
}

/* -----------------------------
   Mode toggle
----------------------------- */
function setModeTwos(on){
  isTwos = !!on;
  updateModeHint();

  // rebuild so MSB label shows "-" via CSS class
  // (and keeps the same bit pattern)
  buildBitsGrid();
}

/* -----------------------------
   Wire up UI controls
----------------------------- */
modeToggle.addEventListener("change", () => setModeTwos(modeToggle.checked));

btnUp.addEventListener("click", () => setBitCount(bitCount + 1));
btnDown.addEventListener("click", () => setBitCount(bitCount - 1));

bitsInput.addEventListener("change", () => setBitCount(Number(bitsInput.value)));

btnShiftL.addEventListener("click", shiftLeft);
btnShiftR.addEventListener("click", shiftRight);

btnCustBin.addEventListener("click", requestBinary);
btnCustDen.addEventListener("click", requestDenary);

/* -----------------------------
   Init
----------------------------- */
updateModeHint();
buildBitsGrid();
updateAll();
