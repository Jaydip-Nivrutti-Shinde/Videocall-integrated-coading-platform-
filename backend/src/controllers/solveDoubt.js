// const { GoogleGenAI } = require("@google/genai");

// const solveDoubt = async (req, res) => {
//     try {
//         const { messages, title, description, testCases, startCode } = req.body;

//         // ✅ Validate input
//         if (!messages) {
//             return res.status(400).json({ message: "Messages are required" });
//         }

//         const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

//         // ✅ Convert messages array to a single string input (Interactions API expects string or proper format)
//         const inputText = Array.isArray(messages)
//             ? messages.map(m => `${m.role}: ${m.content}`).join("\n")
//             : messages;

//         // ✅ Correct API call
//         const response = await ai.interactions.create({
//             model: "gemini-3.8-flash", 
//             input: inputText,
//             system_instruction: `
// You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

// ## CURRENT PROBLEM CONTEXT:
// [PROBLEM_TITLE]: ${title}
// [PROBLEM_DESCRIPTION]: ${description}
// [EXAMPLES]: ${testCases}
// [startCode]: ${startCode}

// ## YOUR CAPABILITIES:
// 1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
// 2. **Code Reviewer**: Debug and fix code submissions with explanations
// 3. **Solution Guide**: Provide optimal solutions with detailed explanations
// 4. **Complexity Analyzer**: Explain time and space complexity trade-offs
// 5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)
// 6. **Test Case Helper**: Help create additional test cases for edge case validation

// ## INTERACTION GUIDELINES:

// ### When user asks for HINTS:
// - Break down the problem into smaller sub-problems
// - Ask guiding questions to help them think through the solution
// - Provide algorithmic intuition without giving away the complete approach
// - Suggest relevant data structures or techniques to consider

// ### When user submits CODE for review:
// - Identify bugs and logic errors with clear explanations
// - Suggest improvements for readability and efficiency
// - Explain why certain approaches work or don't work
// - Provide corrected code with line-by-line explanations when needed

// ### When user asks for OPTIMAL SOLUTION:
// - Start with a brief approach explanation
// - Provide clean, well-commented code
// - Explain the algorithm step-by-step
// - Include time and space complexity analysis
// - Mention alternative approaches if applicable

// ### When user asks for DIFFERENT APPROACHES:
// - List multiple solution strategies (if applicable)
// - Compare trade-offs between approaches
// - Explain when to use each approach
// - Provide complexity analysis for each

// ## RESPONSE FORMAT:
// - Use clear, concise explanations
// - Format code with proper syntax highlighting
// - Use examples to illustrate concepts
// - Break complex explanations into digestible parts
// - Always relate back to the current problem context
// - Always respond in the Language in which user is comfortable or given the context

// ## STRICT LIMITATIONS:
// - ONLY discuss topics related to the current DSA problem
// - DO NOT help with non-DSA topics (web development, databases, etc.)
// - DO NOT provide solutions to different problems
// - If asked about unrelated topics, politely redirect: "I can only help with the current DSA problem. What specific aspect of this problem would you like assistance with?"

// ## TEACHING PHILOSOPHY:
// - Encourage understanding over memorization
// - Guide users to discover solutions rather than just providing answers
// - Explain the "why" behind algorithmic choices
// - Help build problem-solving intuition
// - Promote best coding practices

// Remember: Your goal is to help users learn and understand DSA concepts through the lens of the current problem, not just to provide quick answers.
//             `
//         });

//         // ✅ Debug: log full response structure (remove in production)
//         console.log("FULL RESPONSE:", JSON.stringify(response, null, 2));

//         // ✅ Extract text safely from Interactions API response
//         let answer = "";

//         // Method 1: Try steps → model_output → content[].text
//         if (response?.steps && Array.isArray(response.steps)) {
//             for (const step of response.steps) {
//                 if (step.type === "model_output" && Array.isArray(step.content)) {
//                     for (const block of step.content) {
//                         if (block.type === "text" && block.text) {
//                             answer += block.text;
//                         }
//                     }
//                 }
//             }
//         }

//         // Method 2: Fallback — some SDK versions expose outputs directly
//         if (!answer && response?.outputs && Array.isArray(response.outputs)) {
//             for (const out of response.outputs) {
//                 if (out.text) answer += out.text;
//             }
//         }

//         // Method 3: Fallback — direct text property (older/newer SDK variants)
//         if (!answer && typeof response?.text === "string") {
//             answer = response.text;
//         }

//         // ✅ Final guard
//         if (!answer) {
//             return res.status(500).json({
//                 message: "AI returned an empty response",
//                 debug: response // remove this in production
//             });
//         }

//         return res.status(201).json({ message: answer });

//     } catch (err) {
//         console.error("solveDoubt error:", err);
//         return res.status(500).json({
//             message: "Internal server error",
//             details: err.message
//         });
//     }
// };

// module.exports = solveDoubt;


const { GoogleGenAI } = require("@google/genai");

const solveDoubt = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: "Messages array is required" });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

        // ✅ FIX: Handle both {parts:[{text}]} and {content} formats
        const conversationText = messages
            .map(m => {
                const text = m.parts?.[0]?.text || m.content || "";
                return `${m.role}: ${text}`;
            })
            .join("\n");

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: conversationText,
            config: {
                systemInstruction: ` You are an expert DSA tutor. Help ONLY with the current problem.
                ## PROBLEM CONTEXT
                Title: ${title}
                Description: ${description}
                Test Cases: ${JSON.stringify(testCases)}
                Starter Code: ${startCode}
                ## RULES
                - Only discuss this DSA problem
                - Be concise and use markdown formatting
                - Use code blocks with language tags
                - Use bullet points and headers for clarity
                - If user asks for hints → guide, don't give full answer
                - If user asks for solution → give clean code + complexity
                - Reply in the user's preferred language
                                `
                            }
                        });

        const answer = response.text; // ✅ generateContent me yeh kaam karta hai

        if (!answer) {
            return res.status(500).json({ message: "Empty AI response" });
        }

        return res.status(200).json({ message: answer });

    } catch (err) {
        console.error("solveDoubt error:", err);
        return res.status(500).json({
            message: "Internal server error",
            details: err.message
        });
    }
};

module.exports = solveDoubt;