const LIGHT_MULTIPLIER = 100 / 15;
const COLORS = ['R', 'G', 'B'];
const PLACES = [1, 16];

let denary = 0;
let redDenary = 0;
let greenDenary = 0;
let blueDenary = 0;
let redBinary = "";
let greenBinary = "";
let blueBinary = "";
let hexadecimal = "";

const places = {
    R16: 0, R1: 0,
    G16: 0, G1: 0,
    B16: 0, B1: 0
};

function resetColours() {
    COLORS.forEach(color => {
        PLACES.forEach(place => {
            resetPlace(color, place);
        });
    });
}

function resetPlace(color, place) {
    const placeKey = `${color}${place}`;
    places[placeKey] = 0;
    const light = (LIGHT_MULTIPLIER * places[placeKey]) / 100;
    document.getElementById(`blb${placeKey}`).style.opacity = light;
    updateColours();
}

function togglePlace(color, place, direction) {
    const placeKey = `${color}${place}`;
    const currentValue = places[placeKey];
    if ((direction === 'up' && currentValue < 15) || (direction === 'down' && currentValue > 0)) {
        places[placeKey] += direction === 'up' ? 1 : -1;
        const light = (LIGHT_MULTIPLIER * places[placeKey]) / 100;
        document.getElementById(`blb${placeKey}`).style.opacity = light;
        updateColours();
    }
}

function updateColours() {
    redDenary = (places.R16 * 16) + places.R1;
    greenDenary = (places.G16 * 16) + places.G1;
    blueDenary = (places.B16 * 16) + places.B1;

    denary = `${redDenary}, ${greenDenary}, ${blueDenary}`;
    hexadecimal = `#${convertToHex(places.R16)}${convertToHex(places.R1)}${convertToHex(places.G16)}${convertToHex(places.G1)}${convertToHex(places.B16)}${convertToHex(places.B1)}`;

    redBinary = `${convertToBinary(places.R16)}${convertToBinary(places.R1)}`;
    greenBinary = `${convertToBinary(places.G16)}${convertToBinary(places.G1)}`;
    blueBinary = `${convertToBinary(places.B16)}${convertToBinary(places.B1)}`;

    document.getElementById("denaryNumber").innerHTML = denary;
    document.getElementById("hexadecimalNumber").innerHTML = hexadecimal;
    document.getElementById("colouredHex").style.backgroundColor = hexadecimal;
    document.getElementById("invertedHex").style.backgroundColor = invertedHex();
    document.getElementById("redBinaryNumber").innerHTML = redBinary;
    document.getElementById("blueBinaryNumber").innerHTML = blueBinary;
    document.getElementById("greenBinaryNumber").innerHTML = greenBinary;
}

function invertedHex() {
    return `#${convertToHex(15 - places.R16)}${convertToHex(15 - places.R1)}${convertToHex(15 - places.G16)}${convertToHex(15 - places.G1)}${convertToHex(15 - places.B16)}${convertToHex(15 - places.B1)}`;
}

function convertToHex(num) {
    return num < 10 ? num.toString() : String.fromCharCode(55 + num); // 55 = ASCII offset for A (65) - 10
}

function convertToBinary(num) {
    return num.toString(2).padStart(4, '0');
}

function updateHex(customHex) {
    if (!customHex) {
        resetColours();
    } else {
        if (customHex.charAt(0) === "#") customHex = customHex.slice(1);
        if (isHex(customHex) && customHex.length === 6) {
            customHex.split('').forEach((digit, i) => {
                const color = COLORS[Math.floor(i / 2)];
                const place = i % 2 === 0 ? 16 : 1;
                const placeKey = `${color}${place}`;
                places[placeKey] = parseInt(digit, 16);
                const light = (LIGHT_MULTIPLIER * places[placeKey]) / 100;
                document.getElementById(`blb${placeKey}`).style.opacity = light;
            });
            updateColours();
        } else {
            alert("Invalid Entry");
            resetColours();
        }
    }
}

function isHex(str) {
    return /^[0-9A-Fa-f]+$/.test(str);
}

function requestHex() {
    const customHex = prompt("Please enter your Hex Value");
    updateHex(customHex);
}

function invertHex() {
    updateHex(invertedHex());
}
