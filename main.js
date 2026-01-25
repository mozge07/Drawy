// global editor state
// 'editorState' . Isme hum saara zaroori data store karege .
const editorState = {
    activeTool: "select",       // ye saare default values hai 
    selectedElementId: null,
    elements: [],
    isDragging: false,
    isResizing: false,
    dragStartX: 0,
    dragStartY: 0,
    resizeHandle: null,
    nextZIndex: 1,
    zoom: 1
};

// INITIALIZATION 
// Jab page puri tarah load ho jaye, tab ye functions chalenge .
document.addEventListener("DOMContentLoaded", () => {
    initializeToolButtons();
    createResizeHandles();
    initializeKeyboardShortcuts();
    initializeGridToggle();
    loadFromLocalStorage();
    checkOnboarding();
    console.log("Visual Editor Initialized");
});

function initializeGridToggle() {
    const btn = document.getElementById("gridToggleBtn");
    const canvas = document.querySelector(".canvas");

    if (btn && canvas) {
        btn.addEventListener("click", () => {
            canvas.classList.toggle("grid-enabled");
            // Optional: Toggle icon style to show active state
            if (canvas.classList.contains("grid-enabled")) {
                btn.style.backgroundColor = "#4a90e2";
                btn.style.color = "white";
                btn.style.borderColor = "#4a90e2";
            } else {
                btn.style.backgroundColor = "";
                btn.style.color = "";
                btn.style.borderColor = "";
            }
        });
    }
}

// tool selection
// Ye function toolbar ke buttons (Rectangle, Circle, Text) ko kaam ke liye hai.
function initializeToolButtons() {
    const toolButtons = document.querySelectorAll(".toolBox .icon-btn");

    toolButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const tool = btn.dataset.tool;
            if (!tool) return;

            editorState.activeTool = tool;
            console.log("Active tool:", tool);

            setActiveButton(btn);
        });
    });

    const defaultTool = document.querySelector('[data-tool="select"]');
    if (defaultTool) setActiveButton(defaultTool);
}

// tool button ko higlight karta he
function setActiveButton(activeBtn) {
    const toolButtons = document.querySelectorAll(".toolBox .icon-btn");
    toolButtons.forEach((btn) => btn.classList.remove("active-tool"));
    activeBtn.classList.add("active-tool");
}

// canvas Drawing Area
const canvas = document.querySelector(".canvas");
function getZoomLayer() {
    return document.getElementById("zoomLayer");
}
let elementCounter = 0;

//  element ke liye ek unique ID generate karne ke liye
function generateId() {
    elementCounter++;
    return `element-${elementCounter}`;
}

function getCanvasCoordinates(clientX, clientY) {
    const zoomLayer = getZoomLayer();
    const rect = zoomLayer.getBoundingClientRect();
    return {
        x: (clientX - rect.left) / editorState.zoom,
        y: (clientY - rect.top) / editorState.zoom
    };
}

canvas.addEventListener("click", (e) => {
    if (e.target !== canvas && e.target !== getZoomLayer()) return;

    deselectAll();

    if (editorState.activeTool === "rectangle") {
        createRectangle(e);
        switchToSelectTool();
    } else if (editorState.activeTool === "circle") {
        createCircle(e);
        switchToSelectTool();
    } else if (editorState.activeTool === "text") {
        createText(e);
        switchToSelectTool();
    } else if (editorState.activeTool === "text") {
        createText(e);
        switchToSelectTool();
    }
});

// Wheel Zoom (Ctrl + Scroll)
canvas.addEventListener("wheel", (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(editorState.zoom + delta);
    }
}, { passive: false });

