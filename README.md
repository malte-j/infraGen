# Infragen

> Your AI sparring partner for cloud infrastructure

## Installing

The app is not ready for production usage or direct installation form the VSCode extension store. For now, if you want to use InfraGen, you have to set up the development environment.

Requirements:
- Python 3.11
- Conda
- Node 20
- pnpm (`npm i -g pnpm`)
- VSCode
- Inframap ([link](https://github.com/cycloidio/inframap))
- Graphviz CLI ([link](https://graphviz.org/download/))

1. Install JavaScript dependencies: run `pnpm i` and `(cd webview-ui && pnpm i && pnpm build)`
2. Create a `.env` file in the root folder by copying and renaming the `.env.example` file and filling in the required values
3. Install python dependencies, run `conda env create -f environment.yml` in the `./server` folder
4. Add your own example terraform files to the `./server/examples` folder
5. To generate the embedding database, run `python generate_embedding_db.py` in the `./server` folder
6. (temporary) There is, at the time of writing, a bug in Langchain which prevents the creation of a custom message template in the `server/lc_agent.py` file. To fix this, you have to manually edit the code where the error occurs. Either wait for the error to occur when running the application for the first time, or edit the `/Users/{your_username}/miniconda3/envs/infragen/lib/python3.11/site-packages/langchain/agents/openai_tools/base.py` file and remove the following lines 81-83:

    ```python
      missing_vars = {"agent_scratchpad"}.difference(prompt.input_variables)
      if missing_vars:
          raise ValueError(f"Prompt missing required variables: {missing_vars}")
    ```

## Running

1. Start the redis instance: run `docker compose up` in the `./server` folder
2. Start the backend server: run `uvicorn main:app --reload` in the `./server` folder
3. Run the extension: Open this folder in VSCode, press `f5` to launch the task to start a new VSCode window with the plugin installed
4. Open an extension window by opening the command menu (`⌘ + Shift + P`) and selecting the `Run Infragen` command 

## Architecture

![architecture](https://github.com/malte-j/infraGen/assets/12611076/490ff2bd-4d77-4ca4-84ef-000a1c0cb7be)

The extension requires a backend, which runs locally for now. The backend takes care of running the LLM-Agent and accessing all requried providers like the OpenAI API, a local version of ChromaDB and a Redis instance for persisting chat history and modified code.
