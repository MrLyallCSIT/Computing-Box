// src/scripts/binary.js
// Computing:Box — Binary page logic (Unsigned + Two's Complement)

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
  const toolboxPanel = document.getElementById("toolboxPanel");

  /* -----------------------------
     STATE
  ----------------------------- */
  let bitCount = clampInt(Number(bitsInput?.value ?? 8), 1, 64);
  let bits = new Array(bitCount).fill(false);
  let randomTimer = null;

  // For responsive wrapping of the top binary display
  let nibblesPerLine = null;
  let wrapMeasureSpan = null;

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
    for (let i = 0; i < bitCount; i++) {
      if (bits[i]) v += pow2Big(i);
    }
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
     TOP BINARY DISPLAY: responsive wrap by nibble count
  ----------------------------- */
  function ensureWrapMeasurer() {
    if (wrapMeasureSpan || !binaryEl) return;
    wrapMeasureSpan = document.createElement("span");
    wrapMeasureSpan.style.position = "absolute";
    wrapMeasureSpan.style.visibility = "hidden";
    wrapMeasureSpan.style.whiteSpace = "pre";
    wrapMeasureSpan.style.pointerEvents = "none";
    // Inherit font/letterspacing from binaryEl
    wrapMeasureSpan.style.font = getComputedStyle(binaryEl).font;
    wrapMeasureSpan.style.letterSpacing = getComputedStyle(binaryEl).letterSpacing;
    document.body.appendChild(wrapMeasureSpan);
  }

  function computeNibblesPerLine() {
    if (!binaryEl) return null;
    ensureWrapMeasurer();

    // Available width = width of the readout area (binaryEl parent)
    const host = binaryEl.parentElement;
    if (!host) return null;

    const hostW = host.getBoundingClientRect().width;
    if (!Number.isFinite(hostW) || hostW <= 0) return null;

    // Measure one nibble including trailing space ("0000 ")
    wrapMeasureSpan.textContent = "0000 ";
    const nibbleW = wrapMeasureSpan.getBoundingClientRect().width || 1;

    // Safety: keep at least 1 nibble per line
    const max = Math.max(1, Math.floor(hostW / nibbleW));
    return max;
  }

  function formatBinaryWrapped() {
    // EXACT bitCount digits (no padding to 4)
    let raw = "";
    for (let i = bitCount - 1; i >= 0; i--) raw += bits[i] ? "1" : "0";

    // If <= 4 bits, do NOT insert spaces/newlines at all
    if (bitCount <= 4) return raw;

    const groups = [];
    for (let i = 0; i < raw.length; i += 4) {
      groups.push(raw.slice(i, i + 4));
    }

    const perLine = nibblesPerLine ?? groups.length;
    if (perLine >= groups.length) return groups.join(" ");

    const lines = [];
    for (let i = 0; i < groups.length; i += perLine) {
      lines.push(groups.slice(i, i + perLine).join(" "));
    }
    return lines.join("\n");
  }

  function refreshBinaryWrap() {
    const next = computeNibblesPerLine();
    // Only update if it actually changes (prevents jitter)
    if (next !== nibblesPerLine) nibblesPerLine = next;
    updateReadout(); // re-render with new wrap
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

    bitsGrid.classList.toggle("bitsFew", bitCount < 8);
    if (bitCount < 8) {
      bitsGrid.style.setProperty("--cols", String(bitCount));
    } else {
      bitsGrid.style.removeProperty("--cols");
    }

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

    bitsGrid.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener("change", () => {
        const i = Number(input.dataset.index);
        bits[i] = input.checked;
        updateUI();
      });
    });

    // bulb styling + 25% bigger (vs 26px previously)
    for (let i = 0; i < bitCount; i++) {
      const bulb = document.getElementById(`bulb-${i}`);
      if (!bulb) continue;
      bulb.style.width = "auto";
      bulb.style.height = "auto";
      bulb.style.border = "none";
      bulb.style.background = "transparent";
      bulb.style.borderRadius = "0";
      bulb.style.boxShadow = "none";
      bulb.style.opacity = "0.45";
      bulb.style.fontSize = "32px";
      bulb.style.lineHeight = "1";
      bulb.style.display = "flex";
      bulb.style.alignItems = "center";
      bulb.style.justifyContent = "center";
      bulb.style.filter = "grayscale(1)";
      bulb.textContent = "💡";
    }

    // wrapping may change when bit width changes
    refreshBinaryWrap();
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
        // Keep on one line (CSS: white-space:nowrap)
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
      if (on) {
        bulb.style.opacity = "1";
        bulb.style.filter = "grayscale(0)";
        bulb.style.textShadow = "0 0 18px rgba(255,216,107,.75), 0 0 30px rgba(255,216,107,.45)";
      } else {
        bulb.style.opacity = "0.45";
        bulb.style.filter = "grayscale(1)";
        bulb.style.textShadow = "none";
      }
    }
  }

  function updateReadout() {
    if (!denaryEl || !binaryEl) return;

    denaryEl.textContent = (isTwosMode() ? bitsToSignedBigIntTwos() : bitsToUnsignedBigInt()).toString();
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
     SET FROM INPUT
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
    if (isTwosMode()) {
      // arithmetic right shift: keep MSB
      const msb = bits[bitCount - 1];
      for (let i = 0; i < bitCount - 1; i++) bits[i] = bits[i + 1];
      bits[bitCount - 1] = msb;
    } else {
      for (let i = 0; i < bitCount - 1; i++) bits[i] = bits[i + 1];
      bits[bitCount - 1] = false;
    }
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
     RANDOM
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
    const durationMs = 1125; // (your “~25% longer” vs 900ms)
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
    buildBits(clampInt(n, 1, 64));
  }

  /* -----------------------------
     TOOLBOX TOGGLE (simple open/close state)
  ----------------------------- */
  function setToolboxOpen(open) {
    document.body.classList.toggle("toolboxClosed", !open);
    toolboxToggle?.setAttribute("aria-expanded", open ? "true" : "false");
    refreshBinaryWrap(); // width changes when toolbox closes/opens
  }

  /* -----------------------------
     EVENTS
  ----------------------------- */
  modeToggle?.addEventListener("change", () => updateUI());

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

  bitsInput?.addEventListener("change", () => setBitWidth(Number(bitsInput.value)));

  toolboxToggle?.addEventListener("click", () => {
    const isOpen = !document.body.classList.contains("toolboxClosed");
    setToolboxOpen(!isOpen);
  });

  // Recompute wrapping live when the window size changes
  let resizeT = null;
  window.addEventListener("resize", () => {
    if (resizeT) clearTimeout(resizeT);
    resizeT = setTimeout(() => refreshBinaryWrap(), 60);
  });

  /* -----------------------------
     INIT
  ----------------------------- */
  updateModeHint();
  buildBits(bitCount);
  setToolboxOpen(true);
})();
