import axios from "axios";

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export async function getClaudeResponse(prompt: string) {
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/complete", // Claude endpoint
      {
        model: "claude-2", // or whatever model you have access to
        prompt: prompt,
        max_tokens_to_sample: 150,
        stop_sequences: ["\n\nHuman:"],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": CLAUDE_API_KEY,
        },
      }
    );

    // Claude responds in response.data.completion
    return response.data.completion;
  } catch (err) {
    console.error("Claude API error:", err);
    return "No challenges available right now!";
  }
}
