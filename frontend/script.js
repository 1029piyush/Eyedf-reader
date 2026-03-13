let pdfText = "";

/* UPLOAD */

async function uploadPDF(){

let fileInput = document.getElementById("pdfFile");

let file = fileInput.files[0];

let formData = new FormData();
formData.append("file", file);

let response = await fetch("/upload",{
method:"POST",
body:formData
});

let data = await response.json();

pdfText = data.text;

localStorage.setItem("pdfText", pdfText);
localStorage.setItem("pdfFileURL", URL.createObjectURL(file));

window.location.href="/reader";

}


/* LOAD READER */

window.onload = function(){

pdfText = localStorage.getItem("pdfText");

let url = localStorage.getItem("pdfFileURL");

if(url){
renderPDF(url);
}

};


/* RENDER PDF */

async function renderPDF(url){

const pdf = await pdfjsLib.getDocument(url).promise;

const viewer = document.getElementById("pdfViewer");

viewer.innerHTML = "";

for(let page = 1; page <= pdf.numPages; page++){

let pageObj = await pdf.getPage(page);

let viewport = pageObj.getViewport({scale:1.5});

let canvas = document.createElement("canvas");

let context = canvas.getContext("2d");

canvas.height = viewport.height;
canvas.width = viewport.width;

viewer.appendChild(canvas);

await pageObj.render({
canvasContext: context,
viewport: viewport
}).promise;

}

}


/* CHANGE PDF */

function changePDF(){

localStorage.removeItem("pdfText");
localStorage.removeItem("pdfFileURL");

window.location.href="/";

}


/* SUMMARY */

async function summarize(){

let response = await fetch("/summary",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({text:pdfText})
});

let data = await response.json();

document.getElementById("aiOutput").innerText = data.summary;

}