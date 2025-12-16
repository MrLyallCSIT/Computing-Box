/* Binary simulator (Unsigned + Two's complement)
   - bits 1..64
   - wrap bits every 8 visually (CSS), no scrollbars
   - bulbs always update in BOTH modes
   - MSB label shows negative weight in two's complement (e.g. -128)
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

const btnClear = document.getElementById("btnClear");
const btnDec1 = document.getElementById("btnDec1");
const btnInc1 = document.getElementById("btnInc1");
const btnAutoRandom = document.getElementById("btnAutoRandom");

let bitCount = clampInt(Number(bitsInput?.value ?? 8), 1, 64);

// state is MSB -> LSB
let bits = new Array(bitCount).fill(false);

let autoTimer = null;

function clampInt(n, min, max){
  n = Number(n);
  if (!Number.isFinite(n)) return min;
  n = Math.floor(n);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function pow2Big(n){
  // n is number (0..63)
  return 1n << BigInt(n);
}

function isTwos(){
  return !!modeToggle?.checked;
}

function getRange(){
  // returns { min: BigInt, max: BigInt, mod: BigInt }
  const n = bitCount;
  const mod = pow2Big(n);
  if (!isTwos()){
    return { min: 0n, max: mod - 1n, mod };
  }
  // two's: [-2^(n-1), 2^(n-1)-1]
  if (n === 1){
    return { min: -1n, max: 0n, mod };
  }
  const half = pow2Big(n - 1);
  return { min: -half, max: half - 1n, mod };
}

function currentValueBig(){
  // interpret current bits as unsigned or two's complement signed
  let unsigned = 0n;
  for (let i = 0; i < bitCount; i++){
    if (!bits[i]) continue;
    const shift = BigInt(bitCount - 1 - i);
    unsigned += 1n << shift;
  }

  if (!isTwos()){
    return unsigned;
  }

  // signed decode
  const signBit = bits[0];
  if (!signBit) return unsigned;

  const { mod } = getRange();
  return unsigned - mod; // two's complement negative
}

function setFromUnsignedBig(u){
  // u in [0, 2^n-1]
  const n = bitCount;
  for (let i = 0; i < n; i++){
    const shift = BigInt(n - 1 - i);
    bits[i] = ((u >> shift) & 1n) === 1n;
  }
}

function setFromValueBig(v){
  // v is signed depending on mode. We convert to bit pattern.
  const { min, max, mod } = getRange();

  if (v < min) v = min;
  if (v > max) v = max;

  if (!isTwos()){
    setFromUnsignedBig(v);
    return;
  }

  // two's: if negative, add 2^n
  let u = v;
  if (u < 0n) u = u + mod;
  setFromUnsignedBig(u);
}

function buildBits(){
  bitsGrid.innerHTML = "";

  for (let i = 0; i < bitCount; i++){
    const placePow = bitCount - 1 - i;
    const unsignedWeight = pow2Big(placePow);

    // label weight depends on mode (MSB negative in two's)
    let label = unsignedWeight.toString();
    if (isTwos() && i === 0){
      label = "-" + unsignedWeight.toString();
    }

    const bit = document.createElement("div");
    bit.className = "bit";
    bit.innerHTML = `
      <div class="bulb" id="bulb-${i}" aria-hidden="true">💡</div>
      <div class="bitVal">${label}</div>
      <label class="switch" aria-label="Toggle bit ${label}">
        <input type="checkbox" data-index="${i}">
        <span class="slider"></span>
      </label>
    `;

    bitsGrid.appendChild(bit);
  }

  // hook switches
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
    input.addEventListener("change", () => {
      const idx = Number(input.dataset.index);
      bits[idx] = input.checked;
      updateReadout();
    });
  });

  syncUI();
}

function binaryStringGrouped(){
  const raw = bits.map(b => (b ? "1" : "0")).join("");
  // group every 8 from the RIGHT (LSB side) so long widths look sane
  // Example: 11 bits -> 00000000 000 (as in your screenshot)
  const groups = [];
  for (let end = raw.length; end > 0; end -= 8){
    const start = Math.max(0, end - 8);
    groups.unshift(raw.slice(start, end));
  }
  return groups.join(" ");
}

function updateModeHint(){
  if (!modeHint) return;
  if (isTwos()){
    modeHint.textContent = "Tip: In two’s complement, the left-most bit (MSB) represents a negative value.";
  } else {
    modeHint.textContent = "Tip: In unsigned binary, all bits represent positive values.";
  }
}

function updateReadout(){
  const v = currentValueBig();

  // display
  denaryEl.textContent = v.toString();
  binaryEl.textContent = binaryStringGrouped();

  // bulbs update ALWAYS (mode should not affect bulb on/off)
  for (let i = 0; i < bitCount; i++){
    const bulb = document.getElementById(`bulb-${i}`);
    if (bulb) bulb.classList.toggle("on", bits[i]);
  }
}

function syncUI(){
  // sync switch positions
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
    const idx = Number(input.dataset.index);
    input.checked = !!bits[idx];
  });

  updateReadout();
}

function clearBits(){
  bits = new Array(bitCount).fill(false);
  syncUI();
}

function shiftLeft(){
  // logical left shift: drop MSB, add 0 at LSB
  bits.shift();
  bits.push(false);
  syncUI();
}

function shiftRight(){
  // logical right shift: drop LSB, add 0 at MSB
  bits.pop();
  bits.unshift(false);
  syncUI();
}

function setFromBinaryPrompt(){
  const v = prompt(`Enter binary (${bitCount} bits). Spaces allowed:`);
  if (v === null) return;

  const clean = String(v).replace(/\s+/g, "");
  if (!/^[01]+$/.test(clean)){
    alert("Invalid input. Use only 0 and 1 (spaces allowed).");
    return;
  }

  const padded = clean.slice(-bitCount).padStart(bitCount, "0");
  bits = [...padded].map(ch => ch === "1");
  syncUI();
}

function setFromDenaryPrompt(){
  const v = prompt(`Enter denary (${isTwos() ? "signed" : "unsigned"}).`);
  if (v === null) return;

  // BigInt parse (handles negatives)
  let n;
  try {
    n = BigInt(String(v).trim());
  } catch {
    alert("Invalid number.");
    return;
  }

  setFromValueBig(n);
  syncUI();
}

function stepBy(delta){
  const v = currentValueBig();
  const next = v + BigInt(delta);

  // wrap within valid range
  const { min, max, mod } = getRange();

  let wrapped = next;
  if (!isTwos()){
    // unsigned wrap: modulo 2^n
    wrapped = ((next % mod) + mod) % mod;
  } else {
    // signed wrap across [min..max]
    const span = max - min + 1n; // equals 2^n
    wrapped = next;
    while (wrapped > max) wrapped -= span;
    while (wrapped < min) wrapped += span;
  }

  setFromValueBig(wrapped);
  syncUI();
}

function autoRandomOnce(){
  // runs briefly then stops automatically
  if (autoTimer){
    clearInterval(autoTimer);
    autoTimer = null;
    btnAutoRandom.textContent = "Auto Random";
    return;
  }

  btnAutoRandom.textContent = "Auto Random (Running…)";
  const { min, max, mod } = getRange();

  const start = Date.now();
  const durationMs = 1800;   // short burst
  const tickMs = 90;

  autoTimer = setInterval(() => {
    const now = Date.now();
    if (now - start >= durationMs){
      clearInterval(autoTimer);
      autoTimer = null;
      btnAutoRandom.textContent = "Auto Random";
      return;
    }

    // pick a random unsigned pattern 0..2^n-1 then interpret via mode
    // (this keeps distribution consistent even for signed mode)
    const r = randomBigIntBelow(mod);
    setFromUnsignedBig(r);
    syncUI();
  }, tickMs);
}

function randomBigIntBelow(maxExclusive){
  // maxExclusive up to 2^64
  // Use crypto if available, otherwise fallback (still fine for teaching tool)
  const n = bitCount;

  if (globalThis.crypto && crypto.getRandomValues){
    const bytes = Math.ceil(n / 8);
    const buf = new Uint8Array(bytes);

    while (true){
      crypto.getRandomValues(buf);
      let val = 0n;
      for (const b of buf){
        val = (val << 8n) + BigInt(b);
      }

      // mask extra bits
      const extra = BigInt(bytes * 8 - n);
      if (extra > 0n) val = val & ((1n << BigInt(n)) - 1n);

      if (val < maxExclusive) return val;
    }
  }

  // fallback
  const maxNum = Number.MAX_SAFE_INTEGER;
  let val = BigInt(Math.floor(Math.random() * maxNum));
  return val % maxExclusive;
}

function setBitCount(nextCount){
  nextCount = clampInt(nextCount, 1, 64);
  bitCount = nextCount;
  bitsInput.value = String(bitCount);

  // preserve current value if possible by re-encoding it into new width
  const v = currentValueBig();
  bits = new Array(bitCount).fill(false);
  setFromValueBig(v);

  buildBits();
  updateModeHint();
}

function onModeChange(){
  updateModeHint();

  // rebuild labels so MSB shows negative weight in two's mode
  // preserve current *bit pattern* (not numeric), because students are toggling interpretation
  const currentPattern = bits.slice();

  buildBits();
  bits = currentPattern.slice(0, bitCount);

  // if length changed (shouldn't), pad
  if (bits.length < bitCount){
    bits = bits.concat(new Array(bitCount - bits.length).fill(false));
  }

  // rebuild labels again (already done), then resync
  syncUI();
}

/* ----------------- Hooks ----------------- */
btnShiftLeft?.addEventListener("click", shiftLeft);
btnShiftRight?.addEventListener("click", shiftRight);
btnCustomBinary?.addEventListener("click", setFromBinaryPrompt);
btnCustomDenary?.addEventListener("click", setFromDenaryPrompt);

btnClear?.addEventListener("click", clearBits);
btnDec1?.addEventListener("click", () => stepBy(-1));
btnInc1?.addEventListener("click", () => stepBy(+1));
btnAutoRandom?.addEventListener("click", autoRandomOnce);

btnBitsUp?.addEventListener("click", () => setBitCount(bitCount + 1));
btnBitsDown?.addEventListener("click", () => setBitCount(bitCount - 1));
bitsInput?.addEventListener("change", () => setBitCount(Number(bitsInput.value)));

modeToggle?.addEventListener("change", onModeChange);

/* ----------------- Init ----------------- */
updateModeHint();
buildBits();