// Zoom Functions
function setZoom(newZoom) {
    editorState.zoom = Math.max(0.1, Math.min(newZoom, 3));

    const zoomLayer = getZoomLayer();
    if (zoomLayer) {
        zoomLayer.style.transform = `scale(${editorState.zoom})`;
    }
    const zoomLabel = document.getElementById("zoomLevel");
    if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(editorState.zoom * 100)}%`;
    }
}

function zoomIn() {
    setZoom(editorState.zoom + 0.1);
}

function zoomOut() {
    setZoom(editorState.zoom - 0.1);
}

function switchToSelectTool() {
    editorState.activeTool = "select";
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) setActiveButton(selectBtn);
    console.log("Switched to Select tool");
}

// element create karne ke liye

// Rectangle  ka function
function createRectangle(e) {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    const width = 120;
    const height = 80;

    const x = coords.x - width / 2;
    const y = coords.y - height / 2;

    const rectData = {
        id: generateId(),
        type: "rectangle",
        x,
        y,
        width,
        height,
        backgroundColor: "#4a90e2",
        rotation: 0,
        zIndex: editorState.nextZIndex++
    };

    editorState.elements.push(rectData);

    const rect = createElementDOM(rectData);
    getZoomLayer().appendChild(rect);
    selectElement(rect);

    updateLayersPanel();
    console.log("Rectangle created:", rectData);
}

function createCircle(e) {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    const size = 100;

    const x = coords.x - size / 2;
    const y = coords.y - size / 2;

    const circleData = {
        id: generateId(),
        type: "circle",
        x,
        y,
        width: size,
        height: size,
        backgroundColor: "#e24a90",
        rotation: 0,
        zIndex: editorState.nextZIndex++
    };

    editorState.elements.push(circleData);

    const circle = createElementDOM(circleData);
    getZoomLayer().appendChild(circle);
    selectElement(circle);

    updateLayersPanel();
    console.log("Circle created:", circleData);
}

function createText(e) {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    const width = 150;
    const height = 50;

    const x = coords.x - width / 2;
    const y = coords.y - height / 2;

    const textData = {
        id: generateId(),
        type: "text",
        x,
        y,
        width: "auto",
        height: "auto",
        backgroundColor: "#2ecc71",
        textContent: "Double click to edit",
        rotation: 0,
        zIndex: editorState.nextZIndex++
    };

    editorState.elements.push(textData);

    const textEl = createElementDOM(textData);
    getZoomLayer().appendChild(textEl);

    // Select element and update height after appending
    selectElement(textEl);
    const elementData = editorState.elements.find(el => el.id === textData.id);
    if (elementData) {
        elementData.height = textEl.offsetHeight;
    }

    updateLayersPanel();
    console.log("Text created:", textData);
}


function createElementDOM(data) {
    const element = document.createElement("div");
    element.classList.add(data.type === "rectangle" ? "rect" : data.type === "circle" ? "circle" : "text-element");
    element.dataset.id = data.id;

    element.style.position = "absolute";
    element.style.left = data.x + "px";
    element.style.top = data.y + "px";
    element.style.width = data.width === "auto" ? "auto" : data.width + "px";

    if (data.type === "text") {
        element.style.height = "auto";
        element.style.minHeight = (data.height === "auto" ? "30px" : data.height + "px");
    } else {
        element.style.height = data.height + "px";
    }

    element.style.backgroundColor = data.backgroundColor;
    element.style.transform = `rotate(${data.rotation}deg)`;
    element.style.transformOrigin = "center center";
    element.style.zIndex = data.zIndex;

    if (data.type === "circle") {
        element.style.borderRadius = "50%";
    }

    if (data.type === "text") {
        element.textContent = data.textContent || "New Text";
        element.contentEditable = false;
    }

    // Update height on input for text elements
    if (data.type === "text") {
        element.addEventListener("input", () => {
            const elementData = editorState.elements.find(el => el.id === element.dataset.id);
            if (elementData && element.style.height === "auto") {
                elementData.height = element.offsetHeight;
                updateResizeHandlesPosition(element);
                updatePropertiesPanel();
            }
        });
    }

    // Element select on click
    element.addEventListener("click", (ev) => {
        ev.stopPropagation(); // Click event ko canvas ke pass jane se roko
        selectElement(element);
    });

    // Enable dragging
    element.addEventListener("mousedown", (ev) => {
        if (ev.target.classList.contains("resize-handle")) return;
        startDrag(ev, element);
    });

    // Double-click to edit text 
    if (data.type === "text") {
        element.addEventListener("dblclick", (ev) => {
            ev.stopPropagation();
            element.contentEditable = true;
            element.focus();

            // Select all text
            const range = document.createRange();
            range.selectNodeContents(element);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        element.addEventListener("blur", () => {
            element.contentEditable = false;
            const elementData = editorState.elements.find(el => el.id === element.dataset.id);
            if (elementData) {
                elementData.textContent = element.textContent;
            }
            updatePropertiesPanel();
        });
    }

    return element;
}


function selectElement(el) {
    // Rpurana selection hatane ke liye
    document.querySelectorAll(".rect, .circle, .text-element").forEach(elem => {
        elem.classList.remove("selected");
    });

    // click karne par select karna
    el.classList.add("selected");
    editorState.selectedElementId = el.dataset.id;

    // resize handles show karna
    showResizeHandles(el);

    // properties panel update karna
    updatePropertiesPanel();

    // layers panel update karna
    updateLayersPanel();

    console.log("Selected element:", editorState.selectedElementId);
}

function deselectAll() {
    document.querySelectorAll(".rect, .circle, .text-element").forEach(elem => {
        elem.classList.remove("selected");
    });
    editorState.selectedElementId = null;
    hideResizeHandles();
    updatePropertiesPanel();
    updateLayersPanel();
    console.log("All elements deselected");
}

function getSelectedElement() {
    if (!editorState.selectedElementId) return null;
    return document.querySelector(`[data-id="${editorState.selectedElementId}"]`);
}

function getSelectedElementData() {
    if (!editorState.selectedElementId) return null;
    return editorState.elements.find(el => el.id === editorState.selectedElementId);
}

// for draaging

function startDrag(e, element) {
    if (!element.classList.contains("selected")) return;

    e.preventDefault();
    e.stopPropagation();

    editorState.isDragging = true;
    editorState.dragStartX = e.clientX;
    editorState.dragStartY = e.clientY;

    const currentLeft = parseInt(element.style.left) || 0;
    const currentTop = parseInt(element.style.top) || 0;

    function onMouseMove(moveEvent) {
        if (!editorState.isDragging) return;

        const rawDx = moveEvent.clientX - editorState.dragStartX;
        const rawDy = moveEvent.clientY - editorState.dragStartY;

        const dx = rawDx / editorState.zoom;
        const dy = rawDy / editorState.zoom;

        let newLeft = currentLeft + dx;
        let newTop = currentTop + dy;

        const elementData = editorState.elements.find(el => el.id === element.dataset.id);
        if (!elementData) return;

        // Zoom-aware logical canvas dimensions
        const canvasW = canvas.clientWidth / editorState.zoom;
        const canvasH = canvas.clientHeight / editorState.zoom;

        const maxLeft = canvasW - element.offsetWidth;
        const maxTop = canvasH - element.offsetHeight;

        newLeft = Math.round(Math.max(0, Math.min(newLeft, maxLeft)));
        newTop = Math.round(Math.max(0, Math.min(newTop, maxTop)));

        element.style.left = newLeft + "px";
        element.style.top = newTop + "px";

        elementData.x = newLeft;
        elementData.y = newTop;

        if (element.style.width !== "auto") elementData.width = Math.round(element.offsetWidth);
        if (element.style.height !== "auto") elementData.height = Math.round(element.offsetHeight);

        updateResizeHandlesPosition(element);
    }

    function onMouseUp() {
        editorState.isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        console.log("Drag ended");
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

// resize handles

const resizeHandles = {};

function createResizeHandles() {
    const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

    positions.forEach(pos => {
        const handle = document.createElement("div");
        handle.classList.add("resize-handle", pos);
        handle.dataset.position = pos;
        canvas.appendChild(handle);

        const key = pos.replaceAll("-", "");
        resizeHandles[key] = handle;

        handle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            startResize(e, pos);
        });
    });

}

function showResizeHandles(element) {

    Object.values(resizeHandles).forEach(handle => {
        element.appendChild(handle);
        handle.style.display = "block";

        // Reset positions to corners of the element
        const pos = handle.dataset.position;
        if (pos === "top-left") {
            handle.style.left = "-4px";
            handle.style.top = "-4px";
        } else if (pos === "top-right") {
            handle.style.left = "calc(100% - 4px)";
            handle.style.top = "-4px";
        } else if (pos === "bottom-left") {
            handle.style.left = "-4px";
            handle.style.top = "calc(100% - 4px)";
        } else if (pos === "bottom-right") {
            handle.style.left = "calc(100% - 4px)";
            handle.style.top = "calc(100% - 4px)";
        }
    });
}

function hideResizeHandles() {
    Object.values(resizeHandles).forEach(handle => {
        if (handle.parentElement) {
            handle.parentElement.removeChild(handle);
        }
    });
}

function updateResizeHandlesPosition(element) {
    if (!element.classList.contains("selected")) return;
    showResizeHandles(element);
}

// resize handles
function startResize(e, position) {
    e.preventDefault();
    e.stopPropagation();

    const selectedElement = getSelectedElement();
    if (!selectedElement) return;

    editorState.isResizing = true;
    editorState.resizeHandle = position;

    const startX = e.clientX;
    const startY = e.clientY;

    const startLeft = parseInt(selectedElement.style.left);
    const startTop = parseInt(selectedElement.style.top);
    const startWidth = selectedElement.offsetWidth;
    const startHeight = selectedElement.offsetHeight;

    const minWidth = 30;
    const minHeight = 30;

    function onMouseMove(moveEvent) {
        if (!editorState.isResizing) return;

        const rawDx = moveEvent.clientX - startX;
        const rawDy = moveEvent.clientY - startY;

        // Adjust for Zoom
        const dx = rawDx / editorState.zoom;
        const dy = rawDy / editorState.zoom;

        const rotationDeg = getSelectedElementData()?.rotation || 0;
        const rotationRad = (rotationDeg * Math.PI) / 180;

        // Transform dx, dy to local coordinates (ldx, ldy)
        const ldx = dx * Math.cos(rotationRad) + dy * Math.sin(rotationRad);
        const ldy = -dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);

        let newWidth = startWidth;
        let newHeight = startHeight;

        // Calculate new dimensions based on handle position using local displacements
        if (position.includes("top")) {
            newHeight = startHeight - ldy;
        } else if (position.includes("bottom")) {
            newHeight = startHeight + ldy;
        }

        if (position.includes("left")) {
            newWidth = startWidth - ldx;
        } else if (position.includes("right")) {
            newWidth = startWidth + ldx;
        }

        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        const cx = startLeft + startWidth / 2;
        const cy = startTop + startHeight / 2;

        const lx = (position.includes("left") ? 1 : -1) * (startWidth / 2);
        const ly = (position.includes("top") ? 1 : -1) * (startHeight / 2);

        const pax = cx + lx * Math.cos(rotationRad) - ly * Math.sin(rotationRad);
        const pay = cy + lx * Math.sin(rotationRad) + ly * Math.cos(rotationRad);

        const nlx = (position.includes("left") ? 1 : -1) * (newWidth / 2);
        const nly = (position.includes("top") ? 1 : -1) * (newHeight / 2);

        const ncx = pax - (nlx * Math.cos(rotationRad) - nly * Math.sin(rotationRad));
        const ncy = pay - (nlx * Math.sin(rotationRad) + nly * Math.cos(rotationRad));

        // Zoom-aware logical canvas dimensions
        const canvasW = canvas.clientWidth / editorState.zoom;
        const canvasH = canvas.clientHeight / editorState.zoom;

        // New coordinates candidates
        let finalLeft = Math.round(ncx - newWidth / 2);
        let finalTop = Math.round(ncy - newHeight / 2);
        let finalWidth = newWidth;
        let finalHeight = newHeight;

        // Strict clamping to canvas boundaries
        if (finalLeft < 0) {
            finalWidth += finalLeft; // Reduce width if element goes off left
            finalLeft = 0;
        }
        if (finalTop < 0) {
            finalHeight += finalTop; // Reduce height if element goes off top
            finalTop = 0;
        }
        if (finalLeft + finalWidth > canvasW) {
            finalWidth = canvasW - finalLeft;
        }
        if (finalTop + finalHeight > canvasH) {
            finalHeight = canvasH - finalTop;
        }

        // Ensure minimum dimensions after clamping
        finalWidth = Math.max(minWidth, finalWidth);
        finalHeight = Math.max(minHeight, finalHeight);

        // Apply visual updates
        selectedElement.style.left = finalLeft + "px";
        selectedElement.style.top = finalTop + "px";

        const elementData = editorState.elements.find(el => el.id === selectedElement.dataset.id);

        if (elementData && elementData.type === "text") {
            selectedElement.style.width = finalWidth + "px";
            selectedElement.style.height = "auto";
            selectedElement.style.minHeight = finalHeight + "px";
        } else {
            selectedElement.style.width = finalWidth + "px";
            selectedElement.style.height = finalHeight + "px";
        }

        if (elementData) {
            elementData.x = finalLeft;
            elementData.y = finalTop;
            elementData.width = Math.round(finalWidth);
            elementData.height = Math.round(finalHeight);
        }

        updateResizeHandlesPosition(selectedElement);
        updatePropertiesPanel();
    }

    function onMouseUp() {
        editorState.isResizing = false;
        editorState.resizeHandle = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        console.log("Resize ended");
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}


function updatePropertiesPanel() {
    const propertiesContent = document.getElementById("propertiesContent");
    const propertiesForm = document.getElementById("propertiesForm");
    const selectedData = getSelectedElementData();

    if (!selectedData) {
        propertiesContent.style.display = "block";
        propertiesForm.style.display = "none";
        return;
    }

    propertiesContent.style.display = "none";
    propertiesForm.style.display = "flex";

    // Update form values
    const visualWidth = selectedData.width === "auto" ? getSelectedElement().offsetWidth : selectedData.width;
    const visualHeight = selectedData.height === "auto" ? getSelectedElement().offsetHeight : selectedData.height;

    document.getElementById("propWidth").value = Math.round(visualWidth);
    document.getElementById("propHeight").value = Math.round(visualHeight);
    document.getElementById("propRotation").value = selectedData.rotation;
    document.getElementById("rotationValue").textContent = selectedData.rotation + "°";
    document.getElementById("propBgColor").value = selectedData.backgroundColor;

    // Text content (only for text elements)
    const textContentGroup = document.getElementById("textContentGroup");
    const propTextContent = document.getElementById("propTextContent");

    if (selectedData.type === "text") {
        textContentGroup.style.display = "flex";
        propTextContent.value = selectedData.textContent || "";
    } else {
        textContentGroup.style.display = "none";
    }

    // Add event listeners (remove old ones first)
    const propWidth = document.getElementById("propWidth");
    const propHeight = document.getElementById("propHeight");
    const propRotation = document.getElementById("propRotation");
    const propBgColor = document.getElementById("propBgColor");

    propWidth.onfocus = () => propWidth.select();
    propHeight.onfocus = () => propHeight.select();

    propWidth.oninput = () => {
        const val = parseInt(propWidth.value);
        if (!isNaN(val) && val >= 30) updateElementProperty("width", val);
    };
    propHeight.oninput = () => {
        const val = parseInt(propHeight.value);
        if (!isNaN(val) && val >= 30) updateElementProperty("height", val);
    };
    propRotation.oninput = () => {
        const rotation = parseInt(propRotation.value) || 0;
        updateElementProperty("rotation", rotation);
        document.getElementById("rotationValue").textContent = rotation + "°";
    };
    propBgColor.oninput = () => updateElementProperty("backgroundColor", propBgColor.value);


    if (selectedData.type === "text") {
        propTextContent.onfocus = () => propTextContent.select();
        propTextContent.oninput = () => updateElementProperty("textContent", propTextContent.value);
    }
}

function updateElementProperty(property, value) {
    const selectedElement = getSelectedElement();
    const selectedData = getSelectedElementData();

    if (!selectedElement || !selectedData) return;

    selectedData[property] = value;

    // Update DOM
    if (property === "width") {
        selectedElement.style.width = value + "px";
        updateResizeHandlesPosition(selectedElement);
    } else if (property === "height") {
        if (selectedData.type === "text") {
            selectedElement.style.height = "auto";
            selectedElement.style.minHeight = value + "px";
        } else {
            selectedElement.style.height = value + "px";
        }
        updateResizeHandlesPosition(selectedElement);
    } else if (property === "rotation") {
        selectedElement.style.transform = `rotate(${value}deg)`;
    } else if (property === "backgroundColor") {
        selectedElement.style.backgroundColor = value;
    } else if (property === "textContent") {
        selectedElement.textContent = value;
    }
}

// rotate wal area

function rotateElement(degrees) {
    const selectedData = getSelectedElementData();
    if (!selectedData) return;

    selectedData.rotation = (selectedData.rotation + degrees) % 360;
    if (selectedData.rotation < 0) selectedData.rotation += 360;

    const selectedElement = getSelectedElement();
    if (selectedElement) {
        selectedElement.style.transform = `rotate(${selectedData.rotation}deg)`;
    }

    updatePropertiesPanel();
}

// layer panels

function updateLayersPanel() {
    const layersList = document.getElementById("layersList");
    layersList.innerHTML = "";

    const sortedElements = [...editorState.elements].sort((a, b) => b.zIndex - a.zIndex);

    sortedElements.forEach(elementData => {
        const layerItem = document.createElement("div");
        layerItem.classList.add("layer-item");
        layerItem.dataset.elementId = elementData.id;

        if (editorState.selectedElementId === elementData.id) {
            layerItem.classList.add("active");
        }

        const icon = elementData.type === "rectangle" ? "ri-square-fill" :
            elementData.type === "circle" ? "ri-circle-fill" : "ri-text";

        layerItem.innerHTML = `<i class="${icon}"></i> ${elementData.type} ${elementData.id.split("-")[1]}`;

        layerItem.addEventListener("click", () => {
            const element = canvas.querySelector(`[data-id="${elementData.id}"]`);
            if (element) selectElement(element);
        });

        layersList.appendChild(layerItem);
    });
}

function moveLayerUp() {
    const selectedData = getSelectedElementData();
    if (!selectedData) return;

    //z-index
    const higherElements = editorState.elements.filter(el => el.zIndex > selectedData.zIndex);
    if (higherElements.length === 0) return;

    const nextElement = higherElements.reduce((prev, curr) =>
        curr.zIndex < prev.zIndex ? curr : prev
    );

    // Swap z-indexes
    const temp = selectedData.zIndex;
    selectedData.zIndex = nextElement.zIndex;
    nextElement.zIndex = temp;

    // Update DOM
    const selectedElement = getSelectedElement();
    const nextDOMElement = document.querySelector(`[data-id="${nextElement.id}"]`);

    if (selectedElement) selectedElement.style.zIndex = selectedData.zIndex;
    if (nextDOMElement) nextDOMElement.style.zIndex = nextElement.zIndex;

    updateLayersPanel();
}

function moveLayerDown() {
    const selectedData = getSelectedElementData();
    if (!selectedData) return;

    //  z-index
    const lowerElements = editorState.elements.filter(el => el.zIndex < selectedData.zIndex);
    if (lowerElements.length === 0) return;


    const prevElement = lowerElements.reduce((prev, curr) =>
        curr.zIndex > prev.zIndex ? curr : prev
    );

    // Swap z-indexes
    const temp = selectedData.zIndex;
    selectedData.zIndex = prevElement.zIndex;
    prevElement.zIndex = temp;

    // Update DOM
    const selectedElement = getSelectedElement();
    const prevDOMElement = document.querySelector(`[data-id="${prevElement.id}"]`);

    if (selectedElement) selectedElement.style.zIndex = selectedData.zIndex;
    if (prevDOMElement) prevDOMElement.style.zIndex = prevElement.zIndex;

    updateLayersPanel();
}

// keyboard shortcuts

function initializeKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        const selectedElement = getSelectedElement();
        const selectedData = getSelectedElementData();

        if (!selectedElement || !selectedData) return;

        // Delete key
        if (e.key === "Delete") {
            e.preventDefault();
            deleteSelectedElement();
        }

        // Arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            moveElementWithArrows(e.key, selectedElement, selectedData);
        }
    });
}

function deleteSelectedElement() {
    const selectedElement = getSelectedElement();
    const selectedData = getSelectedElementData();

    if (!selectedElement || !selectedData) {
        console.warn("Cannot delete: no element selected");
        return;
    }

    console.log("Attempting to delete element:", selectedData.id);

    // Save the ID before any updation
    const elementId = selectedData.id;

    const elementInDOM = canvas.querySelector(`[data-id="${elementId}"]`);
    if (!elementInDOM) {
        console.error("Element not found in canvas:", elementId);
        return;
    }

    const index = editorState.elements.findIndex(el => el.id === elementId);
    if (index > -1) {
        editorState.elements.splice(index, 1);
        console.log("Removed from editorState.elements, remaining:", editorState.elements.length);
    }

    editorState.selectedElementId = null;

    hideResizeHandles();

    // Remove the element from the DOM 
    try {
        elementInDOM.remove();
        console.log("Element removed from DOM successfully");
    } catch (error) {
        console.error("Error removing element from DOM:", error);
    }

    // Update UI panels 
    updateLayersPanel();
    updatePropertiesPanel();

    console.log("Deletion complete for:", elementId);
}

function moveElementWithArrows(key, element, elementData) {
    const moveAmount = 5;
    let newX = elementData.x;
    let newY = elementData.y;

    switch (key) {
        case "ArrowUp":
            newY -= moveAmount;
            break;
        case "ArrowDown":
            newY += moveAmount;
            break;
        case "ArrowLeft":
            newX -= moveAmount;
            break;
        case "ArrowRight":
            newX += moveAmount;
            break;
    }

    const canvasRect = canvas.getBoundingClientRect();
    newX = Math.max(0, Math.min(newX, canvasRect.width - elementData.width));
    newY = Math.max(0, Math.min(newY, canvasRect.height - elementData.height));

    // Update state and DOM 
    elementData.x = newX;
    elementData.y = newY;
    element.style.left = newX + "px";
    element.style.top = newY + "px";

    // Update resize handles 
    updateResizeHandlesPosition(element);
}

// localStorage

function saveToLocalStorage() {
    try {
        const dataToSave = {
            elements: editorState.elements,
            nextZIndex: editorState.nextZIndex,
            elementCounter: elementCounter
        };
        localStorage.setItem("drawyEditorState", JSON.stringify(dataToSave));
        console.log("Saved to localStorage:", dataToSave);
        alert("Project saved successfully!");
    } catch (error) {
        console.error("Error saving to localStorage:", error);
        alert("Error saving project!");
    }
}

// theme changer
// theme change ka function
function toggleTheme() {

    // agar light theme pehle se hai
    if (document.body.classList.contains("light-theme")) {
        // to usko hata do
        document.body.classList.remove("light-theme");
        console.log("ab dark theme hai");
        localStorage.setItem("drawyTheme", "dark");
    } else {
        // nahi to light theme laga do
        document.body.classList.add("light-theme");
        console.log("ab light theme hai");
        localStorage.setItem("drawyTheme", "light");
    }
}

//  check jab page load hone par konsa theme he
document.addEventListener("DOMContentLoaded", () => {
    let savedTheme = localStorage.getItem("drawyTheme");

    // agar light theme save tha to save wali theme apply karo
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
    }
});



function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem("drawyEditorState");
        if (!savedData) return;

        const data = JSON.parse(savedData);

        editorState.elements = data.elements || [];
        editorState.nextZIndex = data.nextZIndex || 1;
        elementCounter = data.elementCounter || 0;
        const gridBtn = document.getElementById("gridToggleBtn");

        // Clear canvas
        const zoomLayer = getZoomLayer();
        if (zoomLayer) {
            zoomLayer.innerHTML = "";
            // Reset zoom transform
            zoomLayer.style.transform = `scale(${editorState.zoom})`;
        }

        // Recreate resize handles
        createResizeHandles();

        // Recreate all elements
        editorState.elements.forEach(elementData => {
            const element = createElementDOM(elementData);
            if (zoomLayer) zoomLayer.appendChild(element);
        });

        updateLayersPanel();
        console.log("Loaded from localStorage:", data);
    } catch (error) {
        console.error("Error loading from localStorage:", error);
    }
}

// export json

function exportJSON() {
    try {
        const dataToExport = {
            elements: editorState.elements,
            version: "1.0",
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `drawy-export-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        console.log("JSON exported successfully");
    } catch (error) {
        console.error("Error exporting JSON:", error);
        alert("Error exporting JSON!");
    }
}

