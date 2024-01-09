import time
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from openai import Client
from dotenv import load_dotenv
import json
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores.chroma import Chroma

load_dotenv(dotenv_path="../.env")

client = Client()
app = FastAPI()
assistant = client.beta.assistants.create(
    name="AWS Solutions Architect Assistant",
    instructions="You are a professional AWS solutions architect. You are asked to design a solution for the customer. Try to find out the requirements first and then design a solution for the customer.",
    model="gpt-4-1106-preview",
    tools=[
        {
            "type": "function",
            "function": {
                "name": "getBestPracticeExample",
                "description": "Gets sample best practice example for a given search term",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        }
    ],
)
db = Chroma(embedding_function=OpenAIEmbeddings(), persist_directory="./chroma_db")


# Create a new thread
class CreateThreadResponse(BaseModel):
    threadId: str


@app.post("/createThread")
async def createThread() -> CreateThreadResponse:
    thread = client.beta.threads.create()

    # submit the base message containing the tf file in the future
    tf_file_message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content="<begin_terraform_file>\n<end_terraform_file>",
    )

    # update the thread metadata with the tf file message id
    client.beta.threads.update(
        thread.id, metadata={"tf_file_message": tf_file_message.id}
    )

    return CreateThreadResponse(threadId=thread.id)


# Submit new message to thread and run assistant
class SubmitMessageRequest(BaseModel):
    threadId: str
    message: str
    # optional tfFile
    tfFile: str | None = None


# Submit a message and monitor for tool usages
def pollForToolUsage(threadId: str, runId: str):
    run = client.beta.threads.runs.retrieve(thread_id=threadId, run_id=runId)

    ending_statuses = ["cancelled", "failed", "completed", "expired", "cancelling"]

    while run.status not in ending_statuses:
        if run.status == "requires_action":
            if run.required_action:
                tool_outputs = []
                # iterate over tool calls and submit the required action
                for tool_call in run.required_action.submit_tool_outputs.tool_calls:
                    match tool_call.function.name:
                        case "getBestPracticeExample":
                            # parse arguments from tool_call.function.arguments, which is a string
                            query = json.loads(tool_call.function.arguments)["query"]

                            docs = db.similarity_search(query)
                            content = ""
                            if len(docs) > 0:
                                content = docs[0].page_content
                            tool_outputs.append(
                                {"tool_call_id": tool_call.id, "output": content}
                            )

                run = client.beta.threads.runs.submit_tool_outputs(
                    thread_id=threadId, run_id=runId, tool_outputs=tool_outputs
                )
        # wait 500ms
        time.sleep(0.5)
        run = client.beta.threads.runs.retrieve(thread_id=threadId, run_id=runId)


@app.post("/submitMessage")
async def submitMessage(
    request: SubmitMessageRequest, background_tasks: BackgroundTasks
) -> None:
    
    # update the tf file if it was provided
    if request.tfFile:
        thread = client.beta.threads.retrieve(thread_id=request.threadId)
        if thread.metadata:
            tf_file_message_id = thread.metadata.tf_file_message # type: ignore

            if tf_file_message_id:
                client.beta.threads.messages.u pdate(
                    thread_id=request.threadId,
                    message_id=tf_file_message_id,

                )

            
            client.beta.threads.messages.update(thread_id=, content=request.tfFile)    
        



    client.beta.threads.messages.create(
        thread_id=request.threadId,
        role="user",
        content=request.message,
    )

    run = client.beta.threads.runs.create(
        thread_id=request.threadId,
        assistant_id=assistant.id,
    )

    background_tasks.add_task(pollForToolUsage, request.threadId, run.id)


# Get messages from thread
@app.get("/getMessages/{threadId}")
async def getMessages(threadId: str):
    try:
        messages = client.beta.threads.messages.list(thread_id=threadId)
        return messages
    except Exception as e:
        print(e)
        return "not found"
