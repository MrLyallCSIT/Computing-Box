// Ensure the script only runs if the URL path contains "hexadecimal"
if (window.location.pathname.includes('hexadecimal')) {

    const isGCSE = window.location.pathname.includes('gcse-hexadecimal');
    const hexLength = isGCSE ? 2 : 4;
    const binaryLength = isGCSE ? 8 : 16;
    const maxDenary = isGCSE ? 255 : 65535;

    const placeValues = { 1: 0, 16: 0, 256: 0, 4096: 0 };
    const sliders = {};
    const columnValues = isGCSE ? [16, 1] : [4096, 256, 16, 1];

    // Attach event listeners for sliders
    ['slider1', 'slider16', 'slider256', 'slider4096'].forEach((sliderId) => {
        const slider = document.getElementById(sliderId);
        if (slider) {
            sliders[sliderId] = slider;
            slider.addEventListener("input", (e) => {
                e.stopPropagation(); // Prevent event propagation to Bootstrap
                updatePlace(parseInt(sliderId.replace('slider', ''), 10));
            });
        }
    });

    function updatePlace(place) {
        if (sliders[`slider${place}`]) {
            placeValues[place] = parseInt(sliders[`slider${place}`].value, 10);
            updateNumbers();
        }
    }

    function updateNumbers() {
        let denary = 0;
        let binary = '';
        let hexadecimal = '';

        columnValues.forEach((column) => {
            const value = placeValues[column];
            denary += value * column;
            binary += convertToBinary(value);
            hexadecimal += convertToHex(value);
        });

        binary = binary.slice(-binaryLength).padStart(binaryLength, '0');
        hexadecimal = hexadecimal.slice(-hexLength).padStart(hexLength, '0');

        document.getElementById("binaryNumber").innerText = binary;
        document.getElementById("denaryNumber").innerText = denary;
        document.getElementById("hexadecimalNumber").innerText = hexadecimal;
    }

    function convertToBinary(num) {
        return num.toString(2).padStart(4, '0');
    }

    function convertToHex(num) {
        return num.toString(16).toUpperCase();
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateNumbers();
    });
}
