// src/scripts/pcBuilder.js
// Computing:Box — Advanced PC Sandbox

(() => {
  const workspace = document.getElementById("workspace");
  const viewport = document.getElementById("viewport");
  const internalLayer = document.getElementById("wireLayerInternal");
  const externalLayer = document.getElementById("wireLayerExternal");
  const specsContainer = document.getElementById("buildSpecsContainer");
  const toolboxGrid = document.getElementById("toolboxGrid");
  const btnClearBoard = document.getElementById("btnClearBoard");
  const toolboxToggle = document.getElementById("toolboxToggle");
  const pcPage = document.getElementById("pcPage");

  // Parts defined as "Outside the Chassis"
  const EXTERNAL_TYPES = ['MONITOR', 'KEYBOARD', 'MOUSE', 'WEBCAM', 'SPEAKER', 'MIC', 'PRINTER'];

  /* --- Extensive PC Component Library --- */
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
        { id: 'usb1', x: 10, y: 40 }, { id: 'usb2', x: 10, y: 70 }, { id: 'usb3', x: 10, y: 100 }, { id: 'usb4', x: 10, y: 130 },
        { id: 'audio', x: 10, y: 170 }, { id: 'disp', x: 10, y: 210 }
      ],
      slots: {
        'CPU1': { x: 120, y: 40, accepts: 'CPU' },
        'COOLER1': { x: 100, y: 20, accepts: 'COOLER' }, 
        'RAM1': { x: 230, y: 30, accepts: 'RAM' }, 'RAM2': { x: 250, y: 30, accepts: 'RAM' }, 
        'RAM3': { x: 270, y: 30, accepts: 'RAM' }, 'RAM4': { x: 290, y: 30, accepts: 'RAM' },
        'M2_1': { x: 120, y: 170, accepts: 'M2_SSD' }, 'M2_2': { x: 120, y: 250, accepts: 'M2_SSD' },
        'PCIE1': { x: 40, y: 200, accepts: 'GPU' }, 'PCIE2': { x: 40, y: 300, accepts: 'GPU' }
      },
      // Uses a lighter slate grey #2C303A to stand out from the case
      svg: `<rect width="360" height="400" fill="#2C303A" rx="8" stroke="#4b5060" stroke-width="3"/><rect x="120" y="40" width="80" height="80" fill="#1f2229" stroke="#4b5060"/><rect x="230" y="30" width="15" height="100" fill="#1f2229"/><rect x="250" y="30" width="15" height="100" fill="#1f2229"/><rect x="270" y="30" width="15" height="100" fill="#1f2229"/><rect x="290" y="30" width="15" height="100" fill="#1f2229"/><rect x="40" y="200" width="280" height="15" fill="#15171c"/><rect x="40" y="300" width="280" height="15" fill="#15171c"/><rect x="120" y="170" width="80" height="15" fill="#1f2229"/><rect x="120" y="250" width="80" height="15" fill="#1f2229"/>`
    },
    'CPU': { name: 'Processor', w: 80, h: 80, z: 20, ports: [], slots: {}, svg: `<rect width="80" height="80" fill="#0b381a"/><rect x="10" y="10" width="60" height="60" rx="4" fill="#d4d4d4"/><polygon points="5,75 15,75 5,65" fill="#ffd700"/><text x="40" y="45" fill="#555" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">CPU</text>` },
    'COOLER': { name: 'CPU Fan', w: 120, h: 120, z: 30, ports: [], slots: {}, svg: `<rect width="120" height="120" rx="60" fill="#1a1c23" stroke="#aaa" stroke-width="3"/><circle cx="60" cy="60" r="50" fill="#111"/><path d="M60,15 A45,45 0 0,1 105,60 L60,60 Z" fill="#444"/><path d="M105,60 A45,45 0 0,1 60,105 L60,60 Z" fill="#555"/><path d="M60,105 A45,45 0 0,1 15,60 L60,60 Z" fill="#444"/><path d="M15,60 A45,45 0 0,1 60,15 L60,60 Z" fill="#555"/><circle cx="60" cy="60" r="20" fill="#222"/>` },
    'RAM': { name: 'DDR4 Memory', w: 15, h: 100, z: 20, ports: [], slots: {}, svg: `<rect width="15" height="100" fill="#111"/><rect x="2" y="5" width="11" height="80" fill="#2a2a2a"/><rect x="0" y="90" width="15" height="10" fill="#ffd700"/>` },
    'GPU': { name: 'Graphics Card', w: 280, h: 60, z: 40, slots: {}, ports: [{ id: 'pwr_in', x: 270, y: 10 }, { id: 'disp_out', x: 10, y: 30 }], svg: `<rect width="280" height="60" rx="5" fill="#1a1a1a"/><circle cx="70" cy="30" r="22" fill="#111" stroke="#333" stroke-width="2"/><circle cx="140" cy="30" r="22" fill="#111" stroke="#333" stroke-width="2"/><circle cx="210" cy="30" r="22" fill="#111" stroke="#333" stroke-width="2"/><rect x="20" y="55" width="80" height="5" fill="#ffd700"/>` },
    'M2_SSD': { name: 'M.2 NVMe SSD', w: 80, h: 15, z: 20, ports: [], slots: {}, svg: `<rect width="80" height="15" rx="1" fill="#000"/><rect x="10" y="2" width="20" height="11" fill="#1a1a1a"/><rect x="35" y="2" width="20" height="11" fill="#1a1a1a"/><rect x="60" y="2" width="10" height="11" fill="#ccc"/><rect x="0" y="0" width="4" height="15" fill="#ffd700"/>` },
    'SATA_SSD': { name: '2.5" SATA SSD', w: 100, h: 70, z: 20, slots: {}, ports: [{id:'data', x:90, y:20}, {id:'pwr', x:90, y:50}], svg: `<rect width="100" height="70" fill="#111" rx="4" stroke="#444"/><rect x="10" y="10" width="80" height="50" fill="#1a1a1a" rx="2" stroke="#222"/><text x="50" y="40" fill="#888" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">SSD</text>` },
    'HDD': { name: '3.5" Mech HDD', w: 120, h: 140, z: 20, slots: {}, ports: [{id:'data', x:110, y:20}, {id:'pwr', x:110, y:120}], svg: `<rect width="120" height="140" fill="#d0d0d0" rx="4" stroke="#888"/><rect x="10" y="10" width="100" height="100" fill="#e0e0e0" rx="50"/><circle cx="60" cy="60" r="35" fill="#ddd" stroke="#aaa"/><circle cx="60" cy="60" r="10" fill="#999"/><rect x="30" y="120" width="60" height="10" fill="#111"/>` },
    'PSU': { name: 'Power Supply', w: 160, h: 90, z: 20, slots: {}, ports: [{id:'out1',x:150,y:20}, {id:'out2',x:150,y:40}, {id:'out3',x:150,y:60}, {id:'out4',x:150,y:80}], svg: `<rect width="160" height="90" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="2"/><circle cx="80" cy="45" r="35" fill="#0a0a0a" stroke="#222" stroke-width="2"/><line x1="80" y1="10" x2="80" y2="80" stroke="#333" stroke-width="2"/><line x1="45" y1="45" x2="115" y2="45" stroke="#333" stroke-width="2"/><circle cx="80" cy="45" r="10" fill="#222"/>` },
    'MONITOR': { name: 'Monitor', w: 240, h: 160, z: 30, slots: {}, ports: [{id:'disp', x:120, y:140}], svg: `<rect width="240" height="160" fill="#111" rx="5"/><rect x="10" y="10" width="220" height="120" fill="#000"/><rect x="100" y="140" width="40" height="20" fill="#222"/><rect x="60" y="150" width="120" height="10" fill="#222"/>` },
    'KEYBOARD': { name: 'Keyboard', w: 180, h: 60, z: 30, slots: {}, ports: [{id:'usb', x:90, y:10}], svg: `<rect width="180" height="60" fill="#111" rx="3"/><rect x="5" y="5" width="170" height="50" fill="#222" rx="2" stroke="#333" stroke-dasharray="8 8"/>` },
    'MOUSE': { name: 'Mouse', w: 30, h: 50, z: 30, slots: {}, ports: [{id:'usb', x:15, y:5}], svg: `<rect width="30" height="50" fill="#111" rx="15"/><line x1="15" y1="0" x2="15" y2="20" stroke="#333" stroke-width="2"/><circle cx="15" cy="15" r="4" fill="#333"/>` },
    'SPEAKER': { name: 'Speakers', w: 40, h: 80, z: 30, slots: {}, ports: [{id:'audio', x:20, y:10}], svg: `<rect width="40" height="80" fill="#111" rx="4"/><circle cx="20" cy="25" r="12" fill="#222"/><circle cx="20" cy="60" r="16" fill="#222"/>` }
  };

  let nodes = {}; 
  let connections = []; 
  let nextNodeId = 1, nextWireId = 1;

  let isDraggingNode = null, dragOffset = { x: 0, y: 0 };
  let wiringStart = null, tempWirePath = null;
  let selectedWireId = null, selectedNodeId = null;

  let panX = 0, panY = 0, zoom = 1;
  let isPanning = false, panStart = { x: 0, y: 0 };

  /* --- Setup Toolbox --- */
  function initToolbox() {
    if(!toolboxGrid) return;
    let html = '';
    Object.keys(PC_PARTS).forEach(partKey => {
      html += `
        <div draggable="true" data-spawn="${partKey}" class="drag-item tb-icon-box" title="${PC_PARTS[partKey].name}">
           <svg viewBox="0 0 ${PC_PARTS[partKey].w} ${PC_PARTS[partKey].h}" style="max-width:80%; max-height:40px; pointer-events:none;">${PC_PARTS[partKey].svg}</svg>
           <div class="tb-icon-label">${partKey}</div>
        </div>
      `;
    });
    toolboxGrid.innerHTML = html;
    document.querySelectorAll('.drag-item').forEach(item => {
      item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('spawnType', item.dataset.spawn); });
    });
  }

  /* --- Camera Math --- */
  function updateViewport() {
    viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    workspace.style.backgroundSize = `${32 * zoom}px ${32 * zoom}px`;
    workspace.style.backgroundPosition = `${panX}px ${panY}px`;
  }
  function zoomWorkspace(factor, mouseX, mouseY) {
    const newZoom = Math.min(Math.max(0.1, zoom * factor), 2);
    panX = mouseX - (mouseX - panX) * (newZoom / zoom);
    panY = mouseY - (mouseY - panY) * (newZoom / zoom);
    zoom = newZoom; updateViewport();
  }
  function getPortCoords(nodeId, portId) {
    const n = nodes[nodeId];
    const pEl = n.el.querySelector(`[data-port="${portId}"]`);
    const r = pEl.getBoundingClientRect(), w = workspace.getBoundingClientRect();
    return { x: (r.left - w.left - panX) / zoom, y: (r.top - w.top - panY) / zoom };
  }
  function drawBezier(x1, y1, x2, y2) {
    const cpDist = Math.abs(x2 - x1) * 0.6 + 20; 
    return `M ${x1} ${y1} C ${x1 + cpDist} ${y1}, ${x2 - cpDist} ${y2}, ${x2} ${y2}`;
  }

  /* --- Rendering --- */
  function renderWires() {
    let intHtml = '', extHtml = '';
    connections.forEach(c => {
      const fromNode = nodes[c.fN];
      const toNode = nodes[c.tN];
      if (!fromNode || !toNode) return;

      const p1 = getPortCoords(c.fN, c.fP);
      const p2 = getPortCoords(c.tN, c.tP);
      const path = `<path class="pb-wire active" d="M ${p1.x} ${p1.y} C ${p1.x+60} ${p1.y}, ${p2.x-60} ${p2.y}, ${p2.x} ${p2.y}" />`;
      
      // Determine if cable is Internal (under panel) or External (on top)
      (EXTERNAL_TYPES.includes(fromNode.type) || EXTERNAL_TYPES.includes(toNode.type)) ? extHtml += path : intHtml += path;
    });
    internalLayer.innerHTML = intHtml; 
    externalLayer.innerHTML = extHtml;
    evaluateBuild();
  }

  function updateNodePositions() {
    Object.values(nodes).forEach(n => {
      if (n.el) { n.el.style.left = `${n.x}px`; n.el.style.top = `${n.y}px`; }
    });
    renderWires();
  }

  function clearSelection() {
    selectedWireId = null; selectedNodeId = null;
    document.querySelectorAll('.pb-node.selected').forEach(el => el.classList.remove('selected'));
    renderWires();
  }

  /* --- Seven-Segment Diagnostics Engine --- */
  function evaluateBuild() {
    const hasMB = Object.values(nodes).some(n => n.type === 'MB' && n.snappedTo);
    const hasCPU = Object.values(nodes).some(n => n.type === 'CPU' && n.snappedTo);
    const boot = hasMB && hasCPU && connections.some(c => nodes[c.fN].type === 'MONITOR' || nodes[c.tN].type === 'MONITOR');
    workspace.classList.toggle('system-running', boot);
  }

  /* --- Node Creation & Snapping --- */
  function createNodeElement(node) {
    const el = document.createElement('div');
    el.className = `pb-node`; el.dataset.id = node.id;
    el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
    el.style.width = `${PC_PARTS[node.type].w}px`; el.style.height = `${PC_PARTS[node.type].h}px`;
    el.style.zIndex = PC_PARTS[node.type].z;

    let innerHTML = `<svg class="pb-part-svg" viewBox="0 0 ${PC_PARTS[node.type].w} ${PC_PARTS[node.type].h}">${PC_PARTS[node.type].svg}</svg>`;
    PC_PARTS[node.type].ports.forEach(p => {
      innerHTML += `<div class="pb-port" data-port="${p.id}" style="left: ${p.x}px; top: ${p.y}px;"></div>`;
    });
    
    // Debug Labels for bare parts
    if(node.type !== 'CASE' && node.type !== 'MB') {
       innerHTML += `<div style="position:absolute; top:-20px; font-family:var(--ui-font); font-size:12px; color:var(--muted);">${node.type}</div>`;
    }

    el.innerHTML = innerHTML;
    viewport.appendChild(el);
    node.el = el;
    return el;
  }

  function spawnNode(type, dropX = null, dropY = null) {
    const id = `node_${nextNodeId++}`;
    const x = dropX !== null ? dropX : 300 + Math.random()*40;
    const y = dropY !== null ? dropY : 150 + Math.random()*40;

    const node = { id, type, x, y, snappedTo: null, el: null };
    if (PC_PARTS[type].slots) node.slots = { ...PC_PARTS[type].slots }; // Copy slots schema, values will be filled with IDs
    
    // Reset slot values to null
    if(node.slots) {
       for(let k in node.slots) { node.slots[k] = null; }
    }

    nodes[id] = node;
    createNodeElement(node);
    evaluateBuild();
  }

