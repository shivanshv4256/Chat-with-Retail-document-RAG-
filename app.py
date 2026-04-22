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

os.environ["GOOGLE_API_KEY"] = ""

app = FastAPI()

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
# RETAIL FILTERS
# -------------------------------

RETAIL_KEYWORDS = [
    "retail", "store", "inventory", "sales", "customer",
    "product", "pricing", "supply chain", "shopping",
    "ecommerce", "pos", "merchandise",
    "sku", "checkout", "order", "warehouse", "discount"
]


def is_retail_document_keyword(text: str) -> bool:
    text_lower = text.lower()
    matches = sum(1 for keyword in RETAIL_KEYWORDS if keyword in text_lower)
    return matches >= 5





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

    # Full text
    full_text = " ".join([doc.page_content for doc in docs])

    # ✅ Combined filter (fast + smart)
    if  not is_retail_document_keyword(full_text) :
        os.remove(file_path)
        return {"message": "Only retail-related documents are allowed"}

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(docs)

    # Embeddings
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Vector DB (append instead of overwrite)
    if vectorstore is None:
        vectorstore = FAISS.from_documents(chunks, embeddings)
    else:
        vectorstore.add_documents(chunks)

    # Store metadata
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

        # Retrieve context
        docs = vectorstore.similarity_search(query, k=5)
        context = "\n\n".join([doc.page_content for doc in docs])

        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            temperature=0.3
        )

        prompt = f"""
You are a strict Retail Intelligence Assistant.

RULES (MANDATORY):
1. Answer ONLY if the question is related to retail domain 
   (sales, stores, inventory, customers, products, pricing, supply chain, ecommerce, POS).
2. Answer ONLY using the provided context.
3. Use outside knowledge provided in Document.
4. If answer not found, say:
   "Answer not available in the provided retail document."
5. If not retail question, say:
   "This question is outside the retail domain."


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