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
const btnMinus1 = document.getElementById("btnMinus1");
const btnPlus1 = document.getElementById("btnPlus1");
const btnAutoRandom = document.getElementById("btnAutoRandom");

let bitCount = clampInt(Number(bitsInput?.value ?? 8), 1, 64);
let isTwos = Boolean(modeToggle?.checked);

let bits = new Array(bitCount).fill(false); // MSB at index 0
let autoTimer = null;

function clampInt(n, min, max){
  n = Number(n);
  if (!Number.isFinite(n)) return min;
  n = Math.trunc(n);
  return Math.max(min, Math.min(max, n));
}

/* ----------------------------
   Label values (MSB..LSB)
   Unsigned: [2^(n-1) ... 1]
   Two's:   [-2^(n-1), 2^(n-2) ... 1]
----------------------------- */
function getLabelValues(){
  const vals = [];
  for (let i = 0; i < bitCount; i++){
    const pow = bitCount - 1 - i;
    let v = 2 ** pow;
    if (isTwos && i === 0) v = -v; // ✅ MSB label becomes negative
    vals.push(v);
  }
  return vals;
}

function buildBits(){
  // wrap every 8 bits
  bitsGrid.style.setProperty("--cols", String(Math.min(8, bitCount)));

  bitsGrid.innerHTML = "";
  const labelValues = getLabelValues();

  for (let i = 0; i < bitCount; i++){
    const bit = document.createElement("div");
    bit.className = "bit";
    bit.innerHTML = `
      <div class="bulb" id="bulb-${i}" aria-hidden="true">💡</div>
      <div class="bitVal num" id="label-${i}">${labelValues[i]}</div>
      <label class="switch" aria-label="Toggle bit">
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
      updateUI();
    });
  });

  updateUI();
}

function setLabels(){
  const labelValues = getLabelValues();
  for (let i = 0; i < bitCount; i++){
    const el = document.getElementById(`label-${i}`);
    if (el) el.textContent = String(labelValues[i]);
  }
}

function bitsToUnsigned(){
  let n = 0;
  for (let i = 0; i < bitCount; i++){
    if (!bits[i]) continue;
    const pow = bitCount - 1 - i;
    n += 2 ** pow;
  }
  return n;
}

function bitsToTwos(){
  // Two's complement interpretation
  // value = -MSB*2^(n-1) + sum(other set bits)
  let n = 0;
  for (let i = 0; i < bitCount; i++){
    if (!bits[i]) continue;
    const pow = bitCount - 1 - i;
    const v = 2 ** pow;
    if (i === 0) n -= v;
    else n += v;
  }
  return n;
}

function getCurrentValue(){
  return isTwos ? bitsToTwos() : bitsToUnsigned();
}

function setFromUnsignedValue(n){
  // clamp to range of bitCount
  const max = (2 ** bitCount) - 1;
  n = clampInt(n, 0, max);

  for (let i = 0; i < bitCount; i++){
    const pow = bitCount - 1 - i;
    const v = 2 ** pow;
    if (n >= v){
      bits[i] = true;
      n -= v;
    } else {
      bits[i] = false;
    }
  }
  syncSwitchesAndBulbs();
  updateUI(false);
}

function setFromTwosValue(n){
  // represent in two's complement with bitCount bits:
  // allowed range: [-2^(n-1), 2^(n-1)-1]
  const min = -(2 ** (bitCount - 1));
  const max = (2 ** (bitCount - 1)) - 1;
  n = clampInt(n, min, max);

  // Convert to unsigned representation modulo 2^bitCount
  const mod = 2 ** bitCount;
  let u = ((n % mod) + mod) % mod;

  // then set bits from unsigned u
  for (let i = 0; i < bitCount; i++){
    const pow = bitCount - 1 - i;
    const v = 2 ** pow;
    if (u >= v){
      bits[i] = true;
      u -= v;
    } else {
      bits[i] = false;
    }
  }
  syncSwitchesAndBulbs();
  updateUI(false);
}

function formatBinary(groupsOf = 4){
  const raw = bits.map(b => (b ? "1" : "0")).join("");
  // group for readability (keeps your “wrap every 8 bits” layout for switches;
  // this just formats the readout)
  let out = "";
  for (let i = 0; i < raw.length; i++){
    out += raw[i];
    const isLast = i === raw.length - 1;
    if (!isLast && (i + 1) % groupsOf === 0) out += " ";
  }
  return out.trim();
}

function syncSwitchesAndBulbs(){
  // ✅ Bulbs always update (unsigned OR two's)
  bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
    const idx = Number(input.dataset.index);
    input.checked = Boolean(bits[idx]);
  });

  for (let i = 0; i < bitCount; i++){
    const bulb = document.getElementById(`bulb-${i}`);
    if (bulb) bulb.classList.toggle("on", Boolean(bits[i]));
  }
}

function updateUI(sync = true){
  if (sync) syncSwitchesAndBulbs();

  // labels update when mode changes
  setLabels();

  // readouts
  const value = getCurrentValue();
  denaryEl.textContent = String(value);
  binaryEl.textContent = formatBinary(4);

  // hint
  if (isTwos){
    modeHint.textContent = "Tip: In two’s complement, the left-most bit (MSB) represents a negative value.";
  } else {
    modeHint.textContent = "Tip: In unsigned binary, all bits represent positive values.";
  }
}

/* ----------------------------
   Controls
----------------------------- */
btnShiftLeft?.addEventListener("click", () => {
  // shift left: drop MSB, append 0 to LSB
  bits.shift();
  bits.push(false);
  updateUI();
});

btnShiftRight?.addEventListener("click", () => {
  // shift right: drop LSB, insert 0 at MSB
  bits.pop();
  bits.unshift(false);
  updateUI();
});

btnClear?.addEventListener("click", () => {
  bits = new Array(bitCount).fill(false);
  updateUI();
});

btnMinus1?.addEventListener("click", () => {
  const v = getCurrentValue();
  if (isTwos) setFromTwosValue(v - 1);
  else setFromUnsignedValue(v - 1);
});

btnPlus1?.addEventListener("click", () => {
  const v = getCurrentValue();
  if (isTwos) setFromTwosValue(v + 1);
  else setFromUnsignedValue(v + 1);
});

btnAutoRandom?.addEventListener("click", () => {
  // stop if already running
  if (autoTimer){
    clearInterval(autoTimer);
    autoTimer = null;
    btnAutoRandom.textContent = "Auto Random";
    return;
  }

  btnAutoRandom.textContent = "Stop Random";

  // run briefly then stop automatically
  const start = Date.now();
  const durationMs = 2200; // auto stop

  autoTimer = setInterval(() => {
    const now = Date.now();
    if (now - start > durationMs){
      clearInterval(autoTimer);
      autoTimer = null;
      btnAutoRandom.textContent = "Auto Random";
      return;
    }

    // random within correct range for current mode
    if (isTwos){
      const min = -(2 ** (bitCount - 1));
      const max = (2 ** (bitCount - 1)) - 1;
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      setFromTwosValue(n);
    } else {
      const max = (2 ** bitCount) - 1;
      const n = Math.floor(Math.random() * (max + 1));
      setFromUnsignedValue(n);
    }
  }, 90);
});

btnCustomBinary?.addEventListener("click", () => {
  const v = prompt(`Enter a ${bitCount}-bit binary number (0/1):`);
  if (v === null) return;

  const clean = v.replace(/\s+/g, "");
  if (!/^[01]+$/.test(clean)){
    alert("Invalid binary. Use only 0 and 1.");
    return;
  }

  const padded = clean.slice(-bitCount).padStart(bitCount, "0");
  bits = [...padded].map(ch => ch === "1");
  updateUI();
});

btnCustomDenary?.addEventListener("click", () => {
  const v = prompt(isTwos
    ? `Enter a denary number (${-(2 ** (bitCount - 1))} to ${(2 ** (bitCount - 1)) - 1}):`
    : `Enter a denary number (0 to ${(2 ** bitCount) - 1}):`
  );
  if (v === null) return;

  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)){
    alert("Invalid denary. Enter a whole number.");
    return;
  }

  if (isTwos) setFromTwosValue(n);
  else setFromUnsignedValue(n);
});

/* ----------------------------
   Mode + Bit width
----------------------------- */
modeToggle?.addEventListener("change", () => {
  isTwos = Boolean(modeToggle.checked);
  // keep the same underlying bit pattern; just reinterpret and relabel
  updateUI(false);
});

btnBitsUp?.addEventListener("click", () => {
  bitCount = clampInt(bitCount + 1, 1, 64);
  bitsInput.value = String(bitCount);
  bits = new Array(bitCount).fill(false);
  buildBits();
});

btnBitsDown?.addEventListener("click", () => {
  bitCount = clampInt(bitCount - 1, 1, 64);
  bitsInput.value = String(bitCount);
  bits = new Array(bitCount).fill(false);
  buildBits();
});

bitsInput?.addEventListener("change", () => {
  bitCount = clampInt(Number(bitsInput.value), 1, 64);
  bitsInput.value = String(bitCount);
  bits = new Array(bitCount).fill(false);
  buildBits();
});

/* ----------------------------
   Init
----------------------------- */
buildBits();
