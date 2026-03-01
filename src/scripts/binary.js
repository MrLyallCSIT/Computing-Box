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
  
  // Connect the text labels to the JS
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

  const toolboxToggle = document.getElementById("toolboxToggle");
  const binaryPage = document.getElementById("binaryPage");

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
    let v = vSigned;
    v = ((v % span) + span) % span;
    unsignedBigIntToBits(v);
  }

  function formatBinaryGrouped() {
    let s = "";
    for (let i = bitCount - 1; i >= 0; i--) {
      s += bits[i] ? "1" : "0";
      const posFromLeft = (bitCount - i);
      if (i !== 0 && posFromLeft % 4 === 0) s += " ";
    }
    return s.trimEnd();
  }

  function updateModeHint() {
    if (!modeHint) return;
    if (isTwosMode()) {
      modeHint.textContent = "Tip: In two's complement, the left-most bit (MSB) represents a negative value.";
    } else {
      modeHint.textContent = "Tip: In unsigned binary, all bits represent positive values.";
    }
  }

  /* -----------------------------
     RESPONSIVE GRID COLS
  ----------------------------- */
  function computeColsForBitsGrid() {
    if (!bitsGrid) return;
    const wrap = bitsGrid.parentElement;
    if (!wrap) return;

    const width = wrap.getBoundingClientRect().width;
    const minCell = 100; 
    const cols = clampInt(Math.floor(width / minCell), 1, 12);
    bitsGrid.style.setProperty("--cols", String(Math.min(cols, bitCount)));
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

    for (let i = bitCount - 1; i >= 0; i--) {
      const bitEl = document.createElement("div");
      bitEl.className = "bit";

      bitEl.innerHTML = `
        <div class="bulb" id="bulb-${i}" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.25a6.75 6.75 0 0 0-6.75 6.75c0 2.537 1.393 4.75 3.493 5.922l.507.282v1.546h5.5v-1.546l.507-.282A6.75 6.75 0 0 0 12 2.25Zm-2.25 16.5v.75a2.25 2.25 0 0 0 4.5 0v-.75h-4.5Z"/>
          </svg>
        </div>
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

    computeColsForBitsGrid();
    updateUI();
  }

  /* -----------------------------
     UI UPDATE
  ----------------------------- */
  function updateBitLabels() {
    for (let i = 0; i < bitCount; i++) {
      const label = document.getElementById(`bitLabel-${i}`);
      if (!label) continue;

      let valStr;
      if (isTwosMode() && i === bitCount - 1) {
        valStr = `-${pow2Big(bitCount - 1).toString()}`;
      } else {
        valStr = pow2Big(i).toString();
      }
      label.textContent = valStr;
      label.style.setProperty('--len', valStr.length);
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
      bulb.classList.toggle("on", bits[i] === true);
    }
  }

  function updateReadout() {
    if (!denaryEl || !binaryEl) return;
    if (isTwosMode()) {
      denaryEl.textContent = bitsToSignedBigIntTwos().toString();
    } else {
      denaryEl.textContent = bitsToUnsignedBigInt().toString();
    }
    binaryEl.textContent = formatBinaryGrouped();
  }

  function updateUI() {
    updateModeHint();
    
    // Toggle the glowing CSS class on the active mode text
    if (lblUnsigned && lblTwos) {
      lblUnsigned.classList.toggle("activeMode", !isTwosMode());
      lblTwos.classList.toggle("activeMode", isTwosMode());
    }

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
    } catch { return false; }

    if (isTwosMode()) {
      const min = twosMin(bitCount);
      const max = twosMax(bitCount);
      if (v < min || v > max) return false;
      signedBigIntToBitsTwos(v);
    } else {
      if (v < 0n || v > unsignedMaxValue(bitCount)) return false;
      unsignedBigIntToBits(v);
    }

    updateUI();
    return true;
  }

  /* -----------------------------
     SHIFTS
  ----------------------------- */
  function shiftLeft() {
    for (let i = bitCount - 1; i >= 1; i--) { bits[i] = bits[i - 1]; }
    bits[0] = false;
    updateUI();
  }

  function shiftRight() {
    const msb = bits[bitCount - 1];
    for (let i = 0; i < bitCount - 1; i++) { bits[i] = bits[i + 1]; }
    bits[bitCount - 1] = isTwosMode() ? msb : false;
    updateUI();
  }

  /* -----------------------------
     CLEAR / INC / DEC
  ----------------------------- */
  function clearAll() {
    bits = []; 
    if (modeToggle) modeToggle.checked = false; 
    buildBits(8); 
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

  function setRandomRunning(isRunning) {
    if (!btnRandom) return;
    btnRandom.classList.toggle("btnRandomRunning", !!isRunning);
  }

  function runRandomBriefly() {
    if (randomTimer) {
      clearInterval(randomTimer);
      randomTimer = null;
    }

    setRandomRunning(true);
    const start = Date.now();
    const durationMs = 1125; 
    const tickMs = 80;

    randomTimer = setInterval(() => {
      setRandomOnce();
      if (Date.now() - start >= durationMs) {
        clearInterval(randomTimer);
        randomTimer = null;
        setRandomRunning(false);
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
     TOOLBOX TOGGLE
  ----------------------------- */
  function setToolboxCollapsed(collapsed) {
    if (!binaryPage) return;
    binaryPage.classList.toggle("toolboxCollapsed", !!collapsed);
    const expanded = !collapsed;
    toolboxToggle?.setAttribute("aria-expanded", expanded ? "true" : "false");
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
    const isCollapsed = binaryPage?.classList.contains("toolboxCollapsed");
    setToolboxCollapsed(!isCollapsed);
  });

  window.addEventListener("resize", () => {
    computeColsForBitsGrid();
  });

  /* -----------------------------
     INIT
  ----------------------------- */
  updateModeHint();
  buildBits(bitCount);
  setToolboxCollapsed(false);
})();