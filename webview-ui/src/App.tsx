import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [chatInput, setChatInput] = useState("");
  function handleSendMessage() {
    vscode.postMessage({
      command: "userChatMessage",
      text: chatInput,
    });
  }

  useEffect(() => {
    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.command) {
        case "text":
          setChatInput(message.text);
          break;
      }
    });
  }, []);

    return (
    <main>
      
      <VSCodeTextArea
        value={chatInput}
        
        style={{ width: "100%" }}
        onChange={(e: any) => setChatInput(e.target!.value as any)}></VSCodeTextArea>
      <VSCodeButton 
        style={{
          marginLeft: "auto",
          marginTop: "6px",
        }}
      onClick={handleSendMessage}>Send</VSCodeButton>
    </main>
  );
}

export default App;
