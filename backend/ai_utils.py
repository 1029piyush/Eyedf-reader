import requests
from config import GROQ_API_KEY

URL = "https://api.groq.com/openai/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

MODEL = "llama-3.1-8b-instant"


def ask_groq(prompt):

    data = {
        "model": MODEL,
        "temperature": 0,
        "top_p": 1,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(URL, headers=HEADERS, json=data)

        # Convert response to JSON
        result = response.json()

        # Debug print (shows actual API response in terminal)
        print("Groq Response:", result)

        # Check if API returned an error
        if "choices" not in result:
            return f"Groq API Error: {result}"

        return result["choices"][0]["message"]["content"]

    except Exception as e:
        return f"Connection Error: {e}"


def summarize(text):

    prompt = f"""
Create a precise study summary from the text below.

Rules:
- Use very simple language.
- Keep it short and point-wise.
- Start with: **Main Idea** (1-2 lines)
- Then add: **Key Points** (4-8 bullet points)
- Then add: **Important Terms** (3-6 bullets, short definitions)
- Use only useful content from the text.
- Do not add decorative symbols.

Text:
{text[:4000]}
"""

    return ask_groq(prompt)


def generate_workflow(text):

    prompt = f"""
Convert the following concept into workflow steps.

Format:

Step
↓
Step
↓
Step

Text:
{text[:2000]}
"""

    return ask_groq(prompt)


def explain_text(text):

    prompt = f"""
Explain the following paragraph in simple learning style.
Make it easy for students.

Paragraph:
{text}
"""

    return ask_groq(prompt)


def solve_questions(text):

    prompt = f"""
You are an expert study assistant.

Create a clear structured summary of the following content.

Rules:
- Use headings
- Use bullet points
- Explain important concepts
- Highlight key terms
- Avoid stars or decorative symbols
- Keep it professional like study notes

Text:
{text[:4000]}
"""
    return ask_groq(prompt)


def chat_with_pdf(text, question):

    prompt = f"""
You are a helpful PDF study assistant.

Answer the user question using only the PDF context below.
If the answer is not present in the context, clearly say you could not find it in the PDF.
Keep the answer concise and clear.

PDF Context:
{text[:5000]}

User Question:
{question}
"""

    return ask_groq(prompt)