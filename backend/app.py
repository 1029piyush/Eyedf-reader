from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import os
import shutil

from pdf_utils import extract_pdf_text
from ai_utils import summarize, generate_workflow, explain_text, solve_questions

app = FastAPI()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# serve frontend folder
app.mount("/static", StaticFiles(directory="../frontend"), name="static")


@app.get("/")
def home():
    return FileResponse("../frontend/index.html")


@app.get("/reader")
def reader():
    return FileResponse("../frontend/reader.html")


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_pdf_text(path)

    return {"text": text}


@app.post("/summary")
async def get_summary(data: dict):

    result = summarize(data["text"])

    return {"summary": result}


@app.post("/workflow")
async def get_workflow(data: dict):

    result = generate_workflow(data["text"])

    return {"workflow": result}


@app.post("/explain")
async def explain(data: dict):

    result = explain_text(data["text"])

    return {"explanation": result}


@app.post("/solve")
async def solve(data: dict):

    result = solve_questions(data["text"])

    return {"solutions": result}