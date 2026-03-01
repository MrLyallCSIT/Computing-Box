// src/scripts/hexColours.js
// Computing:Box — Hex Colours logic

(() => {
  /* -----------------------------
     DOM
  ----------------------------- */
  const colorGrid = document.getElementById("colorGrid");
  const denaryEl = document.getElementById("denaryNumber");
  const binaryEl = document.getElementById("binaryNumber");
  const hexEl = document.getElementById("hexNumber");
  const previewColor = document.getElementById("previewColor");
  const previewInverted = document.getElementById("previewInverted");

  const btnCustomHex = document.getElementById("btnCustomHex");
  const btnCustomRGB = document.getElementById("btnCustomRGB");
  const btnInvert = document.getElementById("btnInvert");
  const btnRandom = document.getElementById("btnRandom");
  const btnClear = document.getElementById("btnClear");

  const toolboxToggle = document.getElementById("toolboxToggle");
  const colorPage = document.getElementById("colorPage");

  /* -----------------------------
     STATE
  ----------------------------- */
  // rgb[0]=Red, rgb[1]=Green, rgb[2]=Blue (Values 0-255)
  let rgb = [0, 0, 0];
  let randomTimer = null;

  /* -----------------------------
     BUILD UI
  ----------------------------- */
  function buildGrid() {
    if (!colorGrid) return;
    colorGrid.innerHTML = "";

    const colorClasses = ['text-red', 'text-green', 'text-blue'];

    for (let c = 0; c < 3; c++) {
      const group = document.createElement("div");
      group.className = "colorGroup";

      for (let i = 1; i >= 0; i--) {
        const col = document.createElement("div");
        col.className = "hexCol";

        let cardHTML = `
          <div class="hexCard">
            <div class="hexCardButtons">
              <button class="hexCardBtn inc" id="colorInc-${c}-${i}">▲</button>
              <button class="hexCardBtn dec" id="colorDec-${c}-${i}">▼</button>
            </div>
            <div class="hexDigitDisplay num ${colorClasses[c]}" id="colorDisplay-${c}-${i}">0</div>
            <div class="hexNibbleRow">
        `;

        for (let j = 3; j >= 0; j--) {
          cardHTML += `
              <div class="hexNibbleBit">
                <div class="bulb hexNibbleBulb" id="colorBulb-${c}-${i}-${j}" aria-hidden="true">
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
          <div class="hexColWeight ${colorClasses[c]}">${16 ** i}</div>
        `;

        col.innerHTML = cardHTML;

        const incBtn = col.querySelector(`#colorInc-${c}-${i}`);
        const decBtn = col.querySelector(`#colorDec-${c}-${i}`);

        incBtn.addEventListener("click", () => {
          const weight = 16 ** i;
          rgb[c] = (rgb[c] + weight) % 256;
          updateUI();
        });

        decBtn.addEventListener("click", () => {
          const weight = 16 ** i;
          rgb[c] = (rgb[c] - weight + 256) % 256;
          updateUI();
        });

        group.appendChild(col);
      }
      colorGrid.appendChild(group);
    }
  }

  /* -----------------------------
     UI UPDATE
  ----------------------------- */
  function updateUI() {
    if (denaryEl) {
      denaryEl.innerHTML = `
        <span class="text-red">${rgb[0]}</span>
        <span class="text-green">${rgb[1]}</span>
        <span class="text-blue">${rgb[2]}</span>
      `;
    }

    const hexVals = rgb.map(v => v.toString(16).padStart(2, '0').toUpperCase());
    const fullHexString = `#${hexVals.join('')}`;
    
    if (hexEl) {
      hexEl.innerHTML = `
        <span class="text-red"><span style="color:var(--muted)">#</span>${hexVals[0]}</span>
        <span class="text-green">${hexVals[1]}</span>
        <span class="text-blue">${hexVals[2]}</span>
      `;
    }

    if (binaryEl) {
      binaryEl.innerHTML = `
        <span class="text-red">${rgb[0].toString(2).padStart(8, '0')}</span>
        <span class="text-green">${rgb[1].toString(2).padStart(8, '0')}</span>
        <span class="text-blue">${rgb[2].toString(2).padStart(8, '0')}</span>
      `;
    }

    if (previewColor) previewColor.style.backgroundColor = fullHexString;
    
    const invertedHexString = "#" + rgb.map(v => (255 - v).toString(16).padStart(2, '0').toUpperCase()).join('');
    if (previewInverted) previewInverted.style.backgroundColor = invertedHexString;

    for (let c = 0; c < 3; c++) {
      const val = rgb[c];
      const nibbles = [val % 16, Math.floor(val / 16)];

      for (let i = 0; i < 2; i++) {
        const display = document.getElementById(`colorDisplay-${c}-${i}`);
        if (display) display.textContent = nibbles[i].toString(16).toUpperCase();

        for (let j = 0; j < 4; j++) {
          const bulb = document.getElementById(`colorBulb-${c}-${i}-${j}`);
          if (bulb) {
            const isOn = (nibbles[i] & (1 << j)) !== 0;
            bulb.classList.toggle("on", isOn);
          }
        }
      }
    }
  }

  /* -----------------------------
     ACTIONS
  ----------------------------- */
  function clearAll() {
    rgb = [0, 0, 0];
    updateUI();
  }

  function setRandomOnce() {
    const arr = new Uint8Array(3);
    crypto.getRandomValues(arr);
    rgb = [arr[0], arr[1], arr[2]];
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
    let v = prompt("Enter a 6-character hex code (e.g. FF0055):");
    if (v === null) return;
    v = v.replace(/\s+/g, "").replace(/^#/i, "").toUpperCase();
    
    if (!/^[0-9A-F]{6}$/.test(v)) return alert("Invalid hex code. Please enter exactly 6 hexadecimal characters.");
    
    rgb = [
      parseInt(v.substring(0, 2), 16),
      parseInt(v.substring(2, 4), 16),
      parseInt(v.substring(4, 6), 16)
    ];
    updateUI();
  });

  btnCustomRGB?.addEventListener("click", () => {
    const v = prompt("Enter R, G, B values (0-255) separated by commas (e.g. 255, 128, 0):");
    if (v === null) return;
    
    const parts = v.split(',').map(s => parseInt(s.trim(), 10));
    if (parts.length !== 3 || parts.some(isNaN) || parts.some(n => n < 0 || n > 255)) {
      return alert("Invalid input. Please provide three numbers between 0 and 255.");
    }
    
    rgb = parts;
    updateUI();
  });

  btnInvert?.addEventListener("click", () => {
    rgb = rgb.map(v => 255 - v);
    updateUI();
  });

  btnClear?.addEventListener("click", clearAll);
  btnRandom?.addEventListener("click", runRandomBriefly);

  toolboxToggle?.addEventListener("click", () => {
    const isCollapsed = colorPage?.classList.contains("toolboxCollapsed");
    colorPage.classList.toggle("toolboxCollapsed", !isCollapsed);
    toolboxToggle?.setAttribute("aria-expanded", isCollapsed ? "true" : "false");
  });

  /* -----------------------------
     INIT
  ----------------------------- */
  buildGrid();
  updateUI();
})();