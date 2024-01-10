import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

interface Message {
  type: "ai" | "user";
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
      interval && clearInterval(interval);
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
          diagramUri && <img src={diagramUri} width="300" />
        )}
      </div>

      {messages.map((message) => (
        <div
          style={{
            background: message.type === "ai" ? "#E1F8E1" : "#EAE0FF",
            color: message.type === "ai" ? "#08681C" : "#462093",
            margin: "6px",
          }}>
          <div>
            <Markdown>{message.data.content}</Markdown>
          </div>
        </div>
      ))}
      <VSCodeTextArea
        value={chatInput}
        style={{ width: "100%" }}
        onChange={(e: any) => setChatInput(e.target!.value as any)}
      />
      <VSCodeButton
        style={{
          marginLeft: "auto",
          marginTop: "6px",
        }}
        onClick={handleSendMessage}>
        Send
      </VSCodeButton>
      <VSCodeButton
        style={{
          marginLeft: "auto",
          marginTop: "6px",
        }}
        onClick={handleNewThread}>
        New Thread
      </VSCodeButton>
    </main>
  );
}

export default App;
