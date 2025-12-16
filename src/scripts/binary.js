// src/scripts/binary.js
// Computing:Box — Binary page logic (Unsigned + Two's Complement)
// Matches IDs/classes in binary.astro

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

  const toolboxToggle = document.getElementById("toolboxToggle");

  /* -----------------------------
     STATE
  ----------------------------- */
  let bitCount = clampInt(Number(bitsInput?.value ?? 8), 1, 64);
  let bits = new Array(bitCount).fill(false);
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
    return pow2Big(nBits);
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
    for (let i = 0; i < bitCount; i++) if (bits[i]) v += pow2Big(i);
    return v;
  }

  function unsignedBigIntToBits(vUnsigned) {
    const span = unsignedMaxExclusive(bitCount);
    const v = ((vUnsigned % span) + span) % span;
    for (let i = 0; i < bitCount; i++) {
      bits[i] = ((v >> BigInt(i)) & 1n) === 1n;
    }
  }

  function bitsToSignedBigIntTwos() {
    const u = bitsToUnsignedBigInt();
    const signBit = bits[bitCount - 1] === true;
    if (!signBit) return u;
    return u - pow2Big(bitCount);
  }

  function signedBigIntToBitsTwos(vSigned) {
    const span = pow2Big(bitCount);
    let v = ((vSigned % span) + span) % span;
    unsignedBigIntToBits(v);
  }

  function updateModeHint() {
    if (!modeHint) return;
    modeHint.textContent = isTwosMode()
      ? "Tip: In two’s complement, the left-most bit (MSB) represents a negative value."
      : "Tip: In unsigned binary, all bits represent positive values.";
  }

  /* -----------------------------
     BINARY WRAP (responsive nibbles per row)
     - Calculates how many 4-bit groups fit in the visible area
     - Re-runs on resize
  ----------------------------- */
  function measureNibbleWidthPx() {
    // Measure "0000 " at current binary font settings
    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "pre";
    probe.style.font = getComputedStyle(binaryEl).font;
    probe.style.letterSpacing = getComputedStyle(binaryEl).letterSpacing;
    probe.textContent = "0000 ";
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return Math.max(1, w);
  }

  function nibblesPerRow() {
    if (!binaryEl) return Math.max(1, Math.ceil(bitCount / 4));

    const nibbleW = measureNibbleWidthPx();

    // available width is the left column width (the grid reserves toolbox space already)
    const container = binaryEl.closest(".readout") || binaryEl.parentElement;
    const avail = container?.getBoundingClientRect().width ?? window.innerWidth;

    // leave a little padding so we don't hit the edge
    const usable = Math.max(200, avail - 40);

    const perRow = Math.floor(usable / nibbleW);
    return Math.max(1, perRow);
  }

  function formatBinaryWrapped() {
    // Build MSB..LSB grouped by nibbles, then wrap by nibblesPerRow()
    const nibCount = Math.ceil(bitCount / 4);
    const perRow = nibblesPerRow();

    let out = [];
    for (let n = 0; n < nibCount; n++) {
      // nibble index from MSB side
      const msbBitIndex = bitCount - 1 - (n * 4);
      let nib = "";
      for (let k = 0; k < 4; k++) {
        const i = msbBitIndex - k;
        if (i < 0) continue;
        nib += bits[i] ? "1" : "0";
      }
      // pad nibble if top group smaller
      nib = nib.padStart(4, "0");
      out.push(nib);
    }

    // wrap into lines
    let lines = [];
    for (let i = 0; i < out.length; i += perRow) {
      lines.push(out.slice(i, i + perRow).join(" "));
    }
    return lines.join("\n");
  }

  /* -----------------------------
     BUILD UI (BITS)
  ----------------------------- */
  function buildBits(count) {
    bitCount = clampInt(count, 1, 64);
    if (bitsInput) bitsInput.value = String(bitCount);

    const oldBits = bits.slice();
    bits = new Array(bitCount).fill(false);
    for (let i = 0; i < Math.min(oldBits.length, bitCount); i++) bits[i] = oldBits[i];

    bitsGrid.innerHTML = "";

    // Render MSB..LSB left-to-right
    for (let i = bitCount - 1; i >= 0; i--) {
      const bitEl = document.createElement("div");
      bitEl.className = "bit";

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

    updateUI();
  }

  /* -----------------------------
     UI UPDATE
  ----------------------------- */
  function updateBitLabels() {
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
    for (let i = 0; i < bitCount; i++) {
      const bulb = document.getElementById(`bulb-${i}`);
      if (!bulb) continue;
      const on = bits[i] === true;
      bulb.classList.toggle("on", on);
    }
  }

  function updateReadout() {
    if (!denaryEl || !binaryEl) return;

    if (isTwosMode()) {
      denaryEl.textContent = bitsToSignedBigIntTwos().toString();
    } else {
      denaryEl.textContent = bitsToUnsignedBigInt().toString();
    }

    // responsive wrap of binary digits (nibbles per row)
    binaryEl.textContent = formatBinaryWrapped();
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

    const padded = clean.slice(-bitCount).padStart(bitCount, "0");
    for (let i = 0; i < bitCount; i++) {
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

    let v;
    try {
      if (!/^-?\d+$/.test(raw)) return false;
      v = BigInt(raw);
    } catch {
      return false;
    }

    if (isTwosMode()) {
      const min = twosMin(bitCount);
      const max = twosMax(bitCount);
      if (v < min || v > max) return false;
      signedBigIntToBitsTwos(v);
    } else {
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
    for (let i = bitCount - 1; i >= 1; i--) bits[i] = bits[i - 1];
    bits[0] = false;
    updateUI();
  }

  function shiftRight() {
    for (let i = 0; i < bitCount - 1; i++) bits[i] = bits[i + 1];
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
      if (v > max) v = min;
      signedBigIntToBitsTwos(v);
    } else {
      const span = unsignedMaxExclusive(bitCount);
      unsignedBigIntToBits((bitsToUnsignedBigInt() + 1n) % span);
    }
    updateUI();
  }

  function decrement() {
    if (isTwosMode()) {
      const min = twosMin(bitCount);
      const max = twosMax(bitCount);
      let v = bitsToSignedBigIntTwos() - 1n;
      if (v < min) v = max;
      signedBigIntToBitsTwos(v);
    } else {
      const span = unsignedMaxExclusive(bitCount);
      unsignedBigIntToBits((bitsToUnsignedBigInt() - 1n + span) % span);
    }
    updateUI();
  }

  /* -----------------------------
     RANDOM (BigInt-safe)
  ----------------------------- */
  function cryptoRandomBigInt(maxExclusive) {
    if (maxExclusive <= 0n) return 0n;

    const bitLen = maxExclusive.toString(2).length;
    const byteLen = Math.ceil(bitLen / 8);

    while (true) {
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);

      let x = 0n;
      for (const b of bytes) x = (x << 8n) | BigInt(b);

      const extraBits = BigInt(byteLen * 8 - bitLen);
      if (extraBits > 0n) x = x >> extraBits;

      if (x < maxExclusive) return x;
    }
  }

  function setRandomOnce() {
    const span = unsignedMaxExclusive(bitCount);
    const u = cryptoRandomBigInt(span);
    unsignedBigIntToBits(u);
    updateUI();
  }

  function runRandomBriefly() {
    if (randomTimer) {
      clearInterval(randomTimer);
      randomTimer = null;
    }

    const start = Date.now();
    const durationMs = 900;
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
     BIT WIDTH
  ----------------------------- */
  function setBitWidth(n) {
    buildBits(clampInt(n, 1, 64));
  }

  /* -----------------------------
     TOOLBOX TOGGLE
  ----------------------------- */
  function setToolboxOpen(open) {
    document.body.classList.toggle("toolbox-open", open);
    document.body.classList.toggle("toolbox-closed", !open);
    toolboxToggle?.setAttribute("aria-expanded", open ? "true" : "false");
    // reflow binary wrapping when toolbox changes
    requestAnimationFrame(updateUI);
  }

  /* -----------------------------
     EVENTS
  ----------------------------- */
  modeToggle?.addEventListener("change", updateUI);

  btnCustomBinary?.addEventListener("click", () => {
    const v = prompt(`Enter binary (spaces allowed). Current width: ${bitCount} bits`);
    if (v === null) return;
    if (!setFromBinaryString(v)) alert("Invalid binary");
  });

  btnCustomDenary?.addEventListener("click", () => {
    const v = prompt(
      isTwosMode()
        ? `Enter denary (${twosMin(bitCount)} to ${twosMax(bitCount)}):`
        : `Enter denary (0 to ${unsignedMaxValue(bitCount)}):`
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

  bitsInput?.addEventListener("change", () => setBitWidth(Number(bitsInput.value)));

  toolboxToggle?.addEventListener("click", () => {
    const open = !document.body.classList.contains("toolbox-closed");
    setToolboxOpen(!open);
  });

  window.addEventListener("resize", () => {
    // re-wrap the binary display live as the window changes
    updateUI();
  });

  /* -----------------------------
     INIT
  ----------------------------- */
  updateModeHint();
  setToolboxOpen(true);
  buildBits(bitCount);
})();
