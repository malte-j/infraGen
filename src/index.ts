import { window, commands, ExtensionContext } from 'vscode'

export function activate(context: ExtensionContext) {
  window.showInformationMessage('lol')

  let disposable = commands.registerCommand('infragen.openAssistant', () => {
		// The code you place here will be executed every time your command is executed


    // open a webview
    const panel = window.createWebviewPanel(
      'infragenAssistant',
      'Infragen Assistant',
      window.activeTextEditor?.viewColumn || 1,
      {
        enableScripts: true
      }
    )

    panel.webview.html = `
      <html>
        <body>
          <h1>Infragen Assistant</h1>
          <p>Some content</p>
        </body>
      </html>
    `
  });

	context.subscriptions.push(disposable);
}

export function deactivate() {

}

