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
  nextZIndex: 1
};

// INITIALIZATION 
// Jab page puri tarah load ho jaye, tab ye functions chalenge .
document.addEventListener("DOMContentLoaded", () => {
  initializeToolButtons();
  createResizeHandles();
  initializeKeyboardShortcuts();
  loadFromLocalStorage();
  console.log("Visual Editor Initialized");
});

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
let elementCounter = 0;

//  element ke liye ek unique ID generate karne ke liye
function generateId() {
  elementCounter++;
  return `element-${elementCounter}`;
}

canvas.addEventListener("click", (e) => {
  if (e.target !== canvas) return;

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
  }
});

function switchToSelectTool() {
    editorState.activeTool = "select";
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) setActiveButton(selectBtn);
    console.log("Switched to Select tool");
}

// element create karne ke liye

// Rectangle  ka function
function createRectangle(e) {
  const canvasRect = canvas.getBoundingClientRect();

  const width = 120;
  const height = 80;

  const x = e.clientX - canvasRect.left - width / 2;
  const y = e.clientY - canvasRect.top - height / 2;

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
  canvas.appendChild(rect);
  selectElement(rect);

  updateLayersPanel();
  console.log("Rectangle created:", rectData);
}

function createCircle(e) {
  const canvasRect = canvas.getBoundingClientRect();

  const size = 100;

  const x = e.clientX - canvasRect.left - size / 2;
  const y = e.clientY - canvasRect.top - size / 2;

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
  canvas.appendChild(circle);
  selectElement(circle);

  updateLayersPanel();
  console.log("Circle created:", circleData);
}

function createText(e) {
  const canvasRect = canvas.getBoundingClientRect();

  const width = 150;
  const height = 50;

  const x = e.clientX - canvasRect.left - width / 2;
  const y = e.clientY - canvasRect.top - height / 2;

  const textData = {
      id: generateId(),
      type: "text",
      x,
      y,
      width,
      height,
      backgroundColor: "#2ecc71",
      textContent: "Double click to edit",
      rotation: 0,
      zIndex: editorState.nextZIndex++
  };

  editorState.elements.push(textData);

  const textEl = createElementDOM(textData);
  canvas.appendChild(textEl);
  selectElement(textEl);

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
  element.style.width = data.width + "px";
  element.style.height = data.height + "px";
  element.style.backgroundColor = data.backgroundColor;
  element.style.transform = `rotate(${data.rotation}deg)`;
  element.style.zIndex = data.zIndex;

  if (data.type === "circle") {
      element.style.borderRadius = "50%";
  }

  if (data.type === "text") {
      element.textContent = data.textContent || "New Text";
      element.contentEditable = false;
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

      const dx = moveEvent.clientX - editorState.dragStartX;
      const dy = moveEvent.clientY - editorState.dragStartY;

      let newLeft = currentLeft + dx;
      let newTop = currentTop + dy;

      // Canvas ke bahar jaane se roko
      const canvasRect = canvas.getBoundingClientRect();
      const elementWidth = parseInt(element.style.width);
      const elementHeight = parseInt(element.style.height);

      newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - elementWidth));
      newTop = Math.max(0, Math.min(newTop, canvasRect.height - elementHeight));

      element.style.left = newLeft + "px";
      element.style.top = newTop + "px";

      const elementData = editorState.elements.find(el => el.id === element.dataset.id);
      if (elementData) {
          elementData.x = newLeft;
          elementData.y = newTop;
      }

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

  hideResizeHandles();
}

function showResizeHandles(element) {
  const left = parseInt(element.style.left);
  const top = parseInt(element.style.top);
  const width = parseInt(element.style.width);
  const height = parseInt(element.style.height);

  // Position handles
  resizeHandles.topleft.style.left = (left - 4) + "px";
  resizeHandles.topleft.style.top = (top - 4) + "px";

  resizeHandles.topright.style.left = (left + width - 4) + "px";
  resizeHandles.topright.style.top = (top - 4) + "px";

  resizeHandles.bottomleft.style.left = (left - 4) + "px";
  resizeHandles.bottomleft.style.top = (top + height - 4) + "px";

  resizeHandles.bottomright.style.left = (left + width - 4) + "px";
  resizeHandles.bottomright.style.top = (top + height - 4) + "px";

  // Show all handles
  Object.values(resizeHandles).forEach(handle => {
      if (handle) handle.style.display = "block";
  });
}

function hideResizeHandles() {
  Object.values(resizeHandles).forEach(handle => {
      if (handle) handle.style.display = "none";
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
  const startWidth = parseInt(selectedElement.style.width);
  const startHeight = parseInt(selectedElement.style.height);

  const minWidth = 30;
  const minHeight = 30;

  function onMouseMove(moveEvent) {
      if (!editorState.isResizing) return;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newLeft = startLeft;
      let newTop = startTop;
      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on handle position 
      if (position.includes("top")) {
          newTop = startTop + dy;
          newHeight = startHeight - dy;
      }
      if (position.includes("bottom")) {
          newHeight = startHeight + dy;
      }
      if (position.includes("left")) {
          newLeft = startLeft + dx;
          newWidth = startWidth - dx;
      }
      if (position.includes("right")) {
          newWidth = startWidth + dx;
      }

      // kam se kam 30px
      if (newWidth < minWidth) {
          newWidth = minWidth;
          if (position.includes("left")) {
              newLeft = startLeft + startWidth - minWidth;
          }
      }
      if (newHeight < minHeight) {
          newHeight = minHeight;
          if (position.includes("top")) {
              newTop = startTop + startHeight - minHeight;
          }
      }

      const canvasRect = canvas.getBoundingClientRect();
      newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - newWidth));
      newTop = Math.max(0, Math.min(newTop, canvasRect.height - newHeight));

      // Update project data
      selectedElement.style.left = newLeft + "px";
      selectedElement.style.top = newTop + "px";
      selectedElement.style.width = newWidth + "px";
      selectedElement.style.height = newHeight + "px";

      // Update State data
      const elementData = editorState.elements.find(el => el.id === selectedElement.dataset.id);
      if (elementData) {
          elementData.x = newLeft;
          elementData.y = newTop;
          elementData.width = newWidth;
          elementData.height = newHeight;
      }

      // Update resize handles position
      updateResizeHandlesPosition(selectedElement);

      // Update properties panel
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
  document.getElementById("propWidth").value = selectedData.width;
  document.getElementById("propHeight").value = selectedData.height;
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
      selectedElement.style.height = value + "px";
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

      // Clear canvas
      canvas.innerHTML = "";

      // Recreate resize handles
      createResizeHandles();

      // Recreate all elements
      editorState.elements.forEach(elementData => {
          const element = createElementDOM(elementData);
          canvas.appendChild(element);
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

