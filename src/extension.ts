import { commands, ExtensionContext } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";

export let extensionContext: ExtensionContext | null = null;

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand("infragen.showPanel", () => {
    HelloWorldPanel.render(context.extensionUri, context.workspaceState);
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);

  extensionContext = context;
}
