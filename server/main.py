from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")


from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import lc_agent
import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

app = FastAPI()


# Submit new message to thread and run assistant
class SubmitMessageRequest(BaseModel):
    threadId: str
    message: str
    tfFile: str | None = None


@app.post("/submitMessage")
async def submitMessage(
    request: SubmitMessageRequest, background_tasks: BackgroundTasks
) -> None:
    tf_file = request.tfFile if request.tfFile else ""
    lc_agent.submit_message(request.threadId, request.message, tf_file)


# Get messages from thread
@app.get("/getMessages/{threadId}")
async def getMessages(threadId: str):
    messages = r.lrange("message_store:" + threadId, 0, -1)

    return messages


# Get code from thread
@app.get("/getTfFile/{threadId}")
async def getTfFile(threadId: str):
    code = r.hgetall("code_store:" + threadId)
    return code  # lol
