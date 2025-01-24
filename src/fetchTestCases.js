const axios = require("axios"); // Import Axios

// This function fetches the test cases for a given LeetCode problem URL
async function fetchTestCases(problemUrl) {
  try {
    // Extract the problem slug from the URL (e.g., "two-sum" from "https://leetcode.com/problems/two-sum/")
    const problemSlug = problemUrl.split("/").filter(Boolean).pop();

    // GraphQL query
    const query = `
        query getProblemDetails($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                title
                content
                codeSnippets {
                    lang
                    code
                }
            }
        }`;

    // API endpoint
    const endpoint = "https://leetcode.com/graphql/";

    // Send request with authentication headers
    const response = await axios.post(
      endpoint,
      {
        query,
        variables: { titleSlug: problemSlug },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract content and parse test cases
    const content = response.data.data.question.content;
    const testCases = extractTestCasesFromContent(content);

    if (testCases.length > 0) {
      return testCases;
    } else {
      console.log("No test cases found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching test cases:", error);
    return [];
  }
}

const chalk = require("chalk"); // Import chalk for colored text

function extractTestCasesFromContent(content) {
  // Updated regex to capture Input and Output directly from <pre> tags
  const inputOutputRegex =
    /<pre>\s*<strong>Input:<\/strong>\s*(.*?)\s*<strong>Output:<\/strong>\s*([\s\S]*?)(?=<strong>Explanation:<\/strong>|<\/pre>)/gs;

  // Match all occurrences of inputs and outputs
  const matches = [...content.matchAll(inputOutputRegex)];

  // Map matches to extract inputs and outputs
  return matches.map((match) => ({
    input: match[1]
      .trim()
      .replace(/&quot;/g, '"') // Replace HTML entities with actual quotes
      .replace(/^\s*|\s*$/g, ""), // Trim leading and trailing whitespace
    output: match[2]
      .trim()
      .replace(/&quot;/g, '"') // Replace HTML entities with actual quotes
      .replace(/^\s*|\s*$/g, ""), // Trim leading and trailing whitespace
  }));
}

// Function to display test cases with formatting
function displayTestCases(testCases) {
  testCases.forEach((testCase) => {
    console.log(chalk.blue.bold("input:") + " " + chalk.white(testCase.input));
    console.log(chalk.green.bold("output:") + " " + chalk.white(testCase.output));
    console.log(); // Add a blank line between test cases
  });
}

// Example usage
const content = `
<pre>
<strong>format will be like this</strong>
<strong>Input:</strong> 
<strong>Output:</strong> 
</pre>
`;

const testCases = extractTestCasesFromContent(content);
displayTestCases(testCases);


module.exports = fetchTestCases;
