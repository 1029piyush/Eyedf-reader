let pdfText = "";


function getTextKey(text){
let source = text || "";
let hash = 0;

for(let i = 0; i < source.length; i++){
hash = ((hash << 5) - hash) + source.charCodeAt(i);
hash |= 0;
}

return `pdfSummary_${Math.abs(hash)}`;
}

/* UPLOAD */

async function uploadPDF(){

try{

let fileInput = document.getElementById("pdfFile");

let file = fileInput.files[0];

if(!file){
alert("Please choose a PDF file first.");
return;
}

let formData = new FormData();
formData.append("file", file);

let response = await fetch("/upload",{
method:"POST",
body:formData
});

if(!response.ok){
let errorText = await response.text();
throw new Error(errorText || "Upload failed");
}

let data = await response.json();

pdfText = data.text;

localStorage.setItem("pdfText", pdfText);
localStorage.setItem("pdfFileURL", data.file_url);

window.location.href="/reader";

}catch(error){
alert("Upload failed. Please try another PDF.");
console.error(error);
}

}


/* LOAD READER */

window.onload = function(){

if(!document.getElementById("textViewer")){
return;
}

pdfText = localStorage.getItem("pdfText");

if(pdfText){
renderReadableText(pdfText);
loadSummaryAutomatically();

const chatContainer = document.getElementById("chatMessages");
if(chatContainer && !chatContainer.children.length){
appendChatMessage("I am ready. Ask any question from your PDF.", "bot");
}
}

};


/* RENDER READABLE TEXT */

function renderReadableText(text){

const viewer = document.getElementById("textViewer");

if(!viewer){
return;
}

viewer.innerHTML = "";

let cleanText = (text || "")
.replace(/\r/g, "")
.replace(/\t/g, " ")
.trim();

if(!cleanText){
viewer.innerText = "No readable text was extracted from this PDF.";
return;
}

const lines = cleanText.split("\n");
let previousWasBlank = false;

for(let i = 0; i < lines.length; i++){

const rawLine = lines[i];
const line = rawLine.trim();

if(!line){
const spacer = document.createElement("div");
spacer.className = "doc-spacer";
viewer.appendChild(spacer);

if(!previousWasBlank){
const divider = document.createElement("div");
divider.className = "doc-divider";
viewer.appendChild(divider);
}

previousWasBlank = true;
continue;
}

previousWasBlank = false;

const isHeading = looksLikeHeading(line);

if(isHeading){
const heading = document.createElement("h3");
heading.className = "doc-heading";
heading.innerText = line;
viewer.appendChild(heading);
continue;
}

const lineEl = document.createElement("p");
lineEl.className = "doc-line";
lineEl.innerText = rawLine;
viewer.appendChild(lineEl);

}

}


function looksLikeHeading(line){

if(!line){
return false;
}

const shortLine = line.length <= 90;
const hasEndingPunctuation = /[.!?]$/.test(line);
const allCaps = /^[A-Z0-9\s,.:()\-]{3,}$/.test(line);
const titleCase = /^[A-Z][A-Za-z0-9\s,()\-:]{2,}$/.test(line) && !hasEndingPunctuation;
const numberedHeading = /^\d+(\.\d+)*[\).\-:]?\s+[A-Z]/.test(line);
const colonHeading = /^[A-Z][^.!?]{2,}:$/.test(line);

return shortLine && (allCaps || numberedHeading || colonHeading || titleCase);

}


async function loadSummaryAutomatically(){

const output = document.getElementById("aiOutput");

if(!output){
return;
}

const summaryKey = getTextKey(pdfText);
const cached = localStorage.getItem(summaryKey);

if(cached){
output.innerHTML = formatSummary(cached);
return;
}

output.innerText = "Generating summary...";

try{

let response = await fetch("/summary",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({text:pdfText})
});

if(!response.ok){
throw new Error("Summary request failed");
}

let data = await response.json();

localStorage.setItem(summaryKey, data.summary || "No summary generated.");
output.innerHTML = formatSummary(data.summary || "No summary generated.");

}catch(error){
output.textContent = "Could not generate summary right now.";
console.error(error);
}

}


/* MANUAL SUMMARY (kept as helper) */

async function summarize(){

let response = await fetch("/summary",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({text:pdfText})
});

let data = await response.json();

const summaryKey = getTextKey(pdfText);
localStorage.setItem(summaryKey, data.summary || "No summary generated.");
document.getElementById("aiOutput").innerHTML = formatSummary(data.summary || "No summary generated.");

}


/* CHANGE PDF */

function changePDF(){

localStorage.removeItem("pdfText");
localStorage.removeItem("pdfFileURL");

window.location.href="/";

}


/* CHATBOT */

function appendChatMessage(text, sender){

const container = document.getElementById("chatMessages");

if(!container){
return;
}

const message = document.createElement("div");
message.className = sender === "user" ? "user-message" : "bot-message";
message.innerText = text;

container.appendChild(message);
container.scrollTop = container.scrollHeight;

}


async function askPdfQuestion(){

const input = document.getElementById("chatInput");

if(!input){
return;
}

const question = input.value.trim();

if(!question){
return;
}

if(!pdfText){
appendChatMessage("Please upload and open a PDF first.", "bot");
return;
}

appendChatMessage(question, "user");
input.value = "";

try{

const response = await fetch("/chat", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({text: pdfText, question: question})
});

if(!response.ok){
throw new Error("Chat request failed");
}

const data = await response.json();

appendChatMessage(data.answer || "No answer generated.", "bot");

}catch(error){
appendChatMessage("Chat error. Please try again.", "bot");
console.error(error);
}

}


document.addEventListener("keydown", function(event){

if(event.key !== "Enter"){
return;
}

const input = document.getElementById("chatInput");

if(!input || document.activeElement !== input){
return;
}

if(event.shiftKey){
return;
}

event.preventDefault();

askPdfQuestion();

});


function escapeHtml(text){
return text
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/\"/g, "&quot;")
.replace(/'/g, "&#39;");
}


function formatSummary(text){

if(!text){
return "No summary generated.";
}

const lines = text.split("\n");
let html = "";
let inList = false;

for(let i = 0; i < lines.length; i++){

const raw = lines[i];
const line = raw.trim();

if(!line){
if(inList){
html += "</ul>";
inList = false;
}
continue;
}

if(/^[-*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line)){
if(!inList){
html += "<ul>";
inList = true;
}
const cleaned = line.replace(/^[-*]\s+/, "").replace(/^\d+[\.)]\s+/, "");
html += `<li>${escapeHtml(cleaned)}</li>`;
continue;
}

if(inList){
html += "</ul>";
inList = false;
}

let safeLine = escapeHtml(line)
.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
.replace(/__(.+?)__/g, "<strong>$1</strong>");

if(/^[A-Za-z][A-Za-z\s]+:$/.test(line)){
html += `<p><strong>${safeLine}</strong></p>`;
}else{
html += `<p>${safeLine}</p>`;
}

}

if(inList){
html += "</ul>";
}

return html;

}