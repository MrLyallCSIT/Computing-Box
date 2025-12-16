// src/scripts/binary.js
// Computing:Box — Binary page logic (Unsigned + Two's Complement)
// NOTE: This file is written to match the IDs/classes in your current binary.astro HTML.

(() => {
  /* -----------------------------
     DOM
  ----------------------------- */
  const bitsGrid = document.getElementById("bitsGrid");
  const denaryEl = document.getElementById("denaryNumber");
  const binaryEl = document.getElementById("binaryNumber");
  const bitsInput = document.getElementById("bitsInput");

  const modeToggle = document.getElementById("modeToggle");
  const modeHint = document.getElementById("modeHint");
  const lblUnsigned = document.getElementById("lblUnsigned");
  const lblTwos = document.getElementById("lblTwos");

  const btnCustomBinary = document.getElementById("btnCustomBinary");
  const btnCustomDenary = document.getElementById("btnCustomDenary");
  const btnShiftLeft = document.getElementById("btnShiftLeft");
  const btnShiftRight = document.getElementById("btnShiftRight");

  const btnDec = document.getElementById("btnDec");
  const btnInc = document.getElementById("btnInc");
  const btnClear = document.getElementById("btnClear");
  const btnRandom = document.getElementById("btnRandom");

  const btnBitsUp = document.getElementById("btnBitsUp");
  const btnBitsDown = document.getElementById("btnBitsDown");

  /* -----------------------------
     STATE
  ----------------------------- */
  let bitCount = clampInt(Number(bitsInput?.value ?? 8), 1, 64);

  // bits[i] is bit value 2^i (LSB at i=0)
  let bits = new Array(bitCount).fill(false);

  // Random run timer (brief)
  let randomTimer = null;

  /* -----------------------------
     HELPERS
  ----------------------------- */
  function clampInt(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }

  function isTwosMode() {
    return !!modeToggle?.checked;
  }

  function pow2Big(n) {
    return 1n << BigInt(n);
  }

  function unsignedMaxExclusive(nBits) {
    return pow2Big(nBits); // 2^n
  }

  function unsignedMaxValue(nBits) {
    return pow2Big(nBits) - 1n;
  }

  function twosMin(nBits) {
    return -pow2Big(nBits - 1);
  }

  function twosMax(nBits) {
    return pow2Big(nBits - 1) - 1n;
  }

  function bitsToUnsignedBigInt() {
    let v = 0n;
    for (let i = 0; i < bitCount; i++) {
      if (bits[i]) v += pow2Big(i);
    }
    return v;
  }

  function unsignedBigIntToBits(vUnsigned) {
    const v = ((vUnsigned % unsignedMaxExclusive(bitCount)) + unsignedMaxExclusive(bitCount)) % unsignedMaxExclusive(bitCount);
    for (let i = 0; i < bitCount; i++) {
      bits[i] = ((v >> BigInt(i)) & 1n) === 1n;
    }
  }

  function bitsToSignedBigIntTwos() {
    const u = bitsToUnsignedBigInt();
    const signBit = bits[bitCount - 1] === true;
    if (!signBit) return u;

    // negative: u - 2^n
    return u - pow2Big(bitCount);
  }

  function signedBigIntToBitsTwos(vSigned) {
    // wrap into range [-2^(n-1), 2^(n-1)-1]
    const min = twosMin(bitCount);
    const max = twosMax(bitCount);
    const span = pow2Big(bitCount); // 2^n

    let v = vSigned;

    // wrap using modular arithmetic on signed domain
    // Convert to unsigned representative: v mod 2^n
    v = ((v % span) + span) % span;

    unsignedBigIntToBits(v);
    // labels/denary will show signed later
    // (No further action needed here)
  }

  function formatBinaryGrouped() {
    // MSB..LSB with a space every 4 bits (matches your screenshot 0000 0000)
    let s = "";
    for (let i = bitCount - 1; i >= 0; i--) {
      s += bits[i] ? "1" : "0";
      const posFromRight = (bitCount - i);
      if (i !== 0 && posFromRight % 4 === 0) s += " ";
    }
    return s;
  }

  function updateModeHint() {
    if (!modeHint) return;
    if (isTwosMode()) {
      modeHint.textContent = "Tip: In two’s complement, the left-most bit (MSB) represents a negative value.";
    } else {
      modeHint.textContent = "Tip: In unsigned binary, all bits represent positive values.";
    }
  }

  /* -----------------------------
     BUILD UI (BITS)
  ----------------------------- */
  function buildBits(count) {
    bitCount = clampInt(count, 1, 64);
    if (bitsInput) bitsInput.value = String(bitCount);

    // reset bits array size, preserve existing LSBs where possible
    const oldBits = bits.slice();
    bits = new Array(bitCount).fill(false);
    for (let i = 0; i < Math.min(oldBits.length, bitCount); i++) bits[i] = oldBits[i];

    bitsGrid.innerHTML = "";

    // If less than 8 bits, centre nicely using your CSS helper
    bitsGrid.classList.toggle("bitsFew", bitCount < 8);
    if (bitCount < 8) {
      bitsGrid.style.setProperty("--cols", String(bitCount));
    } else {
      bitsGrid.style.removeProperty("--cols");
    }

    // Render MSB..LSB left-to-right
    for (let i = bitCount - 1; i >= 0; i--) {
      const bitEl = document.createElement("div");
      bitEl.className = "bit";

      // IMPORTANT: We render the bulb as an emoji with NO circle/ring.
      // We do not rely on the .bulb CSS ring/background at all.
      bitEl.innerHTML = `
        <div class="bulb" id="bulb-${i}" aria-hidden="true">💡</div>
        <div class="bitVal" id="bitLabel-${i}"></div>
        <label class="switch" aria-label="Toggle bit ${i}">
          <input type="checkbox" data-index="${i}">
          <span class="slider"></span>
        </label>
      `;

      bitsGrid.appendChild(bitEl);
    }

    // Hook switches
    bitsGrid.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener("change", () => {
        const i = Number(input.dataset.index);
        bits[i] = input.checked;
        updateUI();
      });
    });

    // Force the bulb to be "just the emoji" (removes the circle even if CSS adds it)
    for (let i = 0; i < bitCount; i++) {
      const bulb = document.getElementById(`bulb-${i}`);
      if (!bulb) continue;

      // Strip the ring/circle coming from CSS
      bulb.style.width = "auto";
      bulb.style.height = "auto";
      bulb.style.border = "none";
      bulb.style.background = "transparent";
      bulb.style.borderRadius = "0";
      bulb.style.boxShadow = "none";
      bulb.style.opacity = "0.45";
      bulb.style.fontSize = "26px";
      bulb.style.lineHeight = "1";
      bulb.style.display = "flex";
      bulb.style.alignItems = "center";
      bulb.style.justifyContent = "center";
      bulb.style.filter = "grayscale(1)";
      bulb.textContent = "💡";
    }

    updateUI();
  }

  /* -----------------------------
     UI UPDATE (READOUT + LABELS + BULBS + SWITCHES)
  ----------------------------- */
  function updateBitLabels() {
    // Show weights under each bit.
    // Unsigned: 2^i
    // Two's: MSB is -2^(n-1), others are 2^i
    for (let i = 0; i < bitCount; i++) {
      const label = document.getElementById(`bitLabel-${i}`);
      if (!label) continue;

      if (isTwosMode() && i === bitCount - 1) {
        label.textContent = `-${pow2Big(bitCount - 1).toString()}`;
      } else {
        label.textContent = pow2Big(i).toString();
      }
    }
  }

  function syncSwitchesToBits() {
    bitsGrid.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const i = Number(input.dataset.index);
      input.checked = !!bits[i];
    });
  }

  function updateBulbs() {
    // Bulbs should ALWAYS reflect bits, regardless of mode.
    for (let i = 0; i < bitCount; i++) {
      const bulb = document.getElementById(`bulb-${i}`);
      if (!bulb) continue;

      const on = bits[i] === true;

      // Make it look "lit" when on (no circle, just glow)
      if (on) {
        bulb.style.opacity = "1";
        bulb.style.filter = "grayscale(0)";
        bulb.style.textShadow = "0 0 14px rgba(255,216,107,.75), 0 0 26px rgba(255,216,107,.45)";
      } else {
        bulb.style.opacity = "0.45";
        bulb.style.filter = "grayscale(1)";
        bulb.style.textShadow = "none";
      }
    }
  }

  function updateReadout() {
    if (!denaryEl || !binaryEl) return;

    if (isTwosMode()) {
      const signed = bitsToSignedBigIntTwos();
      denaryEl.textContent = signed.toString();
    } else {
      const unsigned = bitsToUnsignedBigInt();
      denaryEl.textContent = unsigned.toString();
    }

    binaryEl.textContent = formatBinaryGrouped();
  }

  function updateUI() {
    updateModeHint();
    updateBitLabels();
    syncSwitchesToBits();
    updateBulbs();
    updateReadout();
  }

  /* -----------------------------
     SET FROM BINARY STRING
  ----------------------------- */
  function setFromBinaryString(binStr) {
    const clean = String(binStr ?? "").replace(/\s+/g, "");
    if (!/^[01]+$/.test(clean)) return false;

    // Use rightmost bitCount bits; left pad with 0
    const padded = clean.slice(-bitCount).padStart(bitCount, "0");

    for (let i = 0; i < bitCount; i++) {
      // padded is MSB..LSB, bits[] is LSB..MSB
      const charFromRight = padded[padded.length - 1 - i];
      bits[i] = charFromRight === "1";
    }

    updateUI();
    return true;
  }

  /* -----------------------------
     SET FROM DENARY INPUT
  ----------------------------- */
  function setFromDenaryInput(vStr) {
    const raw = String(vStr ?? "").trim();
    if (!raw) return false;

    // BigInt parse (supports negatives)
    let v;
    try {
      // Allow normal integers only
      if (!/^-?\d+$/.test(raw)) return false;
      v = BigInt(raw);
    } catch {
      return false;
    }

    if (isTwosMode()) {
      // Clamp to representable range
      const min = twosMin(bitCount);
      const max = twosMax(bitCount);
      if (v < min || v > max) return false;

      signedBigIntToBitsTwos(v);
    } else {
      // Unsigned only
      if (v < 0n) return false;
      if (v > unsignedMaxValue(bitCount)) return false;

      unsignedBigIntToBits(v);
    }

    updateUI();
    return true;
  }

  /* -----------------------------
     SHIFTS
  ----------------------------- */
  function shiftLeft() {
    // logical left shift: bits move to higher index; LSB becomes 0
    for (let i = bitCount - 1; i >= 1; i--) {
      bits[i] = bits[i - 1];
    }
    bits[0] = false;
    updateUI();
  }

  function shiftRight() {
    // logical right shift: bits move to lower index; MSB becomes 0
    for (let i = 0; i < bitCount - 1; i++) {
      bits[i] = bits[i + 1];
    }
    bits[bitCount - 1] = false;
    updateUI();
  }

  /* -----------------------------
     CLEAR / INC / DEC
  ----------------------------- */
  function clearAll() {
    bits.fill(false);
    updateUI();
  }

  function increment() {
    if (isTwosMode()) {
      const min = twosMin(bitCount);
      const max = twosMax(bitCount);
      let v = bitsToSignedBigIntTwos() + 1n;
      if (v > max) v = min; // wrap
      signedBigIntToBitsTwos(v);
    } else {
      const span = unsignedMaxExclusive(bitCount);
      const v = (bitsToUnsignedBigInt() + 1n) % span;
      unsignedBigIntToBits(v);
    }
    updateUI();
  }

  function decrement() {
    if (isTwosMode()) {
      const min = twosMin(bitCount);
      const max = twosMax(bitCount);
      let v = bitsToSignedBigIntTwos() - 1n;
      if (v < min) v = max; // wrap
      signedBigIntToBitsTwos(v);
    } else {
      const span = unsignedMaxExclusive(bitCount);
      const v = (bitsToUnsignedBigInt() - 1n + span) % span;
      unsignedBigIntToBits(v);
    }
    updateUI();
  }

  /* -----------------------------
     RANDOM (FIXED: NO BigInt->Number Math.min)
  ----------------------------- */
  function cryptoRandomBigInt(maxExclusive) {
    // returns 0 <= x < maxExclusive
    if (maxExclusive <= 0n) return 0n;

    const bitLen = maxExclusive.toString(2).length;
    const byteLen = Math.ceil(bitLen / 8);

    // Rejection sampling
    while (true) {
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);

      let x = 0n;
      for (const b of bytes) {
        x = (x << 8n) | BigInt(b);
      }

      // mask down to bitLen to reduce rejections slightly
      const extraBits = BigInt(byteLen * 8 - bitLen);
      if (extraBits > 0n) x = x >> extraBits;

      if (x < maxExclusive) return x;
    }
  }

  function setRandomOnce() {
    if (isTwosMode()) {
      const span = unsignedMaxExclusive(bitCount); // 2^n
      const u = cryptoRandomBigInt(span); // 0..2^n-1
      unsignedBigIntToBits(u);
    } else {
      const span = unsignedMaxExclusive(bitCount);
      const u = cryptoRandomBigInt(span);
      unsignedBigIntToBits(u);
    }
    updateUI();
  }

  function runRandomBriefly() {
    // stop any existing run
    if (randomTimer) {
      clearInterval(randomTimer);
      randomTimer = null;
    }

    const start = Date.now();
    const durationMs = 900; // brief run then stop
    const tickMs = 80;

    randomTimer = setInterval(() => {
      setRandomOnce();
      if (Date.now() - start >= durationMs) {
        clearInterval(randomTimer);
        randomTimer = null;
      }
    }, tickMs);
  }

  /* -----------------------------
     BIT WIDTH CONTROLS
  ----------------------------- */
  function setBitWidth(n) {
    const v = clampInt(n, 1, 64);
    buildBits(v);
  }

  /* -----------------------------
     EVENTS
  ----------------------------- */

    // Collapsible right panel
  const sidePanel = document.getElementById("sidePanel");
  const btnPanelToggle = document.getElementById("btnPanelToggle");

  btnPanelToggle?.addEventListener("click", () => {
    sidePanel?.classList.toggle("isCollapsed");
    // flip the chevron
    btnPanelToggle.textContent = sidePanel?.classList.contains("isCollapsed") ? "❮" : "❯";
  });

  modeToggle?.addEventListener("change", () => {
    updateUI();
  });

  btnCustomBinary?.addEventListener("click", () => {
    const v = prompt(`Enter binary (spaces allowed). Current width: ${bitCount} bits`);
    if (v === null) return;
    if (!setFromBinaryString(v)) alert("Invalid binary");
  });

  btnCustomDenary?.addEventListener("click", () => {
    const v = prompt(
      isTwosMode()
        ? `Enter denary (${twosMin(bitCount).toString()} to ${twosMax(bitCount).toString()}):`
        : `Enter denary (0 to ${unsignedMaxValue(bitCount).toString()}):`
    );
    if (v === null) return;
    if (!setFromDenaryInput(v)) alert("Invalid denary for current mode/bit width");
  });

  btnShiftLeft?.addEventListener("click", shiftLeft);
  btnShiftRight?.addEventListener("click", shiftRight);

  btnInc?.addEventListener("click", increment);
  btnDec?.addEventListener("click", decrement);

  btnClear?.addEventListener("click", clearAll);
  btnRandom?.addEventListener("click", runRandomBriefly);

  btnBitsUp?.addEventListener("click", () => setBitWidth(bitCount + 1));
  btnBitsDown?.addEventListener("click", () => setBitWidth(bitCount - 1));

  bitsInput?.addEventListener("change", () => {
    setBitWidth(Number(bitsInput.value));
  });

  /* -----------------------------
     INIT
  ----------------------------- */
  updateModeHint();
  buildBits(bitCount);
})();

