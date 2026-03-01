// public/js/tools/unsigned-binary.js
// Lightweight: no frameworks. Works on weak devices.
const BIT_COUNT = 8;
const MAX_DENARY = 255;
let bits = new Array(BIT_COUNT).fill(false);
function bitsToBinaryString(){
 return bits.map(b => (b ? "1" : "0")).join("");
}
function bitsToDenary(){
 // MSB on the left: 128..1
 const weights = [128,64,32,16,8,4,2,1];
 return bits.reduce((acc, b, i) => acc + (b ? weights[i] : 0), 0);
}
function render(){
 const grid = document.getElementById("bitGrid");
 grid.innerHTML = "";
 const weights = [128,64,32,16,8,4,2,1];
 bits.forEach((on, i) => {
 const btn = document.createElement("button");
 btn.type = "button";
 btn.className = "btn";
 btn.style.width = "100%";
 btn.style.justifyContent = "space-between";
 btn.setAttribute("aria-pressed", on ? "true" : "false");
 btn.innerHTML = `<span>${weights[i]}</span><b>${on ? "1" : "0"}</b>`;
 btn.addEventListener("click", () => {
 bits[i] = !bits[i];
 update();
 });
 grid.appendChild(btn);
 });
}
function update(){
 document.getElementById("binaryNumber").innerText = bitsToBinaryString();
 document.getElementById("denaryNumber").innerText = bitsToDenary();
 render();
}
function requestBinary(){
 let v;
 do{
 v = prompt("Enter an 8-bit binary value (8 digits, only 0 or 1):", bitsToBinaryString());
 if(v === null) return;
 v = v.trim();
 }while(!/^[01]{8}$/.test(v));
 bits = v.split("").map(ch => ch === "1");
 update();
}
function requestDenary(){
 let v;
 do{
 v = prompt("Enter a denary value (0 to 255):", String(bitsToDenary()));
 if(v === null) return;
 v = Number(v);
 }while(!Number.isInteger(v) || v < 0 || v > MAX_DENARY);
 // set bits from MSB to LSB
 const weights = [128,64,32,16,8,4,2,1];
 bits = weights.map(w => {
 if(v >= w){ v -= w; return true; }
 return false;
 });
 update();
}
function reset(){
 bits = new Array(BIT_COUNT).fill(false);
 update();
}
document.addEventListener("DOMContentLoaded", () => {
 document.getElementById("btnCustomBinary")?.addEventListener("click", requestBinary);
 document.getElementById("btnCustomDenary")?.addEventListener("click", requestDenary);
 document.getElementById("btnReset")?.addEventListener("click", reset);
 update();
});
