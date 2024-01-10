import { nanoid } from "nanoid";

export async function createThread() {
  return nanoid();
}

export function submitMessage(threadId: string, message: string, tfFile?: string) {
  return fetch("http://localhost:8000/submitMessage", {
    method: "POST",
    body: JSON.stringify({ threadId, message, tfFile }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getMessages(threadId: string) {
  const res = await fetch(`http://localhost:8000/getMessages/${threadId}`);

  console.log(res);

  const json = (await res.json()) as any;

  return json;
}

export async function getTfFile(threadId: string) {
  const res = await fetch(`http://localhost:8000/getTfFile/${threadId}`);

  console.log(res);

  const json = (await res.json()) as {
    ts: number;
    code: string;
  };

  return json;
}
