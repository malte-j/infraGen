import { nanoid } from "nanoid";

export function createThreadId() {
  return nanoid();
}

export function submitMessage({
  threadId,
  message,
  selectedResource,
  tfFile,
}: {
  threadId: string;
  message: string;
  selectedResource?: string;
  tfFile?: string;
}) {
  return fetch("http://localhost:8000/submitMessage", {
    method: "POST",
    body: JSON.stringify({ threadId, message, selectedResource, tfFile }),
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
