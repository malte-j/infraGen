from langchain.tools import tool


@tool
def submit_modified_tf(new_code: str) -> str:
    """Use only this function to submit the modified terraform code back to the user."""
    print("code", new_code)

    return "done"
