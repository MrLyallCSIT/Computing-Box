// ** Check if the filename contains "binary" **
if (window.location.pathname.includes('binary')) {

    let denary = 0;
    let bits = {
        '-128': false,
        '1': false,
        '2': false,
        '4': false,
        '8': false,
        '16': false,
        '32': false,
        '64': false,
        '128': false
    };

    let bitValues = [];
    const twosComplementCheck = document.getElementById("blbN128");

    // ** Initialize the bit values on page load **
    function initialize() {
        setBitValues(); // Set the bit values dynamically
        resetBinarySimulator(); // Reset the simulator to the initial state
    }

    // ** Dynamically set bit values based on 2's complement mode **
    function setBitValues() {
        bitValues = twosComplementCheck 
            ? [-128, 64, 32, 16, 8, 4, 2, 1] 
            : [128, 64, 32, 16, 8, 4, 2, 1];
    }

    // ** Helper function to toggle power for a specific bit **
    function togglePower(bitValue, isActive) {
        const bitId = bitValue < 0 ? `N${Math.abs(bitValue)}` : bitValue;
        const bulb = document.getElementById(`blb${bitId}`);
        const switchBtn = document.getElementById(`swt${bitId}`);
        if (bulb && switchBtn) {
            bulb.classList.toggle('poweredOn', isActive);
            bulb.classList.toggle('poweredOff', !isActive);
            switchBtn.classList.toggle('btnActive', isActive);
        }
    }

    // ** Reset all bits and denary **
    function resetBinarySimulator() {
        Object.keys(bits).forEach(bit => {
            togglePower(parseInt(bit, 10), false);
            bits[bit] = false;
        });
        denary = 0;
        updateBinary();
    }

    // ** Toggle a specific bit **
    function changeBit(bitValue) {
        const key = getBitKey(bitValue);
        const isActive = bits[key];
        togglePower(bitValue, !isActive);
        bits[key] = !isActive;
        denary += isActive ? -bitValue : bitValue;
        updateBinary();
    }

    // ** Update binary string and denary display **
    function updateBinary() {
        const binary = bitValues.map(bit => (bits[getBitKey(bit)] ? '1' : '0')).join('');
        document.getElementById("denaryNumber").innerText = denary;
        document.getElementById("binaryNumber").innerText = binary;
    }

    // ** Parse a custom binary string and set bits accordingly **
    function customBinaryParser(binaryPattern) {
        resetBinarySimulator();
        binaryPattern = binaryPattern.padStart(8, '0'); // Ensure 8-bit format
        binaryPattern.split('').forEach((bit, index) => {
            if (bit === '1') {
                changeBit(bitValues[index]);
            }
        });
    }

    // ** Parse a custom denary value and set bits accordingly **
    function customDenaryParser(customDenary) {
        const min = twosComplementCheck ? -128 : 0;
        const max = twosComplementCheck ? 127 : 255;

        if (customDenary === null) {
            customDenary = 0; // Default to 0 if user cancels input
        }

        if (customDenary < min || customDenary > max) {
            alert(`Invalid input! Please enter a denary value between ${min} and ${max}.`);
            return requestDenary(); // Prompt user again
        }

        resetBinarySimulator();
        if (twosComplementCheck && customDenary < 0) {
            let absDenary = Math.abs(customDenary);
            if (customDenary === -128) {
                changeBit(-128);
            } else {
                bitValues.forEach(bit => {
                    if (absDenary >= Math.abs(bit)) {
                        changeBit(bit);
                        absDenary -= Math.abs(bit);
                    }
                });
                twosComplementFlip();
            }
        } else {
            bitValues.forEach(bit => {
                if (customDenary >= Math.abs(bit)) {
                    changeBit(bit);
                    customDenary -= Math.abs(bit);
                }
            });
        }
    }

    // ** Handle logical binary shifting (left or right) **
    function shiftBinary(direction) {
        const binaryString = document.getElementById("binaryNumber").innerText;
        let shiftedBinary;
        if (direction === 'left') {
            shiftedBinary = binaryString.slice(1) + '0';
        } else if (direction === 'right') {
            shiftedBinary = '0' + binaryString.slice(0, -1);
        }
        customBinaryParser(shiftedBinary);
    }

    // ** Handle arithmetic shifting for 2's complement **
    function shiftTwosComplement(direction) {
        const binaryString = document.getElementById("binaryNumber").innerText;
        let shiftedBinary;
        if (direction === 'left') {
            shiftedBinary = binaryString.slice(1) + '0';
        } else if (direction === 'right') {
            shiftedBinary = binaryString[0] + binaryString.slice(0, -1);
        }
        customBinaryParser(shiftedBinary);
    }

    // ** Flip binary bits for 2's complement **
    function twosComplementFlip() {
        let binary = document.getElementById("binaryNumber").innerText;
        const flippedBinary = binary.split('').map(bit => (bit === '1' ? '0' : '1')).join('');
        const result = addBinaryNumbers(flippedBinary, '00000001');
        customBinaryParser(result.binaryResult);
    }

    // ** Add two binary numbers **
    function addBinaryNumbers(binary1, binary2) {
        let carry = 0;
        let result = '';
        for (let i = 7; i >= 0; i--) {
            const bit1 = parseInt(binary1[i], 10) || 0;
            const bit2 = parseInt(binary2[i], 10) || 0;
            const sum = bit1 + bit2 + carry;
            result = (sum % 2) + result;
            carry = Math.floor(sum / 2);
        }
        return { binaryResult: result.slice(-8), overflow: carry ? '1' : '0' };
    }

    // ** Helper to normalize bit keys **
    function getBitKey(bitValue) {
        return bitValue < 0 ? `N${Math.abs(bitValue)}` : bitValue.toString();
    }

    // ** Request binary input from user **
    function requestBinary() {
        let binary;
        do {
            binary = prompt("Please enter an 8-bit Binary Value (only 0s and 1s are allowed):");
            if (binary === null) {
                binary = "00000000"; // Default to 0 if user cancels input
                break;
            }
            if (!/^[01]{1,8}$/.test(binary)) {
                alert("Invalid input! Binary values must be up to 8 digits long and only contain 0 or 1.");
            }
        } while (!/^[01]{1,8}$/.test(binary));
        customBinaryParser(binary);
    }

    // ** Request denary input from user **
    function requestDenary() {
        let customDenary;
        const min = twosComplementCheck ? -128 : 0;
        const max = twosComplementCheck ? 127 : 255;

        do {
            customDenary = prompt(`Enter a Denary Value (${min} to ${max}):`);
            if (customDenary === null) {
                customDenary = 0; // Default to 0 if user cancels input
                break;
            }
            customDenary = parseInt(customDenary, 10);
            if (isNaN(customDenary) || customDenary < min || customDenary > max) {
                alert(`Invalid input! Please enter a denary value between ${min} and ${max}.`);
            }
        } while (isNaN(customDenary) || customDenary < min || customDenary > max);
        customDenaryParser(customDenary);
    }

    // ** On page load, initialize the simulator **
    document.addEventListener("DOMContentLoaded", initialize);
}