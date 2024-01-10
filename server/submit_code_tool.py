from langchain.tools import tool
import redis
import time

r = redis.Redis(host="localhost", port=6379, decode_responses=True)


def create_submission_tool(thread_id: str):
    @tool
    def submit_modified_tf(new_code: str) -> str:
        """Use only this function to submit the modified terraform file back to the user."""
        print("code", new_code)

        timestamp = str(int(time.time()))

        r.hset(
            "code_store:" + thread_id,
            mapping={"ts": timestamp, "code": new_code},
        )
        return "done"

    return submit_modified_tf
