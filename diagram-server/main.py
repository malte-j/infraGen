from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("/")
async def root():
    exec("import sys\nprint(sys.version)", globals(), locals())

    return {"message": "Hello World"}


class DiagramCode(BaseModel):
    code: str


@app.post("/diagram")
async def create_diagram(code: DiagramCode):
    # eval is evil, but this is a demo

    # log the code to a file
    with open("/tmp/infragen/diagram.py", "w") as f:
        f.write(code.code)

    exec(code.code, globals(), locals())

    return {"message": "Diagram created"}
