const runTestCases = require("./src/runTestCases");
const fetchTestCases = require("./src/fetchTestCases");
const vscode = require("vscode");

// This method is called when your extension is activated
function activate(context) {
  // Command to open the Webview panel
  const openWebviewCommand = vscode.commands.registerCommand(
    "cph-leet.openWebview",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "leetTestCasesPanel",
        "LeetCode Test Cases Viewer",
        vscode.ViewColumn.One,
        { enableScripts: true, localResourceRoots: [context.extensionUri] }
      );
      
      const provider = new TestCasesViewProvider(context.extensionUri);
      panel.webview.html = provider.getWebviewContent();

      // Listening for messages from the webview
      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "fetchTestCases") {
          fetchTestCases(message.url)
            .then((testCases) => {
              panel.webview.postMessage({
                command: "displayTestCases",
                testCases: testCases,
              });
            })
            .catch(() => {
              panel.webview.postMessage({
                command: "showError",
                message: "Unable to fetch test cases. Please check the URL.",
              });
            });
        } else if (message.command === "runTestCases") {
          const testCases = message.testCases;
          const results = [];

          for (const testCase of testCases) {
            const result = await runTestCases(message.fileContent, testCase);
            results.push({ testCase, result });
          }

          panel.webview.postMessage({
            command: "displayRunResults",
            results: results,
          });
        }
      });
    }
  );
  
  context.subscriptions.push(openWebviewCommand);

  // Command to fetch test cases
  const fetchCommand = vscode.commands.registerCommand(
    "cph-leet.fetchTestCases",
    async (url) => {
      if (!url) {
        url = await vscode.window.showInputBox({
          prompt: "Enter the LeetCode problem URL to fetch test cases",
          placeHolder: "https://leetcode.com/problems/example",
        });
      }

      if (url) {
        const testCases = await fetchTestCases(url);
        testCasesProvider.setTestCases(testCases);
      }
    }
  );

  // Command to run test cases
  const runCommand = vscode.commands.registerCommand(
    "cph-leet.runTestCases",
    async (testCases) => {
      if (!testCases || testCases.length === 0) {
        vscode.window.showErrorMessage("No test cases available to run!");
        return;
      }

      const options = {
        canSelectMany: false,
        openLabel: "Select Your Solution File",
        filters: {
          "Supported Files": ["py", "cpp"],
        },
      };

      const uri = await vscode.window.showOpenDialog(options);

      if (!uri || uri.length === 0) {
        vscode.window.showErrorMessage("No file selected.");
        return;
      }

      const fs = require("fs");
      const filePath = uri[0].fsPath;
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const fileExtension = filePath.split(".").pop();

      if (!["py", "cpp"].includes(fileExtension)) {
        vscode.window.showErrorMessage(
          "Unsupported file format. Please select a Python (.py) or C++ (.cpp) file."
        );
        return;
      }

      try {
        const results = await runTestCases(fileContent, fileExtension, testCases);
        vscode.window.showInformationMessage(
          `Test cases executed successfully. Results:\n${results}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Execution failed. Error:\n${error.message}`
        );
      }
    }
  );

  context.subscriptions.push(fetchCommand, runCommand);

  // Tree View for displaying test cases
  const testCasesProvider = new TestCasesTreeProvider();
  context.subscriptions.push(
    vscode.window.createTreeView("testCasesExplorer", {
      treeDataProvider: testCasesProvider,
    })
  );
}

// Tree Data Provider for displaying test cases in the Explorer
class TestCasesTreeProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.testCases = [];
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (!element) {
      return [
        new vscode.TreeItem(
          "Test Cases",
          vscode.TreeItemCollapsibleState.Collapsed
        ),
      ];
    }
    return this.testCases.map((testCase) => {
      const treeItem = new vscode.TreeItem(
        testCase.name,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.command = {
        command: "cph-leet.runTestCases",
        title: "Run Test Case",
        arguments: [testCase],
      };
      return treeItem;
    });
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  setTestCases(testCases) {
    this.testCases = testCases;
    this.refresh();
  }
}

