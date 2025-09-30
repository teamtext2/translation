import { Groq } from "groq-sdk";
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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"
});

async function main() {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Xin chào, test API Groq nè!"
      }
    ],
    model: "meta-llama/llama-guard-4-12b",
    temperature: 1,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null
  });

  for await (const chunk of chatCompletion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main().catch(err => console.error(err));
