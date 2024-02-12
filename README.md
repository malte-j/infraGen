# Infragen

> Your AI sparring partner for cloud infrastructure

## Installing

Requirements:
- Python 3.11
- Node 20
- pnpm (`npm i -g pnpm`)
- VSCode

1. Install JavaScript dependencies, run `pnpm i`
2. Create a `.env` file in the root folder by copying and renaming the `.env.example` file and filling in the required values
3. Install python dependencies, run `pip install -r requirements.txt` in the `./server` folder
4. Add your own example terraform files to the `./server/examples` folder
5. To generate the embedding database, run `python generate_embedding_db.py` in the `./server` folder

# Running

1. Start the backend server: run `uvicorn main:app --reload` int the `./server` folder
2. Run the extension, press `f5` while opening this folder in VSCode
3. Open an extension window by opening the command menu (`⌘ + Shift + P`) and selecting the `Run Infragen` command 
