const fs = require("fs");
const path = require("path");
const { writeFile } = require("fs").promises;
const { exec } = require("child_process");
const tempDir = path.join(__dirname, "temp");

// Function to run test cases
async function runTestCases(fileContent, testCases) {
  // Ensure testCases is always an array
  if (!Array.isArray(testCases)) {
    testCases = [testCases];
    console.warn("testCases was not an array, converted to array.");
  }

  const decodedFileContent = Buffer.from(fileContent, "base64").toString("utf-8");

  const fileName = `tempFile_${Date.now()}.cpp`; // Adjust extension as needed
  const filePath = path.join(tempDir, fileName);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    await writeFile(filePath, decodedFileContent, "utf-8");
    console.log(`Temporary file saved to: ${filePath}`);
  } catch (error) {
    console.error("Failed to save temporary file:", error);
    return { success: false, error: "Failed to save temporary file!" };
  }

  const fileExtension = path.extname(filePath).slice(1).toLowerCase();
  if (!["py", "cpp"].includes(fileExtension)) {
    return { success: false, error: "Invalid file format!" };
  }

  const results = [];

  for (const testCase of testCases) {
    try {
      const programOutput = await compileAndExecuteCode(filePath, fileExtension, testCase);

      const passed = programOutput.trim() === testCase.output.trim();

      console.log(`Test Case Input: ${testCase.input}`);
      console.log(`Program Output: ${programOutput.trim()}`);
      console.log(`Expected Output: ${testCase.output.trim()}`);
      console.log(`Result: ${passed ? "PASSED" : "FAILED"}`);

      results.push({
        input: testCase.input,
        expectedOutput: testCase.output,
        programOutput: programOutput.trim(),
        passed: passed,
      });
    } catch (error) {
      console.error(`Execution failed for input ${testCase.input}: ${error.message}`);
      console.log(`Result: FAILED`);

      results.push({
        input: testCase.input,
        expectedOutput: testCase.output,
        programOutput: `Error: ${error.message}`,
        passed: false,
      });
    }
  }

  // Cleanup temporary files
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Failed to delete file: ${filePath}`);
  });

  const compiledFilePath = path.join(tempDir, "test_case");
  fs.unlink(compiledFilePath, (err) => {
    if (err) console.error(`Failed to delete compiled file: ${compiledFilePath}`);
  });

  // Return results array after processing all test cases
  return results;
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
    exec(`g++ ${filePath} -o ${path.join(tempDir, "test_case")}`, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`C++ Compilation failed: ${stderr}`));
      } else {
        const childProcess = exec(`${path.join(tempDir, "test_case")}`, (err, stdout, stderr) => {
          if (err) {
            reject(new Error(`Execution failed: ${stderr}`));
          } else {
            resolve(stdout);
          }
        });

        childProcess.stdin.write(testCase.input);
        childProcess.stdin.end();
      }
    });
  });
}

// Function to execute Python code
async function executePythonCode(filePath, testCase) {
  return new Promise((resolve, reject) => {
    const inputFilePath = path.join(tempDir, "input.txt");
    fs.writeFileSync(inputFilePath, testCase.input);

    exec(`python3 ${filePath} < ${inputFilePath}`, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`Python Execution failed: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = runTestCases;