//  export html

function exportHTML() {
    try {
        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DRAWY Export</title>
  <style>
      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }
      body {
          background-color: #1f1d1d;
          padding: 20px;
      }
      .canvas {
          position: relative;
          width: 100%;
          height: 800px;
          background-color: #2a2a2a;
          border-radius: 10px;
      }
      .element {
          position: absolute;
      }
      .text-element {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
          padding: 10px;
      }
  </style>
</head>
<body>
  <div class="canvas">
`;

        // Add all elements
        editorState.elements.forEach(el => {
            const styles = `
              left: ${el.x}px;
              top: ${el.y}px;
              width: ${el.width}px;
              height: ${el.height}px;
              background-color: ${el.backgroundColor};
              transform: rotate(${el.rotation}deg);
              z-index: ${el.zIndex};
              ${el.type === "circle" ? "border-radius: 50%;" : ""}
          `.trim().replace(/\s+/g, " ");

            if (el.type === "text") {
                htmlContent += `        <div class="element text-element" style="${styles}">${el.textContent}</div>\n`;
            } else {
                htmlContent += `        <div class="element" style="${styles}"></div>\n`;
            }
        });

        htmlContent += `    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `drawy-export-${Date.now()}.html`;
        link.click();

        URL.revokeObjectURL(url);
        console.log("HTML exported successfully");
    } catch (error) {
        console.error("Error exporting HTML:", error);
        alert("Error exporting HTML!");
    }
}

// Onboarding Logic
function checkOnboarding() {
    const seen = localStorage.getItem("drawyOnboardingSeen");
    if (!seen) {
        const modal = document.getElementById("onboardingModal");
        if (modal) modal.style.display = "flex";
    }
}

function closeOnboarding() {
    const modal = document.getElementById("onboardingModal");
    if (modal) modal.style.display = "none";
    localStorage.setItem("drawyOnboardingSeen", "true");
}

