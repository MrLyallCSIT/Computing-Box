// src/scripts/binary.js

document.addEventListener("DOMContentLoaded", () => {
  const bitsGrid = document.getElementById("bitsGrid");
  const denaryEl = document.getElementById("denaryNumber");
  const binaryEl = document.getElementById("binaryNumber");

  const modeToggle = document.getElementById("modeToggle");
  const modeHint = document.getElementById("modeHint");

  const bitsInput = document.getElementById("bitsInput");
  const btnBitsUp = document.getElementById("btnBitsUp");
  const btnBitsDown = document.getElementById("btnBitsDown");

  const btnCustomBinary = document.getElementById("btnCustomBinary");
  const btnCustomDenary = document.getElementById("btnCustomDenary");
  const btnShiftLeft = document.getElementById("btnShiftLeft");
  const btnShiftRight = document.getElementById("btnShiftRight");

  const btnClear = document.getElementById("btnClear");
  const btnRandom = document.getElementById("btnRandom");
  const btnInc = document.getElementById("btnInc");
  const btnDec = document.getElementById("btnDec");

  let bitCount = clampInt(Number(bitsInput.value || 8), 1, 64);
  let isTwos = false;

  // Bits stored MSB -> LSB (index 0 is MSB)
  let bits = new Array(bitCount).fill(false);

  // Random timer
  let randomTimer = null;

  function clampInt(n, min, max) {
    n = Number(n);
    if (!Number.isFinite(n)) return min;
    n = Math.floor(n);
    return Math.max(min, Math.min(max, n));
  }

  function pow2(exp) {
    // exp can be up to 63; JS Number is fine for display and basic use here
    return 2 ** exp;
  }

  function buildBits(count) {
    bitsGrid.innerHTML = "";
    bits = new Array(count).fill(false);
    bitCount = count;

    // Grid wrap at 8 bits per row; also center for small counts
    if (count < 8) {
      bitsGrid.classList.add("bitsFew");
      bitsGrid.style.setProperty("--cols", String(count));
    } else {
      bitsGrid.classList.remove("bitsFew");
      bitsGrid.style.removeProperty("--cols");
    }

    for (let i = 0; i < count; i++) {
      const isMSB = i === 0;
      const valueUnsigned = pow2(count - 1 - i); // MSB is 2^(n-1)

      const bit = document.createElement("div");
      bit.className = "bit";

      bit.innerHTML = `
        <div class="bulb" id="bulb-${i}" aria-hidden="true"></div>
        <div class="bitVal" id="label-${i}">${valueUnsigned}</div>
        <label class="switch" aria-label="Toggle bit ${i}">
          <input type="checkbox" data-index="${i}">
          <span class="slider"></span>
        </label>
      `;

      bitsGrid.appendChild(bit);
    }

    hookSwitches();
    updateModeLabels();
    updateReadout();
  }

  function hookSwitches() {
    bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
      input.addEventListener("change", () => {
        const i = Number(input.dataset.index);
        bits[i] = input.checked;
        updateReadout();
      });
    });
  }

  function updateModeLabels() {
    isTwos = Boolean(modeToggle.checked);

    modeHint.textContent = isTwos
      ? "Tip: In two’s complement, the left-most bit (MSB) represents a negative value."
      : "Tip: In unsigned binary, all bits represent positive values.";

    // Update the labels so the MSB shows negative weight in two's complement
    for (let i = 0; i < bitCount; i++) {
      const label = document.getElementById(`label-${i}`);
      if (!label) continue;

      const unsignedWeight = pow2(bitCount - 1 - i);

      if (isTwos && i === 0) {
        // MSB weight is negative
        label.textContent = `-${unsignedWeight}`;
      } else {
        label.textContent = `${unsignedWeight}`;
      }
    }
  }

  function formatBinaryString(raw) {
    // group every 4 for readability (keeps your "0000 0000" look)
    return raw.replace(/(.{4})/g, "$1 ").trim();
  }

  function computeUnsignedValue() {
    let value = 0;
    for (let i = 0; i < bitCount; i++) {
      if (!bits[i]) continue;
      value += pow2(bitCount - 1 - i);
    }
    return value;
  }

  function computeTwosValue() {
    // If MSB is 0 -> same as unsigned
    const msb = bits[0] ? 1 : 0;
    let value = computeUnsignedValue();
    if (msb === 1) {
      // subtract 2^n to get signed negative value
      value -= pow2(bitCount);
    }
    return value;
  }

  function updateReadout() {
    // Binary string (MSB->LSB)
    const rawBinary = bits.map((b) => (b ? "1" : "0")).join("");
    binaryEl.textContent = formatBinaryString(rawBinary);

    // Denary value based on mode
    const denary = isTwos ? computeTwosValue() : computeUnsignedValue();
    denaryEl.textContent = String(denary);

    // Bulbs MUST update in BOTH modes (this was your reported bug)
    for (let i = 0; i < bitCount; i++) {
      const bulb = document.getElementById(`bulb-${i}`);
      if (!bulb) continue;
      bulb.classList.toggle("on", bits[i]);
    }
  }

  function syncInputs() {
    bitsGrid.querySelectorAll('input[type="checkbox"][data-index]').forEach((input) => {
      const i = Number(input.dataset.index);
      input.checked = Boolean(bits[i]);
    });
    updateReadout();
  }

  function setAllBits(off = true) {
    bits = bits.map(() => !off);
    syncInputs();
  }

  function shiftLeft() {
    // left shift: drop MSB, append 0 at LSB
    bits.shift();
    bits.push(false);
    syncInputs();
  }

  function shiftRight() {
    // right shift: drop LSB, prepend 0 at MSB
    bits.pop();
    bits.unshift(false);
    syncInputs();
  }

  function setFromBinary(input) {
    const clean = String(input).replace(/\s+/g, "");
    if (!/^[01]+$/.test(clean)) return false;

    const padded = clean.slice(-bitCount).padStart(bitCount, "0");
    bits = [...padded].map((ch) => ch === "1");
    syncInputs();
    return true;
  }

  function setFromDenary(input) {
    let n = Number(input);
    if (!Number.isInteger(n)) return false;

    // For unsigned mode: allow 0..(2^n - 1)
    // For two's mode: allow -(2^(n-1))..(2^(n-1)-1)
    const maxUnsigned = pow2(bitCount) - 1;
    const minTwos = -pow2(bitCount - 1);
    const maxTwos = pow2(bitCount - 1) - 1;

    if (!isTwos) {
      if (n < 0 || n > maxUnsigned) return false;
      // build bits from unsigned n
      bits = new Array(bitCount).fill(false);
      for (let i = 0; i < bitCount; i++) {
        const weight = pow2(bitCount - 1 - i);
        if (n >= weight) {
          bits[i] = true;
          n -= weight;
        }
      }
      syncInputs();
      return true;
    }

    // Two's complement: convert signed integer to n-bit representation
    if (n < minTwos || n > maxTwos) return false;

    let u = n;
    if (u < 0) u = pow2(bitCount) + u; // wrap into unsigned range
    const bin = u.toString(2).padStart(bitCount, "0");
    bits = [...bin].map((ch) => ch === "1");
    syncInputs();
    return true;
  }

  function increment() {
    // increment the underlying value in current mode, wrap appropriately
    if (!isTwos) {
      const max = pow2(bitCount) - 1;
      let v = computeUnsignedValue();
      v = (v + 1) % (max + 1);
      setFromDenary(v);
      return;
    }

    const min = -pow2(bitCount - 1);
    const max = pow2(bitCount - 1) - 1;
    let v = computeTwosValue();
    v = v + 1;
    if (v > max) v = min; // wrap
    setFromDenary(v);
  }

  function decrement() {
    if (!isTwos) {
      const max = pow2(bitCount) - 1;
      let v = computeUnsignedValue();
      v = v - 1;
      if (v < 0) v = max;
      setFromDenary(v);
      return;
    }

    const min = -pow2(bitCount - 1);
    const max = pow2(bitCount - 1) - 1;
    let v = computeTwosValue();
    v = v - 1;
    if (v < min) v = max;
    setFromDenary(v);
  }

  function startAutoRandom() {
    stopAutoRandom();

    const durationMs = 1200; // runs briefly then stops
    const tickMs = 90;

    const start = Date.now();
    randomTimer = window.setInterval(() => {
      // pick a random representable number depending on mode
      let target;
      if (!isTwos) {
        target = Math.floor(Math.random() * (pow2(bitCount)));
      } else {
        const min = -pow2(bitCount - 1);
        const max = pow2(bitCount - 1) - 1;
        target = min + Math.floor(Math.random() * (max - min + 1));
      }
      setFromDenary(target);

      if (Date.now() - start >= durationMs) stopAutoRandom();
    }, tickMs);
  }

  function stopAutoRandom() {
    if (randomTimer !== null) {
      window.clearInterval(randomTimer);
      randomTimer = null;
    }
  }

  // MODE toggle
  modeToggle.addEventListener("change", () => {
    updateModeLabels();
    updateReadout();
  });

  // Bit width
  btnBitsUp.addEventListener("click", () => {
    const next = clampInt(bitCount + 1, 1, 64);
    bitsInput.value = String(next);
    buildBits(next);
  });

  btnBitsDown.addEventListener("click", () => {
    const next = clampInt(bitCount - 1, 1, 64);
    bitsInput.value = String(next);
    buildBits(next);
  });

  bitsInput.addEventListener("change", () => {
    const next = clampInt(bitsInput.value, 1, 64);
    bitsInput.value = String(next);
    buildBits(next);
  });

  // Buttons
  btnShiftLeft.addEventListener("click", shiftLeft);
  btnShiftRight.addEventListener("click", shiftRight);

  btnCustomBinary.addEventListener("click", () => {
    const val = prompt(`Enter a ${bitCount}-bit binary number:`);
    if (val === null) return;
    if (!setFromBinary(val)) alert("Invalid binary input (use only 0 and 1).");
  });

  btnCustomDenary.addEventListener("click", () => {
    const modeRange = isTwos
      ? `(${ -pow2(bitCount - 1) } to ${ pow2(bitCount - 1) - 1 })`
      : `(0 to ${ pow2(bitCount) - 1 })`;

    const val = prompt(`Enter a denary number ${modeRange}:`);
    if (val === null) return;
    if (!setFromDenary(val)) alert("Invalid denary input for the current mode/bit width.");
  });

  btnClear.addEventListener("click", () => setAllBits(true));
  btnRandom.addEventListener("click", startAutoRandom);

  btnInc.addEventListener("click", increment);
  btnDec.addEventListener("click", decrement);

  // INIT
  modeToggle.checked = false;
  updateModeLabels();
  buildBits(bitCount);
});
