// Browser-only script. Safe because it's loaded via <script> (not server-imported).

const BIT_COUNT = 8; // unsigned page = 8 bits
const bitValues = [128, 64, 32, 16, 8, 4, 2, 1];

const elDenary = document.getElementById("denaryNumber");
const elBinary = document.getElementById("binaryNumber");
const elSwitches = document.getElementById("bitSwitches");

const btnCustomDenary = document.getElementById("btnCustomDenary");
const btnCustomBinary = document.getElementById("btnCustomBinary");
const btnReset = document.getElementById("btnReset");

let bits = new Array(BIT_COUNT).fill(false);

function renderSwitches() {
  elSwitches.innerHTML = "";

  bitValues.forEach((value, index) => {
    const id = `bit-${value}`;

    const wrapper = document.createElement("div");
    wrapper.className = "switch-col";

    const labelTop = document.createElement("div");
    labelTop.className = "bit-label";
    labelTop.textContent = value;

    const label = document.createElement("label");
    label.className = "rocker";
    label.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.checked = bits[index];

    input.addEventListener("change", () => {
      bits[index] = input.checked;
      updateNumbers();
    });

    const span = document.createElement("span");
    span.className = "rocker-body";
    span.setAttribute("aria-hidden", "true");

    label.appendChild(input);
    label.appendChild(span);

    wrapper.appendChild(labelTop);
    wrapper.appendChild(label);

    elSwitches.appendChild(wrapper);
  });
}

function updateNumbers() {
  const binary = bits.map(b => (b ? "1" : "0")).join("");
  const denary = bits.reduce((acc, b, i) => acc + (b ? bitValues[i] : 0), 0);

  elBinary.textContent = binary;
  elDenary.textContent = denary.toString();
}

function resetAll() {
  bits = new Array(BIT_COUNT).fill(false);
  renderSwitches();
  updateNumbers();
}

function requestCustomDenary() {
  let input = prompt(`Enter a denary number (0 to 255):`);
  if (input === null) return;

  const n = Number.parseInt(input, 10);
  if (Number.isNaN(n) || n < 0 || n > 255) {
    alert("Invalid input. Enter a number from 0 to 255.");
    return;
  }

  let remaining = n;
  bits = bitValues.map(v => {
    if (remaining >= v) {
      remaining -= v;
      return true;
    }
    return false;
  });

  renderSwitches();
  updateNumbers();
}

function requestCustomBinary() {
  let input = prompt(`Enter an ${BIT_COUNT}-bit binary number (e.g. 01010101):`);
  if (input === null) return;

  input = input.trim();
  const re = new RegExp(`^[01]{${BIT_COUNT}}$`);
  if (!re.test(input)) {
    alert(`Invalid input. Enter exactly ${BIT_COUNT} digits using only 0 or 1.`);
    return;
  }

  bits = input.split("").map(c => c === "1");
  renderSwitches();
  updateNumbers();
}

btnCustomDenary?.addEventListener("click", requestCustomDenary);
btnCustomBinary?.addEventListener("click", requestCustomBinary);
btnReset?.addEventListener("click", resetAll);

renderSwitches();
updateNumbers();
