export async function createThread() {
  const res = await fetch("http://localhost:8000/createThread", {
    method: "POST",
  });
  const { threadId } = await res.json();
  return threadId as string;
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

  const json = (await res.json()) as {
    data: {
      content: {
        text: {
          value: string;
        };
      }[];
      role: "assistant" | "user";
    }[];
  };

  return json.data;
}
