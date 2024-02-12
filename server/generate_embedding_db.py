from dotenv import load_dotenv

from langchain.document_loaders import TextLoader
from langchain.document_loaders import DirectoryLoader
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings


load_dotenv(dotenv_path="../.env")

loader = DirectoryLoader(
    "./examples", glob="**/*.tf", loader_cls=TextLoader, show_progress=True
)
raw_documents = loader.load()

db = Chroma.from_documents(
    raw_documents, OpenAIEmbeddings(), persist_directory="./chroma_db"
)