// Webview Provider for the Test Cases Viewer
class TestCasesViewProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LeetCode Test Cases</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                h2 {
                    color: #0056b3;
                    font-size: 1.8rem;
                    margin-bottom: 10px;
                }
                p {
                    font-size: 1rem;
                    color: #555;
                    margin-bottom: 20px;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 20px;
                    box-sizing: border-box;
                    font-size: 1rem;
                    border: 1px solid #ced4da;
                    border-radius: 5px;
                }
                button {
                    background-color: #007bff;
                    color: white;
                    padding: 10px 20px;
                    font-size: 1rem;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 10px;
                }
                button:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }
                button:hover:not(:disabled) {
                    background-color: #0056b3;
                }
                .test-cases {
                    margin-top: 30px;
                }
                .test-case {
                    background-color: #ffffff;
                    border: 1px solid #dee2e6;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .label {
                    font-weight: bold;
                    color: #007bff;
                    font-size: 1.2rem;
                }
                .value {
                    color:rgb(40, 167, 69);
                    font-weight: normal;
                    word-spacing: 0.2rem;
                    font-size: 1.0rem;
                }
                .separator {
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <h2>LeetCode Test Cases</h2>
            <p>Enter the LeetCode problem URL to fetch test cases.</p>
            <input type="text" id="urlInput" placeholder="https://leetcode.com/problems/example">
            <button id="fetchButton">Fetch Test Cases</button>
            <button id="runButton" disabled>Run Test Cases</button>
            
            <div class="test-cases" id="testCasesContainer"></div>
            
<script>
    const vscode = acquireVsCodeApi();
    let fetchedTestCases = null; // To store fetched test cases

    // Fetch Test Cases
    document.getElementById('fetchButton').addEventListener('click', () => {
        const url = document.getElementById('urlInput').value;
        if (url) {
            vscode.postMessage({
                command: 'fetchTestCases',
                url: url
            });
        } else {
            vscode.postMessage({ command: 'showError', message: 'Please provide a valid URL!' });
        }
    });

    // Run Test Cases button click
    document.getElementById('runButton').addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.py,.cpp';

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onloadend = () => {
                    const fileContent = reader.result.split(',')[1];

                    if (fetchedTestCases && fetchedTestCases.length > 0 && fileContent) {
                        vscode.postMessage({
                            command: 'runTestCases',
                            fileContent: fileContent,
                            testCases: fetchedTestCases
                        });
                    } else {
                        alert('No test cases to run or file content is missing. Please fetch test cases and select a file first.');
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        fileInput.click();
    });

    // Listen for messages from the extension
    window.addEventListener('message', (event) => {
        const message = event.data;

        if (message.command === 'displayTestCases') {
            const testCases = message.testCases;
            fetchedTestCases = testCases;
            const container = document.getElementById('testCasesContainer');
            container.innerHTML = '';

            if (testCases && testCases.length > 0) {
                testCases.forEach((testCase, index) => {
                    const div = document.createElement('div');
                    div.className = 'test-case';

                    const inputLabel = document.createElement('span');
                    inputLabel.className = 'label';
                    inputLabel.textContent = 'input: ';

                    const inputValue = document.createElement('span');
                    inputValue.className = 'value';
                    inputValue.textContent = testCase.input;

                    const outputLabel = document.createElement('span');
                    outputLabel.className = 'label';
                    outputLabel.textContent = 'output: ';

                    const outputValue = document.createElement('span');
                    outputValue.className = 'value';
                    outputValue.textContent = testCase.output;

                    const separator = document.createElement('div');
                    separator.className = 'separator';

                    div.appendChild(inputLabel);
                    div.appendChild(inputValue);
                    div.appendChild(document.createElement('br'));
                    div.appendChild(outputLabel);
                    div.appendChild(outputValue);
                    div.appendChild(separator);

                    container.appendChild(div);
                });

                document.getElementById('runButton').disabled = false;
            } else {
                container.innerHTML = '<p>No test cases found.</p>';
                document.getElementById('runButton').disabled = true;
            }
        }

        if (message.command === 'showError') {
            alert(message.message);
        }
    });
</script>

        </body>
        </html>
    `;
}

}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
