from langchain.tools import tool
from langchain.vectorstores.chroma import Chroma
from langchain_openai import OpenAIEmbeddings

db = Chroma(embedding_function=OpenAIEmbeddings(), persist_directory="./chroma_db")


@tool
def reference_code_search(query: str) -> str:
    """Search for refernce code for specific architecture."""
    docs = db.similarity_search(query)

    if len(docs) > 0:
        return docs[0].page_content

    return "No results found"
