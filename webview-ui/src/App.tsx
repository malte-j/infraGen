import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

interface Message {
  type: "ai" | "human";
  data: {
    content: string;
  };
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [updatedFile, setUpdatedFile] = useState("");
  const [diagramUri, setDiagramUri] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    vscode.postMessage({
      command: "getMessages",
    });
  }, []);

  useEffect(() => {
    vscode.postMessage({
      command: "getTfFile",
    });
  }, [messages]);

  function handleSendMessage() {
    setIsLoading(true);

    vscode.postMessage({
      command: "userChatMessage",
      text: chatInput,
    });

    setChatInput("");
  }

  function handleNewThread() {
    vscode.postMessage({
      command: "newThread",
    });
  }

  // while is loading, repeatedly send the getMessagesCommand
  useEffect(() => {
    let interval: null | NodeJS.Timeout = null;

    if (isLoading) {
      interval = setInterval(() => {
        vscode.postMessage({
          command: "getMessages",
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  useEffect(() => {
    // Handle messages sent from the extension to the webview
    const handleMessage = (event: MessageEvent<any>) => {
      setIsLoading(false);
      const message = event.data; // The json data that the extension sent
      switch (message.command) {
        case "tfFile":
          setUpdatedFile(message.text);
          break;
        case "diagram":
          setDiagramUri(message.uri);
          break;
        case "messages":
          console.log(message);
          setMessages(
            message.messages
              .map((message: string) => {
                return JSON.parse(message) as Message;
              })
              .reverse()
          );

          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <main className="main">
      <div className="diagram">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          diagramUri && <img src={diagramUri} width="300" height="auto" />
        )}
      </div>

      {/* {diagramUri} */}

      {messages.map((message) => (
        <div className="message" data-by={message.type}>
          <Markdown>{message.data.content}</Markdown>
          {message.type === "ai" ? <CaretAI /> : <CaretHuman />}
        </div>
      ))}

      <div className="ta">
        <VSCodeTextArea
          value={chatInput}
          style={{ width: "100%" }}
          onChange={(e: any) => setChatInput(e.target!.value as any)}
          disabled={isLoading}
        />

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      <div className="buttons">
        <VSCodeButton
          onClick={handleNewThread}>
          New Thread
        </VSCodeButton>
        <VSCodeButton
          disabled={isLoading || !chatInput}
          onClick={handleSendMessage}>
          Send
        </VSCodeButton>
      </div>
    </main>
  );
}

export default App;

function CaretAI() {
  return (
    <svg
      className="caret"
      width="33"
      height="28"
      viewBox="0 0 33 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M33 28C24.5 19.5 24 13.5 24 0H0.5C10.6884 8.12533 12.5 28 33 28Z"
        fill="#E1F8E1"></path>
    </svg>
  );
}

function CaretHuman() {
  return (
    <svg
      className="caret"
      width="33"
      height="28"
      viewBox="0 0 33 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M33 28C24.5 19.5 24 13.5 24 0H0.5C10.6884 8.12533 12.5 28 33 28Z"
        fill="#EAE0FF"></path>
    </svg>
  );
}
