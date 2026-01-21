// GLOBAL EDITOR STATE
const editorState = {
    activeTool: null,       // yaha par ham activetool to null kar rahe he taki default me sabhi tool off rahe
    selectedElementId: null,  // ye bhi starting me null he
    elements: []              // ye ek empty array he jisme ham shape ya jo need hogi wo store hogi 
  };

const toolButtons = document.querySelectorAll(".toolBox .icon-btn");   

toolButtons.forEach((btn) => {                  //ye har har tool jo bana he uspe jaga one by one
  btn.addEventListener("click", () => {
    const tool = btn.dataset.tool;

    if (!tool) return;                 // agar koi tool on nahi he to return this

    editorState.activeTool = tool;
    console.log("Active tool:", tool);     // yaha tool active hoga jab click hoga

    setActiveButton(btn);
  });
});


function setActiveButton(activeBtn) {
    toolButtons.forEach((btn) => btn.classList.remove("active-tool"));      // yaha par jab second tool click hoga tab first one off hoga
    activeBtn.classList.add("active-tool");
  }
  