/* --- Movement & Snap Logic (Restored from your Verified Working Script) --- */
  function moveNodeRecursive(nodeId, dx, dy) {
    const n = nodes[nodeId]; if(!n) return;
    n.x += dx; n.y += dy;
    if(n.slots) { Object.keys(n.slots).forEach(k => { if(typeof n.slots[k] === 'string') moveNodeRecursive(n.slots[k], dx, dy); }); }
    if(n.el) { n.el.style.left = n.x + 'px'; n.el.style.top = n.y + 'px'; }
  }

  /* --- Inspect Mode --- */
  let inspectZoom = 1, inspectRotX = 0, inspectRotY = 0;
  workspace.addEventListener('dblclick', (e) => {
    const nodeEl = e.target.closest('.pb-node');
    if (nodeEl) {
      const node = nodes[nodeEl.dataset.id];
      document.getElementById('inspectModal').classList.add('active');
      document.getElementById('inspectObject').innerHTML = `<svg viewBox="0 0 ${PC_PARTS[node.type].w} ${PC_PARTS[node.type].h}" style="width:100%; height:100%;">${PC_PARTS[node.type].svg}</svg>`;
      document.getElementById('inspectName').innerText = PC_PARTS[node.type].name;
      inspectZoom = 1.5; inspectRotX = 0; inspectRotY = 0; updateInspectTransform(); clearSelection();
    }
  });
  document.getElementById('inspectStage')?.addEventListener('mousemove', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    inspectRotY = (e.clientX - rect.left - rect.width/2) / 5;
    inspectRotX = -(e.clientY - rect.top - rect.height/2) / 5;
    updateInspectTransform();
  });
  document.getElementById('inspectStage')?.addEventListener('wheel', (e) => {
    e.preventDefault(); inspectZoom += e.deltaY < 0 ? 0.1 : -0.1;
    inspectZoom = Math.max(0.5, Math.min(inspectZoom, 4)); updateInspectTransform();
  });
  function updateInspectTransform() { const obj = document.getElementById('inspectObject'); if(obj) obj.style.transform = `scale(${inspectZoom}) rotateX(${inspectRotX}deg) rotateY(${inspectRotY}deg)`; }
  document.getElementById('inspectClose')?.addEventListener('click', () => { document.getElementById('inspectModal').classList.remove('active'); });

  /* --- Interaction --- */
  document.getElementById("btnZoomIn")?.addEventListener('click', () => { const r = workspace.getBoundingClientRect(); zoomWorkspace(1.2, r.width/2, r.height/2); });
  document.getElementById("btnZoomOut")?.addEventListener('click', () => { const r = workspace.getBoundingClientRect(); zoomWorkspace(1/1.2, r.width/2, r.height/2); });
  document.getElementById("btnZoomReset")?.addEventListener('click', () => { panX = 0; panY = 0; zoom = 1; updateViewport(); });

  workspace.addEventListener('wheel', (e) => { e.preventDefault(); const wsRect = workspace.getBoundingClientRect(); zoomWorkspace(e.deltaY < 0 ? 1.1 : (1/1.1), e.clientX - wsRect.left, e.clientY - wsRect.top); });
  
  workspace.addEventListener('mousedown', (e) => {
    const port = e.target.closest('.pb-port');
    if (port) {
      const nodeEl = port.closest('.pb-node');
      const portId = port.dataset.port;
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

      // Unsnap from parent when picked up
      const node = nodes[isDraggingNode];
      if (node.snappedTo) {
        const parent = nodes[node.snappedTo.id];
        if (parent && parent.slots[node.snappedTo.key] === node.id) parent.slots[node.snappedTo.key] = null; 
        node.snappedTo = null;
        node.el.style.zIndex = PC_PARTS[node.type].z; // Reset Z
        evaluateBuild();
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
      let newX = (e.clientX - wsRect.left - panX) / zoom - dragOffset.x;
      let newY = (e.clientY - wsRect.top - panY) / zoom - dragOffset.y;
      moveNodeRecursive(node.id, newX - node.x, newY - node.y);
      updateNodePositions();
    }
    if (wiringStart) { tempWirePath = { x: (e.clientX - wsRect.left - panX) / zoom, y: (e.clientY - wsRect.top - panY) / zoom }; renderWires(); }
  });

  window.addEventListener('mouseup', (e) => {
    if (isDraggingNode) {
      const node = nodes[isDraggingNode];
      let snapped = false;

      // Check all other nodes for compatible slots
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
                      node.el.style.zIndex = PC_PARTS[target.type].z + 5; // Layer above parent
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
        const targetNodeId = port.closest('.pb-node').dataset.id;
        const targetPortId = port.dataset.port;
        if (targetNodeId !== wiringStart.node) { connections.push({ id: `conn_${nextWireId++}`, fromNode: wiringStart.node, fromPort: wiringStart.port, toNode: targetNodeId, toPort: targetPortId }); }
      }
      wiringStart = null; tempWirePath = null; evaluateBuild(); renderWires();
    }
    isPanning = false;
  });

  /* --- Deletion (Recursive) --- */
  function deleteNodeRecursive(id) {
      const n = nodes[id]; if(!n) return;
      if(n.slots) { Object.keys(n.slots).forEach(k => { if(typeof n.slots[k] === 'string') deleteNodeRecursive(n.slots[k]); }); }
      if(n.snappedTo) { const p = nodes[n.snappedTo.id]; if(p) p.slots[n.snappedTo.key] = null; }
      connections = connections.filter(c => c.fromNode !== id && c.toNode !== id);
      viewport.removeChild(n.el); delete nodes[id];
  }

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
      deleteNodeRecursive(selectedNodeId); clearSelection(); evaluateBuild(); renderWires();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWireId) {
      connections = connections.filter(c => c.id !== selectedWireId); clearSelection(); evaluateBuild(); renderWires();
    }
  });

  workspace.addEventListener('dragover', (e) => { e.preventDefault(); });
  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('spawnType');
    if (type) {
      const r = workspace.getBoundingClientRect();
      spawnNode(type, (e.clientX - r.left - panX) / zoom - (PC_PARTS[type].w / 2), (e.clientY - r.top - panY) / zoom - (PC_PARTS[type].h / 2));
    }
  });

  btnClearBoard?.addEventListener('click', () => {
    viewport.querySelectorAll('.pb-node').forEach(el => el.remove());
    nodes = {}; connections = []; evaluateBuild(); renderWires();
  });

  toolboxToggle?.addEventListener("click", () => {
    const c = pcPage?.classList.contains("toolboxCollapsed");
    pcPage.classList.toggle("toolboxCollapsed", !c);
    toolboxToggle?.setAttribute("aria-expanded", c ? "true" : "false");
  });

  initToolbox(); evaluateBuild();
})();