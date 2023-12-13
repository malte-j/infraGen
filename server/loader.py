import os
import getpass
from langchain.document_loaders import TextLoader
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma

os.environ["OPENAI_API_KEY"] = getpass.getpass("OpenAI API Key:")

loader = DirectoryLoader("./examples", glob="**/*.tf", loader_cls=TextLoader)
raw_documents = loader.load()

db = Chroma.from_documents(raw_documents, OpenAIEmbeddings())


