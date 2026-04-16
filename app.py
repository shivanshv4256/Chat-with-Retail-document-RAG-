# -------------------------------
# FASTAPI RAG BACKEND
# -------------------------------

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil, uuid, os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI


# -------------------------------
# CONFIG
# -------------------------------

# 🔐 Set your API key safely
os.environ["GOOGLE_API_KEY"] = ""

app = FastAPI()

# ✅ Enable CORS (only once)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# DATA STRUCTURES
# -------------------------------

class QueryRequest(BaseModel):
    query: str


documents_store = []
vectorstore = None


# -------------------------------
# UPLOAD PDF
# -------------------------------

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    global vectorstore

    file_id = str(uuid.uuid4())
    file_path = f"temp_{file_id}_{file.filename}"

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load PDF
    loader = PyPDFLoader(file_path)
    docs = loader.load()

    # Split text
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(docs)

    # Create embeddings
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Create vector DB
    vectorstore = FAISS.from_documents(chunks, embeddings)

    # Save metadata
    documents_store.append({
        "id": file_id,
        "name": file.filename,
        "size": 0,
        "uploadDate": "now",
        "status": "ready"
    })

    return {"message": "Uploaded successfully"}


# -------------------------------
# GET DOCUMENTS
# -------------------------------

@app.get("/documents")
async def get_documents():
    return documents_store


# -------------------------------
# ASK QUESTION (RAG)
# -------------------------------
@app.post("/ask")
async def ask_question(request: QueryRequest):
    global vectorstore

    try:
        if vectorstore is None:
            return {
                "answer": "Upload a document first",
                "sources": [],
                "chart": None
            }

        query = request.query

        # 🔍 Get MORE context (important)
        docs = vectorstore.similarity_search(query, k=5)

        context = "\n\n".join([doc.page_content for doc in docs])

        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            temperature=0.3
        )

        # 🧠 Smart prompt (NO blocking)
        prompt = f"""
You are an intelligent assistant.

Instructions:
- Use the context to answer the question.
- If the answer is partially available, give the best possible answer.
- If not clearly available, still try to provide a helpful response based on context.
- Keep answer clear and relevant.

Context:
{context}

Question:
{query}

Answer:
"""

        response = llm.invoke(prompt)

        return {
            "answer": response.content,
            "sources": [],
            "chart": None
        }

    except Exception as e:
        import traceback
        traceback.print_exc()

        return {
            "answer": f"Server error: {str(e)}",
            "sources": [],
            "chart": None
        }


# -------------------------------
# DELETE DOCUMENT
# -------------------------------

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    global documents_store

    documents_store = [
        doc for doc in documents_store if doc["id"] != doc_id
    ]

    return {"message": "Deleted successfully"}