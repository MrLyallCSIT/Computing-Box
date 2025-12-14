let bits = [128,64,32,16,8,4,2,1];
let state = Array(8).fill(0);

const denaryEl = document.getElementById("denaryNumber");
const binaryEl = document.getElementById("binaryNumber");
const bitEls = document.querySelectorAll(".bit");

bitEls.forEach((el, i) => {
  el.addEventListener("click", () => {
    state[i] = state[i] ? 0 : 1;
    el.classList.toggle("on");
    update();
  });
});

function update() {
  const denary = state.reduce((sum, bit, i) => sum + bit * bits[i], 0);
  denaryEl.textContent = denary;
  binaryEl.textContent = state.join("");
}

function requestBinary() {
  const input = prompt("Enter 8-bit binary:");
  if (!/^[01]{8}$/.test(input)) return;
  state = input.split("").map(Number);
  bitEls.forEach((el,i)=>el.classList.toggle("on",state[i]));
  update();
}

function requestDenary() {
  const input = parseInt(prompt("Enter denary (0–255)"),10);
  if (isNaN(input) || input < 0 || input > 255) return;

  let value = input;
  state = bits.map(b => {
    if (value >= b) {
      value -= b;
      return 1;
    }
    return 0;
  });

  bitEls.forEach((el,i)=>el.classList.toggle("on",state[i]));
  update();
}

function shiftBinary(dir) {
  if (dir === "left") state.shift(), state.push(0);
  if (dir === "right") state.pop(), state.unshift(0);
  bitEls.forEach((el,i)=>el.classList.toggle("on",state[i]));
  update();
}

update();
