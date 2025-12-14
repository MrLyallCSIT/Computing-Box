let inputs = {
    input1: false,
    input2: false
};

let gateValue = false;

// ** Toggle input (handles both input1 and input2) **
function toggleInput(inputNumber) {
    const inputKey = `input${inputNumber}`;
    inputs[inputKey] = !inputs[inputKey];
    updateInputState(`swtInput${inputNumber}`, inputs[inputKey]);
    updateGate();
}

// ** Update the gate's state based on the current inputs and gate type **
function updateGate() {
    const pageHeading = document.getElementById("pageHeading").textContent;
    gateValue = evaluateGate(pageHeading);
    updateGateLight(pageHeading, gateValue);
}

// ** Evaluate the gate logic **
function evaluateGate(pageHeading) {
    const { input1, input2 } = inputs;

    switch (pageHeading) {
        case "AND Gate":
            return input1 && input2;
        case "OR Gate":
            return input1 || input2;
        case "NOT Gate":
            return !input1; // NOT gate only uses Input1
        case "NAND Gate":
            return !(input1 && input2); // Correct NAND logic
        case "NOR Gate":
            return !(input1 || input2);
        case "XOR Gate":
            return input1 !== input2; // XOR is true if inputs are different
        case "XNOR Gate":
            return input1 === input2; // XNOR is true if inputs are the same
        default:
            console.error("Unknown Gate Type");
            return false;
    }
}

// ** Update the lightbulb based on the gate's value **
function updateGateLight(pageHeading, value) {
    const lightBulbId = getLightBulbId(pageHeading);
    const lightBulb = document.getElementById(lightBulbId);
    if (lightBulb) {
        lightBulb.classList.toggle("poweredOn", value);
        lightBulb.classList.toggle("poweredOff", !value);
    }
}

// ** Get the correct lightbulb ID based on the gate type **
function getLightBulbId(pageHeading) {
    switch (pageHeading) {
        case "AND Gate":
            return "blbAndGate";
        case "OR Gate":
            return "blbOrGate";
        case "NOT Gate":
            return "blbNotGate";
        case "NAND Gate":
            return "blbNandGate";
        case "NOR Gate":
            return "blbNorGate";
        case "XOR Gate":
            return "blbXorGate";
        case "XNOR Gate":
            return "blbXnorGate";
        default:
            console.error("Unknown Gate Type");
            return null;
    }
}

// ** Update the toggle switch to reflect its active/inactive state **
function updateInputState(switchId, isActive) {
    const toggleSwitch = document.getElementById(switchId);
    if (toggleSwitch) {
        toggleSwitch.classList.toggle("btnActive", isActive);
    }
}

// ** Reset the gate to its default state **
function resetGate() {
    inputs.input1 = false;
    inputs.input2 = false;
    updateInputState("swtInput1", inputs.input1);
    updateInputState("swtInput2", inputs.input2);

    const pageHeading = document.getElementById("pageHeading").textContent;

    if (pageHeading === "NOT Gate") {
        // For NOT Gate, the light should be on by default
        gateValue = true;
        updateGateLight(pageHeading, gateValue);
    } else {
        updateGate();
    }
}
