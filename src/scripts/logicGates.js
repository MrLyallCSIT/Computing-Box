// src/scripts/logicGates.js
// Computing:Box — Drag & Drop Logic Builder

(() => {
  /* --- DOM Elements --- */
  const workspace = document.getElementById("workspace");
  const viewport = document.getElementById("viewport");
  const wireLayer = document.getElementById("wireLayer");
  const ttContainer = document.getElementById("truthTableContainer");
  const toolboxGrid = document.getElementById("toolboxGrid");
  
  const btnClearBoard = document.getElementById("btnClearBoard");
  const toolboxToggle = document.getElementById("toolboxToggle");
  const logicPage = document.getElementById("logicPage");

  /* --- ANSI Gate SVGs --- */
  const GATE_SVGS = {
    'AND': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,15 L20,15 M0,35 L20,35 M70,25 L100,25"/><path d="M20,5 L50,5 A20,20 0 0 1 50,45 L20,45 Z" fill="var(--bg)"/></g>`,
    'OR': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,15 L26,15 M0,35 L26,35 M70,25 L100,25"/><path d="M20,5 Q55,5 70,25 Q55,45 20,45 Q40,25 20,5 Z" fill="var(--bg)"/></g>`,
    'NOT': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,25 L30,25 M71,25 L100,25"/><path d="M30,10 L60,25 L30,40 Z" fill="var(--bg)"/><circle cx="65.5" cy="25" r="4.5" fill="var(--bg)"/></g>`,
    'NAND': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,15 L20,15 M0,35 L20,35 M80,25 L100,25"/><path d="M20,5 L50,5 A20,20 0 0 1 50,45 L20,45 Z" fill="var(--bg)"/><circle cx="74.5" cy="25" r="4.5" fill="var(--bg)"/></g>`,
    'NOR': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,15 L26,15 M0,35 L26,35 M80,25 L100,25"/><path d="M20,5 Q55,5 70,25 Q55,45 20,45 Q40,25 20,5 Z" fill="var(--bg)"/><circle cx="74.5" cy="25" r="4.5" fill="var(--bg)"/></g>`,
    'XOR': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,15 L24,15 M0,35 L24,35 M75,25 L100,25"/><path d="M30,5 Q60,5 75,25 Q60,45 30,45 Q50,25 30,5 Z" fill="var(--bg)"/><path d="M20,5 Q40,25 20,45"/></g>`,
    'XNOR': `<g stroke="#e8e8ee" stroke-width="3" fill="none"><path d="M0,15 L24,15 M0,35 L24,35 M85,25 L100,25"/><path d="M30,5 Q60,5 75,25 Q60,45 30,45 Q50,25 30,5 Z" fill="var(--bg)"/><path d="M20,5 Q40,25 20,45"/><circle cx="79.5" cy="25" r="4.5" fill="var(--bg)"/></g>`
  };

  const INPUT_SVG = `<svg class="lg-line-svg" viewBox="0 0 30 50"><path d="M0,25 L30,25" stroke="#e8e8ee" stroke-width="3" fill="none"/></svg>`;
  const OUTPUT_SVG = `<svg class="lg-line-svg" viewBox="0 0 30 50"><path d="M0,25 L30,25" stroke="#e8e8ee" stroke-width="3" fill="none"/></svg>`;

  /* --- State --- */
  let nodes = {}; 
  let connections = []; 
  
  let nextNodeId = 1;
  let nextWireId = 1;

  // Interaction State
  let isDraggingNode = null;
  let dragOffset = { x: 0, y: 0 };
  let clickStartX = 0, clickStartY = 0; 
  
  let wiringStart = null; 
  let tempWirePath = null;
  let selectedWireId = null; 
  let selectedNodeId = null;

  // Camera State (Pan & Zoom)
  let panX = 0, panY = 0, zoom = 1;
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  /* --- Setup Toolbox --- */
  function initToolbox() {
    if(!toolboxGrid) return;
    let html = `
      <div draggable="true" data-spawn="INPUT" class="drag-item tb-icon-box" title="Input Toggle">
        <div class="switch" style="pointer-events:none;"><span class="slider"></span></div>
        <div class="tb-icon-label">Input</div>
      </div>
      <div draggable="true" data-spawn="OUTPUT" class="drag-item tb-icon-box" title="Output Bulb">
        <div class="bulb on" style="pointer-events:none; width:28px; height:28px;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a6.75 6.75 0 0 0-6.75 6.75c0 2.537 1.393 4.75 3.493 5.922l.507.282v1.546h5.5v-1.546l.507-.282A6.75 6.75 0 0 0 12 2.25Zm-2.25 16.5v.75a2.25 2.25 0 0 0 4.5 0v-.75h-4.5Z"/></svg></div>
        <div class="tb-icon-label">Output</div>
      </div>
    `;
    Object.keys(GATE_SVGS).forEach(gate => {
      html += `
        <div draggable="true" data-spawn="GATE" data-gate="${gate}" class="drag-item tb-icon-box" title="${gate} Gate">
           <svg viewBox="0 0 100 50" style="width:50px; height:25px; pointer-events:none;">${GATE_SVGS[gate]}</svg>
           <div class="tb-icon-label">${gate}</div>
        </div>
      `;
    });
    toolboxGrid.innerHTML = html;

    document.querySelectorAll('.drag-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('spawnType', item.dataset.spawn);
        if(item.dataset.spawn === 'GATE') e.dataTransfer.setData('gateType', item.dataset.gate);
      });
    });
  }

  /* --- Camera Math --- */
  function updateViewport() {
    viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    workspace.style.backgroundSize = `${24 * zoom}px ${24 * zoom}px`;
    workspace.style.backgroundPosition = `${panX}px ${panY}px`;
  }

  function zoomWorkspace(factor, mouseX, mouseY) {
    const newZoom = Math.min(Math.max(0.2, zoom * factor), 3);
    panX = mouseX - (mouseX - panX) * (newZoom / zoom);
    panY = mouseY - (mouseY - panY) * (newZoom / zoom);
    zoom = newZoom;
    updateViewport();
  }

  function getPortCoords(nodeId, portDataAttr) {
    const node = nodes[nodeId];
    if (!node || !node.el) return {x:0, y:0};
    
    const portEl = node.el.querySelector(`[data-port="${portDataAttr}"]`);
    if (!portEl) return {x:0, y:0};

    const wsRect = workspace.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();
    
    // Calculate backwards through camera scale/pan to find true local coordinates
    return {
      x: (portRect.left - wsRect.left - panX + portRect.width / 2) / zoom,
      y: (portRect.top - wsRect.top - panY + portRect.height / 2) / zoom
    };
  }

  function drawBezier(x1, y1, x2, y2) {
    const cpDist = Math.abs(x2 - x1) * 0.6 + 20; 
    return `M ${x1} ${y1} C ${x1 + cpDist} ${y1}, ${x2 - cpDist} ${y2}, ${x2} ${y2}`;
  }

  /* --- Rendering --- */
  function renderWires() {
    let svgHTML = '';
    connections.forEach(conn => {
      const from = getPortCoords(conn.fromNode, 'out');
      const to = getPortCoords(conn.toNode, `in${conn.toPort}`);
      const sourceNode = nodes[conn.fromNode];
      const isActive = sourceNode && sourceNode.value === true;
      const isSelected = conn.id === selectedWireId;
      svgHTML += `<path class="lg-wire ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}" d="${drawBezier(from.x, from.y, to.x, to.y)}" data-conn-id="${conn.id}" />`;
    });

    if (wiringStart && tempWirePath) {
      svgHTML += `<path class="lg-wire lg-wire-temp" d="${drawBezier(wiringStart.x, wiringStart.y, tempWirePath.x, tempWirePath.y)}" />`;
    }
    wireLayer.innerHTML = svgHTML;
  }

  function updateNodePositions() {
    Object.values(nodes).forEach(n => {
      if (n.el) { n.el.style.left = `${n.x}px`; n.el.style.top = `${n.y}px`; }
    });
    renderWires();
  }

  function clearSelection() {
    selectedWireId = null; selectedNodeId = null;
    document.querySelectorAll('.lg-node.selected').forEach(el => el.classList.remove('selected'));
    renderWires();
  }

  /* --- Logic Evaluation --- */
  function evaluateGraph(overrideInputs = null) {
    let context = {}; 
    Object.values(nodes).filter(n => n.type === 'INPUT').forEach(n => {
      context[n.id] = overrideInputs ? overrideInputs[n.id] : n.value;
    });

    let changed = true; let loops = 0;
    while (changed && loops < 10) {
      changed = false; loops++;
      Object.values(nodes).filter(n => n.type === 'GATE').forEach(gate => {
        let in1Conn = connections.find(c => c.toNode === gate.id && c.toPort === '1');
        let in2Conn = connections.find(c => c.toNode === gate.id && c.toPort === '2');
        let val1 = in1Conn ? (context[in1Conn.fromNode] || false) : false;
        let val2 = in2Conn ? (context[in2Conn.fromNode] || false) : false;
        
        let res = false;
        switch(gate.gateType) {
          case 'AND': res = val1 && val2; break;
          case 'OR': res = val1 || val2; break;
          case 'NOT': res = !val1; break;
          case 'NAND': res = !(val1 && val2); break;
          case 'NOR': res = !(val1 || val2); break;
          case 'XOR': res = val1 !== val2; break;
          case 'XNOR': res = val1 === val2; break;
        }
        if (context[gate.id] !== res) { context[gate.id] = res; changed = true; }
      });
    }

    let outStates = {};
    Object.values(nodes).filter(n => n.type === 'OUTPUT').forEach(out => {
      let conn = connections.find(c => c.toNode === out.id);
      let res = conn ? (context[conn.fromNode] || false) : false;
      outStates[out.id] = res;
    });

    if (!overrideInputs) {
      Object.values(nodes).forEach(n => {
        if (n.type === 'GATE') n.value = context[n.id] || false;
        if (n.type === 'OUTPUT') {
          n.value = outStates[n.id] || false;
          const bulb = n.el.querySelector('.bulb');
          if (bulb) bulb.classList.toggle('on', n.value);
        }
      });
    }
    return outStates;
  }

  /* --- Truth Table Generation --- */
  function generateTruthTable() {
    if (!ttContainer) return;

    const inNodes = Object.values(nodes).filter(n => n.type === 'INPUT').sort((a,b) => a.label.localeCompare(b.label));
    const outNodes = Object.values(nodes).filter(n => n.type === 'OUTPUT').sort((a,b) => a.label.localeCompare(b.label));

    if (inNodes.length === 0 || outNodes.length === 0) {
      ttContainer.innerHTML = '<div style="padding: 16px; color: var(--muted); text-align:center;">Add inputs and outputs to generate table.</div>'; return;
    }
    if (inNodes.length > 6) {
      ttContainer.innerHTML = '<div style="padding: 16px; color: var(--muted); text-align:center;">Maximum 6 inputs supported.</div>'; return;
    }

    let html = '<table class="tt-table"><thead><tr>';
    inNodes.forEach(n => html += `<th>${n.label}</th>`);
    outNodes.forEach(n => html += `<th style="color:var(--text);">${n.label}</th>`);
    html += '</tr></thead><tbody>';

    const numRows = Math.pow(2, inNodes.length);
    for (let i = 0; i < numRows; i++) {
      let override = {};
      inNodes.forEach((n, idx) => { override[n.id] = ((i >> (inNodes.length - 1 - idx)) & 1) === 1; });
      let outStates = evaluateGraph(override);

      html += '<tr>';
      inNodes.forEach(n => { let val = override[n.id]; html += `<td class="${val ? 'tt-on' : ''}">${val ? 1 : 0}</td>`; });
      outNodes.forEach(n => { let val = outStates[n.id]; html += `<td class="${val ? 'tt-on' : ''}" style="font-weight:bold;">${val ? 1 : 0}</td>`; });
      html += '</tr>';
    }
    html += '</tbody></table>';
    ttContainer.innerHTML = html;
  }

  function runSimulation() {
    evaluateGraph();
    renderWires();
    generateTruthTable();
  }

  /* --- Smart Label Generation --- */
  function getNextInputLabel() {
    let charCode = 65; 
    while (Object.values(nodes).some(n => n.type === 'INPUT' && n.label === String.fromCharCode(charCode))) { charCode++; }
    return String.fromCharCode(charCode);
  }

  function getNextOutputLabel() {
    let idx = 1;
    while (Object.values(nodes).some(n => n.type === 'OUTPUT' && n.label === ('Q' + idx))) { idx++; }
    return 'Q' + idx;
  }

  /* --- Node Creation --- */
  function createNodeElement(node) {
    const el = document.createElement('div');
    el.className = `lg-node`; el.dataset.id = node.id;
    el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;

    let innerHTML = `<div class="lg-header">${node.label}</div><div class="lg-gate-container">`;

    if (node.type === 'INPUT') {
      innerHTML += `
        <div class="switch" style="margin:0;"><span class="slider"></span></div>
        ${INPUT_SVG}
        <div class="lg-port" data-port="out" style="top: 25px; left: 86px;"></div>
      `;
    } 
    else if (node.type === 'OUTPUT') {
      innerHTML += `
        <div class="lg-port" data-port="in1" style="top: 25px; left: 0;"></div>
        ${OUTPUT_SVG}
        <div class="bulb" style="margin:0;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a6.75 6.75 0 0 0-6.75 6.75c0 2.537 1.393 4.75 3.493 5.922l.507.282v1.546h5.5v-1.546l.507-.282A6.75 6.75 0 0 0 12 2.25Zm-2.25 16.5v.75a2.25 2.25 0 0 0 4.5 0v-.75h-4.5Z"/></svg></div>
      `;
    } 
    else if (node.type === 'GATE') {
      const isNot = node.gateType === 'NOT';
      innerHTML += `
        <div class="lg-port" data-port="in1" style="top: ${isNot ? '25px' : '15px'}; left: 0;"></div>
        ${!isNot ? `<div class="lg-port" data-port="in2" style="top: 35px; left: 0;"></div>` : ''}
        <svg class="lg-gate-svg" viewBox="0 0 100 50">${GATE_SVGS[node.gateType]}</svg>
        <div class="lg-port" data-port="out" style="top: 25px; left: 100px;"></div>
      `;
    }
    innerHTML += `</div>`;
    el.innerHTML = innerHTML;
    
    viewport.appendChild(el);
    node.el = el;

    if (node.type === 'INPUT') {
      el.querySelector('.switch').addEventListener('click', (e) => {
        const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
        if (dist > 3) {
          e.preventDefault(); // Prevents toggle if it was a drag motion
        } else {
          node.value = !node.value;
          el.querySelector('.switch').classList.toggle('active-sim', node.value);
          el.querySelector('.slider').style.background = node.value ? 'rgba(40,240,122,.25)' : '';
          el.querySelector('.slider').style.borderColor = node.value ? 'rgba(40,240,122,.30)' : '';
          el.querySelector('.slider').innerHTML = node.value ? `<style>#logicPage [data-id="${node.id}"] .slider::before { transform: translateX(28px); }</style>` : '';
          runSimulation();
        }
      });
    }
    return el;
  }

  function spawnNode(type, gateType = null, dropX = null, dropY = null) {
    let label = '';
    if (type === 'INPUT') label = getNextInputLabel();
    if (type === 'OUTPUT') label = getNextOutputLabel();
    if (type === 'GATE') label = gateType;

    const id = `node_${nextNodeId++}`;
    const offset = Math.floor(Math.random() * 40);
    const x = dropX !== null ? dropX : (type === 'INPUT' ? 50 : (type === 'OUTPUT' ? 600 : 300) + offset);
    const y = dropY !== null ? dropY : 150 + offset;

    const node = { id, type, gateType, label, x, y, value: false, el: null };
    nodes[id] = node;
    createNodeElement(node);
    runSimulation();
  }

  /* --- Global Interaction Handlers --- */

  // Camera Zoom Controls
  document.getElementById("btnZoomIn")?.addEventListener('click', () => { 
    const r = workspace.getBoundingClientRect(); zoomWorkspace(1.2, r.width/2, r.height/2); 
  });
  document.getElementById("btnZoomOut")?.addEventListener('click', () => { 
    const r = workspace.getBoundingClientRect(); zoomWorkspace(1/1.2, r.width/2, r.height/2); 
  });
  document.getElementById("btnZoomReset")?.addEventListener('click', () => { 
    panX = 0; panY = 0; zoom = 1; updateViewport(); 
  });

  workspace.addEventListener('wheel', (e) => {
    e.preventDefault();
    const wsRect = workspace.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.1 : (1/1.1);
    zoomWorkspace(factor, e.clientX - wsRect.left, e.clientY - wsRect.top);
  });
  
  workspace.addEventListener('mousedown', (e) => {
    clickStartX = e.clientX; clickStartY = e.clientY;

    const port = e.target.closest('.lg-port');
    if (port) {
      const nodeEl = port.closest('.lg-node');
      const portId = port.dataset.port;
      
      if (portId.startsWith('in')) {
        const existingIdx = connections.findIndex(c => c.toNode === nodeEl.dataset.id && c.toPort === portId.replace('in', ''));
        if (existingIdx !== -1) { connections.splice(existingIdx, 1); runSimulation(); return; }
      }

      if (portId === 'out') {
        const coords = getPortCoords(nodeEl.dataset.id, 'out');
        wiringStart = { node: nodeEl.dataset.id, port: portId, x: coords.x, y: coords.y };
        tempWirePath = { x: coords.x, y: coords.y };
        return;
      }
    }

    const wire = e.target.closest('.lg-wire');
    if (wire && wire.dataset.connId) {
      clearSelection();
      selectedWireId = wire.dataset.connId;
      renderWires();
      e.stopPropagation();
      return;
    }

    const nodeEl = e.target.closest('.lg-node');
    if (nodeEl) {
      clearSelection();
      selectedNodeId = nodeEl.dataset.id;
      nodeEl.classList.add('selected');
      isDraggingNode = nodeEl.dataset.id;
      
      const rect = nodeEl.getBoundingClientRect();
      dragOffset = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
      return;
    }

    // Clicked empty space -> Pan Camera
    clearSelection();
    isPanning = true;
    panStart = { x: e.clientX - panX, y: e.clientY - panY };
  });

  window.addEventListener('mousemove', (e) => {
    const wsRect = workspace.getBoundingClientRect();

    if (isPanning) {
      panX = e.clientX - panStart.x;
      panY = e.clientY - panStart.y;
      updateViewport();
      return;
    }

    if (isDraggingNode) {
      const node = nodes[isDraggingNode];
      let newX = (e.clientX - wsRect.left - panX) / zoom - dragOffset.x;
      let newY = (e.clientY - wsRect.top - panY) / zoom - dragOffset.y;
      node.x = newX; node.y = newY;
      updateNodePositions();
    }

    if (wiringStart) {
      tempWirePath = { 
        x: (e.clientX - wsRect.left - panX) / zoom, 
        y: (e.clientY - wsRect.top - panY) / zoom 
      };
      renderWires();
    }
  });

  window.addEventListener('mouseup', (e) => {
    isDraggingNode = null;
    isPanning = false;

    if (wiringStart) {
      const port = e.target.closest('.lg-port');
      if (port && port.dataset.port.startsWith('in')) {
        const targetNodeId = port.closest('.lg-node').dataset.id;
        const targetPortId = port.dataset.port.replace('in', ''); 

        if (targetNodeId !== wiringStart.node) {
          connections = connections.filter(c => !(c.toNode === targetNodeId && c.toPort === targetPortId));
          connections.push({ id: `conn_${nextWireId++}`, fromNode: wiringStart.node, fromPort: 'out', toNode: targetNodeId, toPort: targetPortId });
        }
      }
      wiringStart = null; tempWirePath = null;
      runSimulation();
    }
  });

  /* --- Deletion --- */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedWireId) {
        connections = connections.filter(c => c.id !== selectedWireId);
        clearSelection(); runSimulation();
      } 
      else if (selectedNodeId) {
        connections = connections.filter(c => c.fromNode !== selectedNodeId && c.toNode !== selectedNodeId);
        if (nodes[selectedNodeId] && nodes[selectedNodeId].el) {
          viewport.removeChild(nodes[selectedNodeId].el);
        }
        delete nodes[selectedNodeId];
        clearSelection(); runSimulation();
      }
    }
  });

  /* --- Drag and Drop --- */
  workspace.addEventListener('dragover', (e) => { e.preventDefault(); });
  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const spawnType = e.dataTransfer.getData('spawnType');
    if (spawnType) {
      const gateType = e.dataTransfer.getData('gateType');
      const wsRect = workspace.getBoundingClientRect();
      const x = (e.clientX - wsRect.left - panX) / zoom - 40; 
      const y = (e.clientY - wsRect.top - panY) / zoom - 30;
      spawnNode(spawnType, gateType || null, x, y);
    }
  });

  /* --- Init --- */
  btnClearBoard?.addEventListener('click', () => {
    viewport.querySelectorAll('.lg-node').forEach(el => el.remove());
    nodes = {}; connections = [];
    runSimulation();
  });

  toolboxToggle?.addEventListener("click", () => {
    const isCollapsed = logicPage?.classList.contains("toolboxCollapsed");
    logicPage.classList.toggle("toolboxCollapsed", !isCollapsed);
    toolboxToggle?.setAttribute("aria-expanded", isCollapsed ? "true" : "false");
    setTimeout(renderWires, 450); 
  });

  initToolbox();
})();