import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [updatedFile, setUpdatedFile] = useState("");
  const [diagramUri, setDiagramUri] = useState("");

  const [chatInput, setChatInput] = useState("");
  function handleSendMessage() {
    setIsLoading(true);

    vscode.postMessage({
      command: "userChatMessage",
      text: chatInput,
    });

    setChatInput("");
  }

  useEffect(() => {
    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
      setIsLoading(false);
      const message = event.data; // The json data that the extension sent
      switch (message.command) {
        case "text":
          setChatInput(message.text);
          break;
        case "updatedFile":
          setUpdatedFile(message.text);
          break;
        case "diagram":
          setDiagramUri(message.uri);
          break;
      }
    });
  }, []);

  return (
    <main>
      <pre>{updatedFile}</pre>
      {
        // Show loading indicator
        isLoading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )
      }

      {diagramUri && <img src={diagramUri} width="300" />}

      <VSCodeTextArea
        value={chatInput}
        style={{ width: "100%" }}
        onChange={(e: any) => setChatInput(e.target!.value as any)}></VSCodeTextArea>
      <VSCodeButton
        style={{
          marginLeft: "auto",
          marginTop: "6px",
        }}
        onClick={handleSendMessage}>
        Send
      </VSCodeButton>
    </main>
  );
}

export default App;
