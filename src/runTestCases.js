const fs = require("fs");
const path = require("path");
const { writeFile } = require("fs").promises; // For saving the decoded file temporarily
const { exec } = require("child_process"); // For running shell commands
const tempDir = path.join(__dirname, "temp"); // Directory to save the temporary file

// Function to run individual test cases
async function runTestCases(fileContent, testCase) {
  // Ensure the file content is base64, decode it to get the actual file content
  const decodedFileContent = Buffer.from(fileContent, "base64").toString(
    "utf-8"
  );

  // Generate a temporary file path (in the temp directory)
  const fileName = `tempFile_${Date.now()}.cpp`; // Adjust extension based on the file type (e.g., .py, .cpp)
  const filePath = path.join(tempDir, fileName);

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Write the decoded content to the temporary file
  try {
    await writeFile(filePath, decodedFileContent, "utf-8");
    console.log(`Temporary file saved to: ${filePath}`);
  } catch (error) {
    console.error("Failed to save temporary file:", error);
    return { success: false, error: "Failed to save temporary file!" };
  }

  // Validate the file extension (after saving)
  const fileExtension = path.extname(filePath).slice(1).toLowerCase();
  if (!["py", "cpp"].includes(fileExtension)) {
    console.log(
      "Invalid file format! Please provide a Python (.py) or C++ (.cpp) file."
    );
    return { success: false, error: "Invalid file format!" };
  }

  // Compile and execute based on the language
  try {
    const result = await compileAndExecuteCode(
      filePath,
      fileExtension,
      testCase
    );
    console.log(result);
    return { success: true, result: result };
  } catch (error) {
    console.log(`Execution failed:\n${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to compile and execute code based on language
async function compileAndExecuteCode(filePath, extension, testCase) {
  if (extension === "cpp") {
    return await compileAndExecuteCpp(filePath, testCase);
  } else if (extension === "py") {
    return await executePythonCode(filePath, testCase);
  } else {
    throw new Error("Unsupported file extension for execution.");
  }
}

// Function to compile and execute C++ code
async function compileAndExecuteCpp(filePath, testCase) {
  return new Promise((resolve, reject) => {
    // Compile the C++ code
    exec(
      `g++ ${filePath} -o ${path.join(tempDir, "test_case")}`,
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`C++ Compilation failed: ${stderr}`));
        } else {
          // Execute the compiled code
          console.log(`Executing C++ code...`);
          const childProcess = exec(
            `${path.join(tempDir, "test_case")}`,
            (err, stdout, stderr) => {
              if (err) {
                reject(new Error(`Execution failed: ${stderr}`));
              } else {
                // Compare the program output with the expected output
                console.log(`Program output: ${stdout}`);
                console.log(`Expected output: ${testCase.output}`);
                if (stdout.trim() === testCase.output.trim()) {
                  resolve("Test case passed!");
                } else {
                  reject(
                    new Error(
                      `Test case failed. Expected: ${
                        testCase.output
                      }, Got: ${stdout.trim()}`
                    )
                  );
                }
              }
            }
          );

          // Write the test case input directly to stdin
          childProcess.stdin.write(testCase.input);
          childProcess.stdin.end();

          // Debugging: Log the child process details
          console.log(`Child process details:`, childProcess);
        }
      }
    );
  });
}

// Function to execute Python code
async function executePythonCode(filePath, testCase) {
  return new Promise((resolve, reject) => {
    // Create the input file based on the test case input
    const inputFilePath = path.join(tempDir, "input.txt");
    fs.writeFileSync(inputFilePath, testCase.input); // Write the input for the Python code

    // Execute the Python code and pass the input file to it
    exec(`python3 ${filePath} < ${inputFilePath}`, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`Python Execution failed: ${stderr}`));
      } else {
        // Compare the program output with the expected output
        if (stdout.trim() === testCase.expectedOutput.trim()) {
          resolve("Test case passed!");
        } else {
          reject(
            new Error(
              `Test case failed. Expected: ${
                testCase.expectedOutput
              }, Got: ${stdout.trim()}`
            )
          );
        }
      }
    });
  });
}

module.exports = runTestCases;
