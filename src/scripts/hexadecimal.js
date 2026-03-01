// src/scripts/hexadecimal.js
// Computing:Box — Hexadecimal page logic

(() => {
  /* -----------------------------
     DOM
  ----------------------------- */
  const hexGrid = document.getElementById("hexGrid");
  const denaryEl = document.getElementById("denaryNumber");
  const binaryEl = document.getElementById("binaryNumber");
  const hexEl = document.getElementById("hexNumber");
  const digitsInput = document.getElementById("digitsInput");

  const btnCustomBinary = document.getElementById("btnCustomBinary");
  const btnCustomDenary = document.getElementById("btnCustomDenary");
  const btnCustomHex = document.getElementById("btnCustomHex");

  const btnDec = document.getElementById("btnDec");
  const btnInc = document.getElementById("btnInc");
  const btnClear = document.getElementById("btnClear");
  const btnRandom = document.getElementById("btnRandom");

  const btnDigitsUp = document.getElementById("btnDigitsUp");
  const btnDigitsDown = document.getElementById("btnDigitsDown");

  const toolboxToggle = document.getElementById("toolboxToggle");
  const hexPage = document.getElementById("hexPage");

  /* -----------------------------
     STATE
  ----------------------------- */
  let hexCount = clampInt(Number(digitsInput?.value ?? 2), 1, 16);
  let nibbles = new Array(hexCount).fill(0);
  let randomTimer = null;

  /* -----------------------------
     HELPERS
  ----------------------------- */
  function clampInt(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }

  function maxExclusive() {
    return 1n << BigInt(hexCount * 4);
  }

  function maxValue() {
    return maxExclusive() - 1n;
  }

  function getValue() {
    let v = 0n;
    for (let i = 0; i < hexCount; i++) {
      v += BigInt(nibbles[i]) << BigInt(i * 4);
    }
    return v;
  }

  function setValue(v) {
    if (v < 0n) return false;
    if (v > maxValue()) return false;
    
    for (let i = 0; i < hexCount; i++) {
      nibbles[i] = Number((v >> BigInt(i * 4)) & 0xFn);
    }
    return true;
  }

  /* -----------------------------
     RESPONSIVE GRID
  ----------------------------- */
  function computeColsForHexGrid() {
    if (!hexGrid) return;
    hexGrid.style.setProperty("--cols", String(Math.min(hexCount, 8)));
    hexGrid.classList.toggle("bitsFew", hexCount < 4);
  }

  /* -----------------------------
     BUILD UI (CARDS + BULBS)
  ----------------------------- */
  function buildGrid(count) {
    hexCount = clampInt(count, 1, 16);
    if (digitsInput) digitsInput.value = String(hexCount);

    const oldNibbles = nibbles.slice();
    nibbles = new Array(hexCount).fill(0);
    for (let i = 0; i < Math.min(oldNibbles.length, hexCount); i++) {
        nibbles[i] = oldNibbles[i];
    }

    hexGrid.innerHTML = "";

    for (let i = hexCount - 1; i >= 0; i--) {
      const col = document.createElement("div");
      col.className = "hexCol";

      let cardHTML = `
        <div class="hexCard">
          <div class="hexCardButtons">
            <button class="hexCardBtn inc" id="hexInc-${i}">▲</button>
            <button class="hexCardBtn dec" id="hexDec-${i}">▼</button>
          </div>
          <div class="hexDigitDisplay num" id="hexDisplay-${i}">0</div>
          <div class="hexNibbleRow">
      `;

      for(let j = 3; j >= 0; j--) {
        cardHTML += `
            <div class="hexNibbleBit">
              <div class="bulb hexNibbleBulb" id="hexBulb-${i}-${j}" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.25a6.75 6.75 0 0 0-6.75 6.75c0 2.537 1.393 4.75 3.493 5.922l.507.282v1.546h5.5v-1.546l.507-.282A6.75 6.75 0 0 0 12 2.25Zm-2.25 16.5v.75a2.25 2.25 0 0 0 4.5 0v-.75h-4.5Z"/>
                </svg>
              </div>
              <div class="hexNibbleLabel">${1 << j}</div>
            </div>
        `;
      }

      cardHTML += `
          </div>
        </div>
        <div class="hexColWeight">${(1n << BigInt(i * 4)).toString()}</div>
      `;

      col.innerHTML = cardHTML;

      const incBtn = col.querySelector(`#hexInc-${i}`);
      const decBtn = col.querySelector(`#hexDec-${i}`);

      incBtn.addEventListener("click", () => {
        const span = maxExclusive();
        const weight = 1n << BigInt(i * 4);
        setValue((getValue() + weight) % span);
        updateUI();
      });

      decBtn.addEventListener("click", () => {
        const span = maxExclusive();
        const weight = 1n << BigInt(i * 4);
        setValue((getValue() - weight + span) % span);
        updateUI();
      });

      hexGrid.appendChild(col);
    }

    computeColsForHexGrid();
    updateUI();
  }

  /* -----------------------------
     UI UPDATE
  ----------------------------- */
  function updateUI() {
    const val = getValue();
    
    if (denaryEl) denaryEl.textContent = val.toString();
    if (hexEl) hexEl.textContent = val.toString(16).toUpperCase().padStart(hexCount, '0');

    if (binaryEl) {
      let binStr = "";
      for (let i = hexCount - 1; i >= 0; i--) {
        binStr += nibbles[i].toString(2).padStart(4, '0') + " ";
      }
      binaryEl.textContent = binStr.trimEnd();
    }

    for (let i = 0; i < hexCount; i++) {
      const display = document.getElementById(`hexDisplay-${i}`);
      if (display) display.textContent = nibbles[i].toString(16).toUpperCase();

      for (let j = 0; j < 4; j++) {
        const bulb = document.getElementById(`hexBulb-${i}-${j}`);
        if (bulb) {
          const isOn = (nibbles[i] & (1 << j)) !== 0;
          bulb.classList.toggle("on", isOn);
        }
      }
    }
  }

  /* -----------------------------
     CLEAR / INC / DEC
  ----------------------------- */
  function clearAll() {
    nibbles.fill(0);
    buildGrid(2);
  }

  function increment() {
    const span = maxExclusive();
    setValue((getValue() + 1n) % span);
    updateUI();
  }

  function decrement() {
    const span = maxExclusive();
    setValue((getValue() - 1n + span) % span);
    updateUI();
  }

  /* -----------------------------
     RANDOM
  ----------------------------- */
  function cryptoRandomBigInt(maxExcl) {
    if (maxExcl <= 0n) return 0n;
    const bitLen = maxExcl.toString(2).length;
    const byteLen = Math.ceil(bitLen / 8);

    while (true) {
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);
      let x = 0n;
      for (const b of bytes) x = (x << 8n) | BigInt(b);

      const extraBits = BigInt(byteLen * 8 - bitLen);
      if (extraBits > 0n) x = x >> extraBits;
      if (x < maxExcl) return x;
    }
  }

  function setRandomOnce() {
    const u = cryptoRandomBigInt(maxExclusive());
    setValue(u);
    updateUI();
  }

  function runRandomBriefly() {
    if (randomTimer) {
      clearInterval(randomTimer);
      randomTimer = null;
    }
    if (btnRandom) btnRandom.classList.add("btnRandomRunning");

    const start = Date.now();
    const durationMs = 1125; 
    const tickMs = 80;

    randomTimer = setInterval(() => {
      setRandomOnce();
      if (Date.now() - start >= durationMs) {
        clearInterval(randomTimer);
        randomTimer = null;
        if (btnRandom) btnRandom.classList.remove("btnRandomRunning");
      }
    }, tickMs);
  }

  /* -----------------------------
     EVENTS
  ----------------------------- */
  btnCustomHex?.addEventListener("click", () => {
    const v = prompt(`Enter hexadecimal (0-9, A-F). Current width: ${hexCount} digits`);
    if (v === null) return;
    const clean = v.replace(/\s+/g, "").toUpperCase();
    
    if (!/^[0-9A-F]+$/.test(clean)) return alert("Invalid hexadecimal.");
    if (clean.length > hexCount) return alert("Value too large for current digit width.");
    
    if (!setValue(BigInt("0x" + clean))) alert("Value out of range.");
    else updateUI();
  });

  btnCustomBinary?.addEventListener("click", () => {
    const v = prompt(`Enter binary (0, 1). Current width: ${hexCount * 4} bits`);
    if (v === null) return;
    const clean = v.replace(/\s+/g, "");
    
    if (!/^[01]+$/.test(clean)) return alert("Invalid binary.");
    if (clean.length > hexCount * 4) return alert("Value too large for current digit width.");
    
    if (!setValue(BigInt("0b" + clean))) alert("Value out of range.");
    else updateUI();
  });

  btnCustomDenary?.addEventListener("click", () => {
    const v = prompt(`Enter denary (0 to ${maxValue().toString()}):`);
    if (v === null) return;
    const clean = v.trim();
    
    if (!/^\d+$/.test(clean)) return alert("Invalid denary. Digits only.");
    if (!setValue(BigInt(clean))) alert(`Value out of range. Enter a number between 0 and ${maxValue().toString()}.`);
    else updateUI();
  });

  btnInc?.addEventListener("click", increment);
  btnDec?.addEventListener("click", decrement);

  btnClear?.addEventListener("click", clearAll);
  btnRandom?.addEventListener("click", runRandomBriefly);

  btnDigitsUp?.addEventListener("click", () => buildGrid(hexCount + 1));
  btnDigitsDown?.addEventListener("click", () => buildGrid(hexCount - 1));

  digitsInput?.addEventListener("change", () => buildGrid(Number(digitsInput.value)));

  toolboxToggle?.addEventListener("click", () => {
    const isCollapsed = hexPage?.classList.contains("toolboxCollapsed");
    hexPage.classList.toggle("toolboxCollapsed", !isCollapsed);
    toolboxToggle?.setAttribute("aria-expanded", isCollapsed ? "true" : "false");
  });

  window.addEventListener("resize", computeColsForHexGrid);

  /* -----------------------------
     INIT
  ----------------------------- */
  buildGrid(hexCount);

})();