import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
  workspace,
  Memento,
  WorkspaceEdit,
  Range,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { createThreadId, getMessages, getTfFile, submitMessage } from "../ai/agents";
import { exec, execSync } from "child_process";
import { readFileSync, writeFile } from "fs";
import { UserCommmands } from "./commands";

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private static currentWorkspaceState: Memento | undefined;
  readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The HelloWorldPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri, workspaceState: Memento) {
    if (HelloWorldPanel.currentPanel) {
      // If the webview panel already exists reveal it
      HelloWorldPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "showHelloWorld",
        // Panel title
        "Infragen",
        // The editor column the panel should be displayed in
        ViewColumn.Two,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, "out"),
            Uri.joinPath(extensionUri, "webview-ui/build"),
            Uri.joinPath(Uri.file("/tmp/infragen")),
          ],
        }
      );

      // mkdir /tmp/infragen
      execSync("mkdir -p /tmp/infragen");

      HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
      HelloWorldPanel.currentWorkspaceState = workspaceState;

      generateDiagram();

      // when main.tf is edited, update the diagram
      workspace.onDidChangeTextDocument((e) => {
        if (e.document.fileName.includes("main.tf")) {
          generateDiagram();
        }
      });
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    HelloWorldPanel.currentPanel = undefined;
    HelloWorldPanel.currentWorkspaceState = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: UserCommmands) => {
        const command = message.command;

        const state = HelloWorldPanel.currentWorkspaceState;
        let threadId: string | undefined = state?.get("threadId");
        let mainTfFile = (await workspace.findFiles("**/main.tf"))[0];
        const document = await workspace.openTextDocument(mainTfFile);

        switch (command) {
          case "userChatMessage":
            const { text, selectedResource } = message;

            if (!mainTfFile) {
              window.showInformationMessage("No main.tf file found");
              return;
            }
            const tfFile = document.getText();

            // if no thread exists, create one
            if (!threadId) {
              threadId = createThreadId();
              state?.update("threadId", threadId);
            }

            const tsBefore = Date.now();

            // submit message to thread
            await submitMessage({ threadId, message: text, selectedResource, tfFile });

            // TODO: check if ids in same range

            // wait for message to return and grab any new tf file
            const modifiedTfFile = await getTfFile(threadId);

            window.showInformationMessage(`${tsBefore} / ${modifiedTfFile.ts}`);

            if (!modifiedTfFile.code || modifiedTfFile.ts < tsBefore) return;
            const edit = new WorkspaceEdit();
            edit.replace(mainTfFile, new Range(0, 0, 100000, 100000), modifiedTfFile.code);
            await workspace.applyEdit(edit).then((success) => {
              if (!success) return;
              document.save();
            });

            break;
          case "getMessages":
            if (!threadId) break;

            const messages = await getMessages(threadId);
            webview.postMessage({ command: "messages", messages });
            break;

          case "newThread":
            const newThreadId = createThreadId();
            state?.update("threadId", newThreadId);
            break;
        }
      },
      undefined,
      this._disposables
    );
  }
}

function generateDiagram(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const mainTfFile = (await workspace.findFiles("**/main.tf"))[0];

    if (!mainTfFile) {
      window.showInformationMessage("No main.tf file found");
      return resolve();
    }

    const mainTfFileUri = mainTfFile.fsPath;

    exec(
      `cat ${mainTfFileUri} | inframap generate --printer dot --hcl --clean=false | awk 'NR==2{print "bgcolor=\\"transparent\\";"}1' | sed 's/height=1.15/height=1.4/g' | dot -Tsvg -Nfontname="Inter" > /tmp/infragen/graph.svg`,
      () => {
        // read svg as text file
        const svgFileContent = readFileSync("/tmp/infragen/graph.svg", "utf8");

        // everywhere there is a xlink:href, convert the image to a data uri
        const fileWithEmbeddedImages = svgFileContent.replace(
          /xlink:href="(.+?)"/g,
          (match, p1) => {
            if (p1.includes("data:image/png;base64")) return match;
            const image = readFileSync(p1);
            const base64 = Buffer.from(image).toString("base64");
            return `xlink:href="data:image/png;base64,${base64}"`;
          }
        );

        // write the svg file back to disk
        writeFile("/tmp/infragen/graph.svg", fileWithEmbeddedImages, (err) => {
          if (err) reject(err);

          const onDiskPath = Uri.joinPath(Uri.file("/tmp/infragen/graph.svg"));
          const webviewUri = HelloWorldPanel.currentPanel?._panel.webview.asWebviewUri(onDiskPath);
          HelloWorldPanel.currentPanel?._panel.webview.postMessage({
            command: "diagram",
            uri: webviewUri!.toString(),
          });

          resolve();
        });
      }
    );
  });
}
