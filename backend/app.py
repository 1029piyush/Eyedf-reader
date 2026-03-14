from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import os
import shutil
from urllib.parse import quote
from uuid import uuid4

from pdf_utils import extract_pdf_text
from ai_utils import summarize, generate_workflow, explain_text, solve_questions, chat_with_pdf

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
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
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")


@app.get("/")
def home():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/reader")
def reader():
    return FileResponse(os.path.join(FRONTEND_DIR, "reader.html"))


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    safe_name = os.path.basename(file.filename)
    stored_name = f"{uuid4().hex}_{safe_name}"
    path = os.path.join(UPLOAD_FOLDER, stored_name)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_pdf_text(path)

    # Return a stable URL that can be loaded from the reader page.
    file_url = f"/uploads/{quote(stored_name)}"

    return {"text": text, "file_url": file_url}


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


@app.post("/chat")
async def chat(data: dict):
    result = chat_with_pdf(data.get("text", ""), data.get("question", ""))

    return {"answer": result}