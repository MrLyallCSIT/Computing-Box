// src/scripts/pcBuilder.js
// Computing:Box — Advanced PC Sandbox

(() => {
  const workspace = document.getElementById("workspace");
  const viewport = document.getElementById("viewport");
  const wireLayer = document.getElementById("wireLayer");
  const specsContainer = document.getElementById("buildSpecsContainer");
  const toolboxGrid = document.getElementById("toolboxGrid");
  const btnClearBoard = document.getElementById("btnClearBoard");
  const toolboxToggle = document.getElementById("toolboxToggle");
  const pcPage = document.getElementById("pcPage");

  /* --- ULTRA-REALISTIC COMPONENT LIBRARY --- */
  const PC_PARTS = {
    'CASE': {
      name: 'ATX PC Case', w: 600, h: 550, z: 5, ports: [],
      slots: {
        'MB1': { x: 20, y: 20, accepts: 'MB' },
        'PSU1': { x: 20, y: 440, accepts: 'PSU' },
        'HDD1': { x: 440, y: 20, accepts: 'HDD' },
        'HDD2': { x: 440, y: 170, accepts: 'HDD' },
        'SATA_SSD1': { x: 440, y: 320, accepts: 'SATA_SSD' },
        'SATA_SSD2': { x: 440, y: 400, accepts: 'SATA_SSD' }
      },
      svg: `<rect width="600" height="550" fill="#15171c" rx="10" stroke="#333" stroke-width="4"/><rect x="20" y="20" width="380" height="400" fill="none" stroke="#222" stroke-width="2"/><rect x="20" y="440" width="180" height="90" fill="none" stroke="#222" stroke-width="2"/><rect x="440" y="20" width="140" height="510" fill="none" stroke="#222" stroke-width="2"/>`
    },
    'MB': {
      name: 'Motherboard', w: 360, h: 400, z: 10,
      ports: [
        { id: 'atx_pwr', x: 340, y: 150 }, { id: 'sata1', x: 340, y: 300 }, { id: 'sata2', x: 340, y: 330 },
        { id: 'usb1', x: 10, y: 40 }, { id: 'usb2', x: 10, y: 70 }, { id: 'audio', x: 10, y: 170 }, { id: 'disp', x: 10, y: 210 }
      ],
      slots: {
        'CPU1': { x: 120, y: 40, accepts: 'CPU' },
        'COOLER1': { x: 100, y: 20, accepts: 'COOLER' }, 
        'RAM1': { x: 230, y: 30, accepts: 'RAM' }, 'RAM2': { x: 250, y: 30, accepts: 'RAM' }, 
        'RAM3': { x: 270, y: 30, accepts: 'RAM' }, 'RAM4': { x: 290, y: 30, accepts: 'RAM' },
        'M2_1': { x: 120, y: 170, accepts: 'M2_SSD' }, 'M2_2': { x: 120, y: 250, accepts: 'M2_SSD' },
        'PCIE1': { x: 40, y: 200, accepts: 'GPU' }, 'PCIE2': { x: 40, y: 300, accepts: 'GPU' }
      },
      svg: `<rect width="360" height="400" fill="#2C303A" rx="8" stroke="#4b5060" stroke-width="3"/><rect x="120" y="40" width="80" height="80" fill="#1f2229" stroke="#4b5060"/><rect x="230" y="30" width="15" height="100" fill="#1f2229"/><rect x="250" y="30" width="15" height="100" fill="#1f2229"/><rect x="270" y="30" width="15" height="100" fill="#1f2229"/><rect x="290" y="30" width="15" height="100" fill="#1f2229"/><rect x="40" y="200" width="280" height="15" fill="#15171c"/><rect x="40" y="300" width="280" height="15" fill="#15171c"/><rect x="120" y="170" width="80" height="15" fill="#1f2229" stroke="#4b5060" stroke-dasharray="2 2"/><text x="160" y="182" fill="#555" font-size="10" font-family="sans-serif" text-anchor="middle">M.2_1</text><rect x="120" y="250" width="80" height="15" fill="#1f2229" stroke="#4b5060" stroke-dasharray="2 2"/><text x="160" y="262" fill="#555" font-size="10" font-family="sans-serif" text-anchor="middle">M.2_2</text>`
    },
    'CPU': { 
      name: 'Processor', w: 80, h: 80, z: 20, ports: [], slots: {}, 
      svg: `<rect width="80" height="80" fill="#0c4a22" rx="4"/><rect x="2" y="2" width="76" height="76" fill="none" stroke="#ffd700" stroke-width="1" stroke-dasharray="2 4"/><rect x="12" y="12" width="56" height="56" fill="#e0e4e8" rx="6" stroke="#b0b5b9" stroke-width="2"/><text x="40" y="35" fill="#666" font-family="sans-serif" font-size="10" font-weight="900" text-anchor="middle">INTEL</text><text x="40" y="50" fill="#555" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">CORE i9</text><text x="40" y="60" fill="#777" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle">14900K</text><polygon points="5,75 15,75 5,65" fill="#ffd700"/>` 
    },
    'COOLER': { 
      name: 'Liquid AIO', w: 120, h: 120, z: 30, ports: [], slots: {}, 
      svg: `<circle cx="60" cy="60" r="55" fill="#15171e" stroke="#2d313d" stroke-width="4"/><circle cx="60" cy="60" r="45" fill="#050505"/><text x="60" y="55" fill="#28f07a" font-family="var(--num-font)" font-size="20" font-weight="bold" text-anchor="middle">32°C</text><text x="60" y="75" fill="#55aaff" font-family="var(--ui-font)" font-size="10" text-anchor="middle">2400 RPM</text><path d="M 110 40 Q 140 40 140 10 M 110 80 Q 150 80 150 110" fill="none" stroke="#111" stroke-width="12" stroke-linecap="round"/><circle cx="60" cy="60" r="50" fill="none" stroke="cyan" stroke-width="2" opacity="0.8"/>` 
    },
    'RAM': { 
      name: 'RGB Memory', w: 15, h: 100, z: 20, ports: [], slots: {}, 
      svg: `<rect width="15" height="100" fill="#111" rx="2"/><rect x="0" y="90" width="15" height="10" fill="#ffd700"/><rect x="0" y="94" width="15" height="1" fill="#b8860b"/><path d="M -2 15 L 17 15 L 17 85 L -2 85 Z" fill="#2d313d" stroke="#111"/><path d="M 0 20 L 15 30 L 15 80 L 0 70 Z" fill="#1a1c23"/><path d="M -2 2 L 17 2 L 17 15 L -2 15 Z" fill="#ff0055"/><path d="M 0 2 L 5 10 L 10 2 L 15 10" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>` 
    },
    'GPU': { 
      name: 'Graphics Card', w: 280, h: 80, z: 40, slots: {}, ports: [{ id: 'pwr_in', x: 270, y: 10 }, { id: 'disp_out', x: 10, y: 40 }], 
      svg: `<rect width="280" height="80" rx="8" fill="#15171e" stroke="#333742" stroke-width="2"/><rect x="5" y="5" width="270" height="70" rx="6" fill="#0f1015"/><path d="M 20 5 L 60 75 M 110 5 L 150 75 M 200 5 L 240 75" stroke="#1a1c23" stroke-width="4"/><g transform="translate(50, 40)"><circle r="32" fill="#111" stroke="#2d313d" stroke-width="2"/><circle r="10" fill="#222"/><path d="M0 -10 L15 -28 L25 -20 Z M0 10 L-15 28 L-25 20 Z M-10 0 L-28 -15 L-20 -25 Z M10 0 L28 15 L20 25 Z" fill="#1a1c23"/></g><g transform="translate(140, 40)"><circle r="32" fill="#111" stroke="#2d313d" stroke-width="2"/><circle r="10" fill="#222"/><path d="M0 -10 L15 -28 L25 -20 Z M0 10 L-15 28 L-25 20 Z M-10 0 L-28 -15 L-20 -25 Z M10 0 L28 15 L20 25 Z" fill="#1a1c23"/></g><g transform="translate(230, 40)"><circle r="32" fill="#111" stroke="#2d313d" stroke-width="2"/><circle r="10" fill="#222"/><path d="M0 -10 L15 -28 L25 -20 Z M0 10 L-15 28 L-25 20 Z M-10 0 L-28 -15 L-20 -25 Z M10 0 L28 15 L20 25 Z" fill="#1a1c23"/></g><rect x="20" y="80" width="160" height="8" fill="#ffd700" rx="2"/><rect x="100" y="32" width="80" height="16" fill="#000" rx="2" opacity="0.8"/><text x="140" y="43" fill="#28f07a" font-family="sans-serif" font-size="10" font-weight="900" text-anchor="middle">GEFORCE RTX</text>` 
    },
    'M2_SSD': { 
      name: 'M.2 NVMe SSD', w: 80, h: 22, z: 20, ports: [], slots: {}, 
      svg: `<rect width="80" height="22" fill="#111" rx="2"/><rect x="0" y="0" width="5" height="22" fill="#ffd700"/><rect x="3" y="14" width="3" height="4" fill="#111"/><rect x="15" y="4" width="18" height="14" fill="#1a1c23" rx="1"/><rect x="38" y="4" width="18" height="14" fill="#1a1c23" rx="1"/><rect x="60" y="6" width="10" height="10" fill="#2d313d" rx="1"/><rect x="10" y="8" width="50" height="6" fill="#fff" opacity="0.8"/><text x="35" y="13" fill="#000" font-family="sans-serif" font-size="4" font-weight="bold" text-anchor="middle">990 PRO 2TB</text><circle cx="76" cy="11" r="3" fill="#222"/>` 
    },
    'SATA_SSD': { 
      name: '2.5" SATA SSD', w: 100, h: 70, z: 20, slots: {}, ports: [{id:'data', x:90, y:20}, {id:'pwr', x:90, y:50}], 
      svg: `<rect width="100" height="70" fill="#1a1c23" rx="4" stroke="#4b5162" stroke-width="1"/><rect x="2" y="2" width="96" height="66" fill="#2d313d" rx="2"/><rect x="15" y="15" width="70" height="40" fill="#111" rx="2"/><rect x="15" y="45" width="70" height="10" fill="#e74c3c"/><text x="50" y="35" fill="#fff" font-family="sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="1px">SAMSUNG</text><circle cx="5" cy="5" r="1.5" fill="#111"/><circle cx="95" cy="5" r="1.5" fill="#111"/><circle cx="5" cy="65" r="1.5" fill="#111"/><circle cx="95" cy="65" r="1.5" fill="#111"/>` 
    },
    'HDD': { 
      name: '3.5" Mech HDD', w: 120, h: 140, z: 20, slots: {}, ports: [{id:'data', x:110, y:20}, {id:'pwr', x:110, y:120}], 
      svg: `<rect width="120" height="140" fill="#bdc3c7" rx="4" stroke="#7f8c8d" stroke-width="2"/><path d="M 5 5 L 115 5 L 115 110 C 80 120, 40 120, 5 110 Z" fill="#e0e4e8" stroke="#95a5a6" stroke-width="1"/><circle cx="60" cy="55" r="45" fill="none" stroke="#bdc3c7" stroke-width="2"/><circle cx="60" cy="55" r="12" fill="#bdc3c7" stroke="#95a5a6"/><circle cx="100" cy="100" r="8" fill="#bdc3c7" stroke="#95a5a6"/><path d="M 100 100 L 70 60" stroke="#7f8c8d" stroke-width="6" stroke-linecap="round"/><rect x="30" y="80" width="60" height="30" fill="#fff" rx="2"/><text x="60" y="92" fill="#000" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle">WD BLACK</text><text x="60" y="102" fill="#333" font-family="sans-serif" font-size="6" text-anchor="middle">12TB HDD</text><rect x="20" y="120" width="80" height="15" fill="#0b3d21" rx="2"/>` 
    },
    'PSU': { 
      name: 'Power Supply', w: 160, h: 90, z: 20, slots: {}, ports: [{id:'out1',x:150,y:20}, {id:'out2',x:150,y:40}, {id:'out3',x:150,y:60}, {id:'out4',x:150,y:80}], 
      svg: `<rect width="160" height="90" fill="#15171e" rx="4" stroke="#333742" stroke-width="2"/><rect x="40" y="5" width="80" height="80" fill="#0a0a0a" rx="40"/><circle cx="80" cy="45" r="38" fill="none" stroke="#2d313d" stroke-width="2"/><circle cx="80" cy="45" r="28" fill="none" stroke="#2d313d" stroke-width="2"/><circle cx="80" cy="45" r="18" fill="none" stroke="#2d313d" stroke-width="2"/><path d="M 80 5 L 80 85 M 40 45 L 120 45 M 52 20 L 108 70 M 108 20 L 52 70" stroke="#2d313d" stroke-width="2"/><circle cx="80" cy="45" r="8" fill="#111" stroke="#e74c3c"/><rect x="145" y="10" width="15" height="70" fill="#0a0a0a"/><rect x="5" y="15" width="25" height="60" fill="#333742" rx="2"/><text x="17" y="45" fill="#fff" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 17,45)">1200W</text>` 
    },
    'MONITOR': { 
      name: 'Monitor', w: 240, h: 180, z: 30, slots: {}, ports: [{id:'disp', x:120, y:140}], 
      svg: `<rect width="240" height="160" fill="#1a1a1a" rx="6" stroke="#333"/><rect x="8" y="8" width="224" height="124" fill="#000" id="screen-bg"/><g id="boot-content"></g><rect x="6" y="140" width="228" height="15" fill="#1a1c23"/><text x="120" y="150" fill="#fff" font-family="sans-serif" font-size="6" text-anchor="middle">ASUS</text><circle cx="220" cy="147" r="2" fill="#28f07a"/><path d="M 100 160 L 110 180 L 130 180 L 140 160 Z" fill="#222"/><rect x="80" y="180" width="80" height="5" fill="#333" rx="2"/>` 
    },
    'KEYBOARD': { 
      name: 'Keyboard', w: 180, h: 60, z: 30, slots: {}, ports: [{id:'usb', x:90, y:10}], 
      svg: `<rect width="180" height="60" fill="#15171e" rx="4" stroke="#2d313d" stroke-width="2"/><rect x="0" y="45" width="180" height="15" fill="#111" rx="2"/><rect x="5" y="5" width="170" height="36" fill="#0a0a0a" rx="2"/><g fill="#222" stroke="#111" stroke-width="1"><rect x="8" y="8" width="10" height="10" rx="2"/><rect x="20" y="8" width="10" height="10" rx="2"/><rect x="32" y="8" width="10" height="10" rx="2"/><rect x="44" y="8" width="10" height="10" rx="2"/><rect x="56" y="8" width="10" height="10" rx="2"/><rect x="68" y="8" width="10" height="10" rx="2"/><rect x="80" y="8" width="10" height="10" rx="2"/><rect x="92" y="8" width="10" height="10" rx="2"/><rect x="104" y="8" width="10" height="10" rx="2"/><rect x="116" y="8" width="10" height="10" rx="2"/><rect x="128" y="8" width="10" height="10" rx="2"/><rect x="140" y="8" width="18" height="10" rx="2"/><rect x="8" y="20" width="14" height="10" rx="2"/><rect x="24" y="20" width="10" height="10" rx="2"/><rect x="36" y="20" width="10" height="10" rx="2"/><rect x="48" y="20" width="10" height="10" rx="2"/><rect x="60" y="20" width="10" height="10" rx="2"/><rect x="72" y="20" width="10" height="10" rx="2"/><rect x="84" y="20" width="10" height="10" rx="2"/><rect x="96" y="20" width="10" height="10" rx="2"/><rect x="108" y="20" width="10" height="10" rx="2"/><rect x="120" y="20" width="10" height="10" rx="2"/><rect x="132" y="20" width="26" height="10" rx="2"/></g><rect x="56" y="32" width="60" height="10" fill="#222" stroke="#111" rx="2"/><rect x="4" y="4" width="172" height="38" fill="none" stroke="cyan" stroke-width="1" opacity="0.3"/>` 
    },
    'MOUSE': { 
      name: 'Mouse', w: 30, h: 54, z: 30, slots: {}, ports: [{id:'usb', x:15, y:5}], 
      svg: `<rect width="30" height="54" fill="#15171e" rx="15" stroke="#2d313d" stroke-width="2"/><path d="M 15 0 L 15 20 M 5 25 Q 15 30 25 25" stroke="#0a0a0a" stroke-width="2" fill="none"/><rect x="13" y="6" width="4" height="10" fill="#111" rx="2"/><rect x="14" y="7" width="2" height="8" fill="#28f07a"/><path d="M 10 45 Q 15 50 20 45" stroke="cyan" stroke-width="2" fill="none" opacity="0.8"/><path d="M 0 15 Q 4 25 0 35 M 30 15 Q 26 25 30 35" stroke="#111" stroke-width="2" fill="none"/>` 
    },
    'SPEAKER': { 
      name: 'Speakers', w: 46, h: 90, z: 30, slots: {}, ports: [{id:'audio', x:23, y:10}], 
      svg: `<rect width="46" height="90" fill="#1a1c23" rx="4" stroke="#333742" stroke-width="2"/><rect x="4" y="4" width="38" height="82" fill="#111" rx="2"/><circle cx="23" cy="22" r="10" fill="#2d313d" stroke="#0a0a0a" stroke-width="2"/><circle cx="23" cy="22" r="4" fill="#15171e"/><circle cx="23" cy="58" r="16" fill="#2d313d" stroke="#0a0a0a" stroke-width="3"/><circle cx="23" cy="58" r="6" fill="#15171e"/><circle cx="23" cy="80" r="4" fill="#000"/>` 
    }
  };

  let nodes = {}; 
  let connections = []; 
  let nextNodeId = 1, nextWireId = 1;

  let isDraggingNode = null, dragOffset = { x: 0, y: 0 };
  let wiringStart = null, tempWirePath = null;
  let selectedWireId = null, selectedNodeId = null;

  let panX = 0, panY = 0, zoom = 1;
  let isPanning = false, panStart = { x: 0, y: 0 }, isSystemBooted = false;

  /* --- Toolbox & Base Init --- */
  function initToolbox() {
    if(!toolboxGrid) return;
    let html = '';
    Object.keys(PC_PARTS).forEach(partKey => {
      html += `<div draggable="true" data-spawn="${partKey}" class="drag-item tb-icon-box" title="${PC_PARTS[partKey].name}">
           <svg viewBox="0 0 ${PC_PARTS[partKey].w} ${PC_PARTS[partKey].h}" style="max-width:80%; max-height:40px; pointer-events:none;">${PC_PARTS[partKey].svg}</svg>
           <div class="tb-icon-label">${partKey}</div></div>`;
    });
    toolboxGrid.innerHTML = html;
    document.querySelectorAll('.drag-item').forEach(item => { item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('spawnType', item.dataset.spawn); }); });
  }

  /* --- Viewport Math --- */
  function updateViewport() {
    viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    workspace.style.backgroundSize = `${32 * zoom}px ${32 * zoom}px`;
    workspace.style.backgroundPosition = `${panX}px ${panY}px`;
  }
  function zoomWorkspace(factor, mouseX, mouseY) {
    const newZoom = Math.min(Math.max(0.1, zoom * factor), 2);
    panX = mouseX - (mouseX - panX) * (newZoom / zoom); panY = mouseY - (mouseY - panY) * (newZoom / zoom);
    zoom = newZoom; updateViewport();
  }
  function getPortCoords(nodeId, portDataAttr) {
    const node = nodes[nodeId]; if (!node || !node.el) return {x:0, y:0};
    const portEl = node.el.querySelector(`[data-port="${portDataAttr}"]`); if (!portEl) return {x:0, y:0};
    const wsRect = workspace.getBoundingClientRect(); const portRect = portEl.getBoundingClientRect();
    return { x: (portRect.left - wsRect.left - panX + portRect.width / 2) / zoom, y: (portRect.top - wsRect.top - panY + portRect.height / 2) / zoom };
  }
  function drawBezier(x1, y1, x2, y2) { const cpDist = Math.abs(x2 - x1) * 0.6 + 20; return `M ${x1} ${y1} C ${x1 + cpDist} ${y1}, ${x2 - cpDist} ${y2}, ${x2} ${y2}`; }

  /* --- Rendering --- */
  function renderWires() {
    let svgHTML = '';
    connections.forEach(conn => {
      const from = getPortCoords(conn.fromNode, conn.fromPort); const to = getPortCoords(conn.toNode, conn.toPort);
      svgHTML += `<path class="pb-wire active ${conn.id === selectedWireId ? 'selected' : ''}" d="${drawBezier(from.x, from.y, to.x, to.y)}" data-conn-id="${conn.id}" />`;
    });
    if (wiringStart && tempWirePath) svgHTML += `<path class="pb-wire pb-wire-temp" d="${drawBezier(wiringStart.x, wiringStart.y, tempWirePath.x, tempWirePath.y)}" />`;
    wireLayer.innerHTML = svgHTML;
  }
  function updateNodePositions() { Object.values(nodes).forEach(n => { if (n.el) { n.el.style.left = `${n.x}px`; n.el.style.top = `${n.y}px`; } }); renderWires(); }
  function clearSelection() { selectedWireId = null; selectedNodeId = null; document.querySelectorAll('.pb-node.selected').forEach(el => el.classList.remove('selected')); renderWires(); }

  /* --- Node Logic --- */
  function createNodeElement(node) {
    const el = document.createElement('div'); el.className = `pb-node`; el.dataset.id = node.id;
    el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
    el.style.width = `${PC_PARTS[node.type].w}px`; el.style.height = `${PC_PARTS[node.type].h}px`; el.style.zIndex = PC_PARTS[node.type].z;
    let innerHTML = `<svg class="pb-part-svg" viewBox="0 0 ${PC_PARTS[node.type].w} ${PC_PARTS[node.type].h}">${PC_PARTS[node.type].svg}</svg>`;
    PC_PARTS[node.type].ports.forEach(p => { innerHTML += `<div class="pb-port" data-port="${p.id}" style="left: ${p.x}px; top: ${p.y}px;"></div>`; });
    el.innerHTML = innerHTML; viewport.appendChild(el); node.el = el; return el;
  }

  function spawnNode(type, dropX = null, dropY = null) {
    const id = `node_${nextNodeId++}`;
    const x = dropX !== null ? dropX : 300 + Math.random()*40; const y = dropY !== null ? dropY : 150 + Math.random()*40;
    const node = { id, type, x, y, snappedTo: null, el: null };
    if (PC_PARTS[type].slots) { node.slots = { ...PC_PARTS[type].slots }; for(let k in node.slots) { node.slots[k] = null; } }
    nodes[id] = node; createNodeElement(node); evaluateBuild(); return id;
  }

  function moveNodeRecursive(nodeId, dx, dy) {
    const n = nodes[nodeId]; if(!n) return; n.x += dx; n.y += dy;
    if(n.slots) { Object.keys(n.slots).forEach(k => { if(typeof n.slots[k] === 'string') moveNodeRecursive(n.slots[k], dx, dy); }); }
  }

  /* --- SYSTEM DIAGNOSTICS & VARIABLE BOOT SPEED --- */
  function evaluateBuild() {
    if(!specsContainer) return;
    let hasCase=false, hasMB=false, hasCPU=false, hasCooler=false, hasRAM=false, hasPSU=false, hasStorage=false, hasGPU=false;
    let mbPwr=false, gpuPwr=false, storPwr=false, storData=false, dispConn=false, usbCount=0;

    let caseNode = Object.values(nodes).find(n => n.type === 'CASE');
    let mbNode = Object.values(nodes).find(n => n.type === 'MB');
    
    if (caseNode) {
      hasCase = true;
      if (caseNode.slots['MB1']) hasMB = true;
      if (caseNode.slots['PSU1']) hasPSU = true;
      if (caseNode.slots['HDD1'] || caseNode.slots['HDD2'] || caseNode.slots['SATA_SSD1'] || caseNode.slots['SATA_SSD2']) hasStorage = true;
    } else if (mbNode) { hasMB = true; }

    if (mbNode) {
      if (mbNode.slots['CPU1']) hasCPU = true;
      if (mbNode.slots['COOLER1']) hasCooler = true;
      if (mbNode.slots['RAM1'] || mbNode.slots['RAM2'] || mbNode.slots['RAM3'] || mbNode.slots['RAM4']) hasRAM = true;
      if (mbNode.slots['PCIE1'] || mbNode.slots['PCIE2']) hasGPU = true;
      if (mbNode.slots['M2_1'] || mbNode.slots['M2_2']) { hasStorage = true; storPwr = true; storData = true; }
    }

    connections.forEach(c => {
      let n1 = nodes[c.fromNode], n2 = nodes[c.toNode]; if(!n1 || !n2) return;
      let types = [n1.type, n2.type], ports = [c.fromPort, c.toPort];
      
      if(types.includes('MB') && types.includes('PSU')) mbPwr = true;
      if(types.includes('GPU') && types.includes('PSU')) gpuPwr = true;
      if(types.includes('PSU') && (types.includes('HDD') || types.includes('SATA_SSD')) && ports.includes('pwr')) storPwr = true;
      if(types.includes('MB') && (types.includes('HDD') || types.includes('SATA_SSD')) && ports.includes('data')) storData = true;
      if(types.includes('MB') && ['KEYBOARD','MOUSE'].some(t => types.includes(t))) usbCount++;
      if((types.includes('MB') || types.includes('GPU')) && types.includes('MONITOR')) dispConn = true;
    });

    const isBootable = (hasMB && hasCPU && hasCooler && hasRAM && hasPSU && hasStorage && mbPwr && (hasGPU ? gpuPwr : true) && dispConn);
    
    // Determine the Boot Speed based on the connected drive
    let bootSpeed = 8000; // Default slow HDD
    let activeDrive = 'HDD';
    if (mbNode && (mbNode.slots['M2_1'] || mbNode.slots['M2_2'])) {
        activeDrive = 'M2_SSD';
    } else {
        Object.values(nodes).forEach(n => {
            if ((n.type === 'SATA_SSD' || n.type === 'HDD') && n.snappedTo) activeDrive = n.type;
        });
    }
    
    if (activeDrive === 'M2_SSD') bootSpeed = 1500;
    else if (activeDrive === 'SATA_SSD') bootSpeed = 3500;

    // Auto-Trigger the Boot Animation
    if (isBootable && !isSystemBooted) { isSystemBooted = true; triggerBootSequence(bootSpeed); } 
    else if (!isBootable) { isSystemBooted = false; resetMonitor(); }

    specsContainer.innerHTML = `
      <div class="diag-cat">CORE SYSTEM</div>
      <div class="diag-row"><span>CHASSIS</span><span style="color: ${hasCase ? '#28f07a' : '#ff5555'}">${hasCase ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>MOTHERBOARD</span><span style="color: ${hasMB ? '#28f07a' : '#ff5555'}">${hasMB ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>CPU</span><span style="color: ${hasCPU ? '#28f07a' : '#ff5555'}">${hasCPU ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>COOLING</span><span style="color: ${hasCooler ? '#28f07a' : '#ff5555'}">${hasCooler ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>MEMORY</span><span style="color: ${hasRAM ? '#28f07a' : '#ff5555'}">${hasRAM ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>POWER SPLY</span><span style="color: ${hasPSU ? '#28f07a' : '#ff5555'}">${hasPSU ? 'OK' : 'ERR'}</span></div>
      <div class="diag-cat">CONNECTIONS</div>
      <div class="diag-row"><span>MB POWER</span><span style="color: ${mbPwr ? '#28f07a' : '#ff5555'}">${mbPwr ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>STORAGE</span><span style="color: ${(hasStorage && storPwr && storData) ? '#28f07a' : '#ff5555'}">${(hasStorage && storPwr && storData) ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>GPU POWER</span><span style="color: ${!hasGPU ? '#888' : (gpuPwr ? '#28f07a' : '#ff5555')}">${!hasGPU ? 'N/A' : (gpuPwr ? 'OK' : 'ERR')}</span></div>
      <div class="diag-row"><span>DISPLAY</span><span style="color: ${dispConn ? '#28f07a' : '#ff5555'}">${dispConn ? 'OK' : 'ERR'}</span></div>
      <div class="diag-row"><span>USB DEVS</span><span style="color: #55aaff">${usbCount}</span></div>
      <hr style="border-color: rgba(255,255,255,0.1); margin: 12px 0 8px 0;">
      <div style="text-align:center; font-size: 28px; color: ${isBootable ? '#28f07a' : '#ff5555'}; font-family: var(--bit-font); letter-spacing: 2px;">${isBootable ? 'BOOTING...' : 'HALTED'}</div>
    `;
  }

  function triggerBootSequence(duration) {
    const monitor = Object.values(nodes).find(n => n.type === 'MONITOR'); if (!monitor) return;
    const bootContent = monitor.el.querySelector('#boot-content');
    const durSeconds = (duration / 1000).toFixed(1);
    
    bootContent.innerHTML = `<text x="120" y="70" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">Starting Windows</text><rect x="85" y="85" width="0" height="4" fill="#28f07a" rx="2"><animate attributeName="width" from="0" to="70" dur="${durSeconds}s" fill="freeze" /></rect>`;
    
    setTimeout(() => { 
        bootContent.innerHTML = `<image href="/Microsoft_Nostalgic_Windows_Wallpaper_4k.jpg" x="10" y="10" width="220" height="120" preserveAspectRatio="xMidYMid slice" />`; 
    }, duration + 300); // Small buffer to let the bar finish
  }

  function resetMonitor() { const monitor = Object.values(nodes).find(n => n.type === 'MONITOR'); if (monitor) monitor.el.querySelector('#boot-content').innerHTML = ''; }


  /* --- INTERACTION (Drag, Drop, Snap, Wire) --- */
  document.getElementById("btnZoomIn")?.addEventListener('click', () => { const r = workspace.getBoundingClientRect(); zoomWorkspace(1.2, r.width/2, r.height/2); });
  document.getElementById("btnZoomOut")?.addEventListener('click', () => { const r = workspace.getBoundingClientRect(); zoomWorkspace(1/1.2, r.width/2, r.height/2); });
  document.getElementById("btnZoomReset")?.addEventListener('click', () => { panX = 0; panY = 0; zoom = 1; updateViewport(); });
  workspace.addEventListener('wheel', (e) => { e.preventDefault(); const wsRect = workspace.getBoundingClientRect(); zoomWorkspace(e.deltaY < 0 ? 1.1 : (1/1.1), e.clientX - wsRect.left, e.clientY - wsRect.top); });
  
  workspace.addEventListener('mousedown', (e) => {
    const port = e.target.closest('.pb-port');
    if (port) {
      const nodeEl = port.closest('.pb-node'); const portId = port.dataset.port;
      const existingIdx = connections.findIndex(c => (c.toNode === nodeEl.dataset.id && c.toPort === portId) || (c.fromNode === nodeEl.dataset.id && c.fromPort === portId));
      if (existingIdx !== -1) { connections.splice(existingIdx, 1); evaluateBuild(); renderWires(); return; }
      const coords = getPortCoords(nodeEl.dataset.id, portId);
      wiringStart = { node: nodeEl.dataset.id, port: portId, x: coords.x, y: coords.y };
      tempWirePath = { x: coords.x, y: coords.y }; return;
    }

    const wire = e.target.closest('.pb-wire');
    if (wire && wire.dataset.connId) { clearSelection(); selectedWireId = wire.dataset.connId; renderWires(); e.stopPropagation(); return; }

    const nodeEl = e.target.closest('.pb-node');
    if (nodeEl) {
      clearSelection(); selectedNodeId = nodeEl.dataset.id; nodeEl.classList.add('selected'); isDraggingNode = nodeEl.dataset.id;
      const rect = nodeEl.getBoundingClientRect(); dragOffset = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };

      const node = nodes[isDraggingNode];
      if (node.snappedTo) {
        const parent = nodes[node.snappedTo.id];
        if (parent && parent.slots[node.snappedTo.key] === node.id) parent.slots[node.snappedTo.key] = null; 
        node.snappedTo = null; node.el.style.zIndex = PC_PARTS[node.type].z; evaluateBuild();
      }
      return;
    }
    clearSelection(); isPanning = true; panStart = { x: e.clientX - panX, y: e.clientY - panY };
  });

  window.addEventListener('mousemove', (e) => {
    const wsRect = workspace.getBoundingClientRect();
    if (isPanning) { panX = e.clientX - panStart.x; panY = e.clientY - panStart.y; updateViewport(); return; }
    if (isDraggingNode) {
      const node = nodes[isDraggingNode];
      let newX = (e.clientX - wsRect.left - panX) / zoom - dragOffset.x; let newY = (e.clientY - wsRect.top - panY) / zoom - dragOffset.y;
      moveNodeRecursive(node.id, newX - node.x, newY - node.y); updateNodePositions();
    }
    if (wiringStart) { tempWirePath = { x: (e.clientX - wsRect.left - panX) / zoom, y: (e.clientY - wsRect.top - panY) / zoom }; renderWires(); }
  });

  window.addEventListener('mouseup', (e) => {
    if (isDraggingNode) {
      const node = nodes[isDraggingNode]; let snapped = false;

      Object.values(nodes).forEach(target => {
        if (target.slots && !snapped && target.id !== node.id) {
           for(let slotKey in target.slots) {
              let slotDef = PC_PARTS[target.type].slots[slotKey];
              if(slotDef.accepts === node.type && target.slots[slotKey] === null) {
                  let tX = target.x + slotDef.x; let tY = target.y + slotDef.y;
                  if (Math.hypot(node.x - tX, node.y - tY) < 80) { 
                      moveNodeRecursive(node.id, tX - node.x, tY - node.y);
                      node.snappedTo = { id: target.id, key: slotKey };
                      target.slots[slotKey] = node.id;
                      node.el.style.zIndex = PC_PARTS[target.type].z + 5;
                      snapped = true; break;
                  }
              }
           }
        }
      });
      isDraggingNode = null; updateNodePositions(); evaluateBuild(); 
    }
    
    if (wiringStart) {
      const port = e.target.closest('.pb-port');
      if (port) {
        const targetNodeId = port.closest('.pb-node').dataset.id; const targetPortId = port.dataset.port;
        if (targetNodeId !== wiringStart.node) { connections.push({ id: `conn_${nextWireId++}`, fromNode: wiringStart.node, fromPort: wiringStart.port, toNode: targetNodeId, toPort: targetPortId }); }
      }
      wiringStart = null; tempWirePath = null; evaluateBuild(); renderWires();
    }
    isPanning = false;
  });


  /* --- Deletion & Toolbox UI --- */
  function deleteNodeRecursive(id) {
      const n = nodes[id]; if(!n) return;
      if(n.slots) { Object.keys(n.slots).forEach(k => { if(typeof n.slots[k] === 'string') deleteNodeRecursive(n.slots[k]); }); }
      if(n.snappedTo) { const p = nodes[n.snappedTo.id]; if(p) p.slots[n.snappedTo.key] = null; }
      connections = connections.filter(c => c.fromNode !== id && c.toNode !== id);
      viewport.removeChild(n.el); delete nodes[id];
  }

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) { deleteNodeRecursive(selectedNodeId); clearSelection(); evaluateBuild(); renderWires(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWireId) { connections = connections.filter(c => c.id !== selectedWireId); clearSelection(); evaluateBuild(); renderWires(); }
  });

  workspace.addEventListener('dragover', (e) => { e.preventDefault(); });
  workspace.addEventListener('drop', (e) => {
    e.preventDefault(); const type = e.dataTransfer.getData('spawnType');
    if (type) { const r = workspace.getBoundingClientRect(); spawnNode(type, (e.clientX - r.left - panX) / zoom - (PC_PARTS[type].w / 2), (e.clientY - r.top - panY) / zoom - (PC_PARTS[type].h / 2)); }
  });

  btnClearBoard?.addEventListener('click', () => { viewport.querySelectorAll('.pb-node').forEach(el => el.remove()); nodes = {}; connections = []; evaluateBuild(); renderWires(); });

  toolboxToggle?.addEventListener("click", () => {
    const c = pcPage?.classList.contains("toolboxCollapsed");
    pcPage.classList.toggle("toolboxCollapsed", !c);
    toolboxToggle?.setAttribute("aria-expanded", c ? "true" : "false");
  });

  /* --- Auto-Assemble Engine --- */
  function autoAssemble(sT) {
    btnClearBoard.click(); 
    const mId = spawnNode('MONITOR', 200, 100), kId = spawnNode('KEYBOARD', 230, 320), moId = spawnNode('MOUSE', 450, 330), spId = spawnNode('SPEAKER', 150, 300);
    const cId = spawnNode('CASE', 550, 100), mbId = spawnNode('MB', 1250, 250), pId = spawnNode('PSU', 1250, 100), cpId = spawnNode('CPU', 1450, 100), coId = spawnNode('COOLER', 1450, 250), rId = spawnNode('RAM', 1600, 100), gId = spawnNode('GPU', 1450, 400), stId = spawnNode(sT, 1600, 250);
    
    const plan = [{c:mbId,p:cId,s:'MB1'},{c:pId,p:cId,s:'PSU1'},{c:cpId,p:mbId,s:'CPU1'},{c:coId,p:mbId,s:'COOLER1'},{c:rId,p:mbId,s:'RAM1'},{c:gId,p:mbId,s:'PCIE1'}];
    if(sT==='HDD') plan.push({c:stId,p:cId,s:'HDD1'}); if(sT==='SATA_SSD') plan.push({c:stId,p:cId,s:'SATA_SSD1'}); if(sT==='M2_SSD') plan.push({c:stId,p:mbId,s:'M2_1'});
    
    plan.forEach(s => { const ch = nodes[s.c], p = nodes[s.p]; const sD = PC_PARTS[p.type].slots[s.s]; moveNodeRecursive(ch.id, (p.x + sD.x) - ch.x, (p.y + sD.y) - ch.y); ch.snappedTo = { id: p.id, key: s.s }; p.slots[s.s] = ch.id; ch.el.style.zIndex = PC_PARTS[p.type].z + 5; });
    
    const conn = (n1, p1, n2, p2) => connections.push({ id: `conn_${nextWireId++}`, fromNode: n1, fromPort: p1, toNode: n2, toPort: p2 });
    conn(pId, 'out1', mbId, 'atx_pwr'); conn(pId, 'out2', gId, 'pwr_in'); 
    if (sT !== 'M2_SSD') { conn(pId, 'out3', stId, 'pwr'); conn(mbId, 'sata1', stId, 'data'); } 
    conn(gId, 'disp_out', mId, 'disp'); conn(mbId, 'usb1', kId, 'usb'); conn(mbId, 'usb2', moId, 'usb'); conn(mbId, 'audio', spId, 'audio'); 
    
    updateNodePositions(); 
    evaluateBuild(); 
  }

  document.getElementById('btnAssembleHDD')?.addEventListener('click', () => autoAssemble('HDD'));
  document.getElementById('btnAssembleSATA')?.addEventListener('click', () => autoAssemble('SATA_SSD'));
  document.getElementById('btnAssembleM2')?.addEventListener('click', () => autoAssemble('M2_SSD'));

  initToolbox(); evaluateBuild();
})();