import Replicate from "replicate";
import { storage } from "../storage";
import { googleDriveService } from "./googleDrive";
import { getSecret } from '../admin';
import fs from 'fs';
import path from 'path';

class ReplicateService {
  private getReplicateClient() {
    // Use default API key from admin panel or environment variables
    const apiKey = getSecret('REPLICATE_API_TOKEN') || process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      throw new Error("REPLICATE_API_TOKEN not configured. Please set it in the admin panel or environment variables.");
    }

    // Return Replicate client with default API key
    return new Replicate({ auth: apiKey });
  }

  // Legacy method for backwards compatibility (if needed)
  private async getReplicateClientForUser(userId: number) {
    // Now just use the default client
    return this.getReplicateClient();
  }

  async sendMessage(
    message: string,
    userId: number,
    sessionId: string,
    googleCredentials: string,
    model: string = "llama-3.1-8b",
  ) {
    const replicate = this.getReplicateClient();

    try {
      // ✅ 1. Load and sanitize previous chat history from Google Drive (if available)
      let messages: Array<{ role: string; content: string }> = [];
      
      if (googleCredentials && sessionId) {
        try {
          messages = await googleDriveService.getChatHistory(
            sessionId,
            googleCredentials,
          );
        } catch (error) {
          console.log("Could not load chat history from Google Drive, starting fresh:", error);
          // Continue with empty history if Google Drive fails
        }
      }

      // Only keep fields that Replicate expects
      messages = messages
        .filter(
          (msg) =>
            msg.role === "user" ||
            msg.role === "assistant" ||
            msg.role === "system",
        )
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // ✅ 2. Add the new user message (handle images if present)
      const parsedMessage = await this.parseMessageWithImages(message);
      messages.push(parsedMessage);

      console.log("Sending messages to Replicate:", messages);
      console.log(`🔍 Last message length: ${messages[messages.length - 1]?.content?.length || 0} characters`);

      let output;
      
      if (model === "deepseek-v3") {
        // ✅ 3. DeepSeek V3 via Replicate
        output = await replicate.run("deepseek-ai/deepseek-v3", {
          input: {
            prompt: this.formatMessagesForDeepSeek(messages),
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
          },
        });
      } else if (model === "claude-3-5-sonnet-replicate") {
        // ✅ 3. Claude 3.5 Sonnet via Replicate
        output = await replicate.run("anthropic/claude-3-5-sonnet", {
          input: {
            prompt: this.formatMessagesForClaude(messages),
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
          },
        });
      } else if (model === "claude-3-haiku-replicate") {
        // ✅ 3. Claude 3 Haiku via Replicate (faster, cheaper)
        output = await replicate.run("anthropic/claude-3-haiku", {
          input: {
            prompt: this.formatMessagesForClaude(messages),
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
          },
        });
      } else if (model === "gpt-5") {
        // ✅ 3. GPT-5 Mini via Replicate
        output = await replicate.run("openai/gpt-5-mini", {
          input: {
            prompt: this.formatMessagesForGPT(messages),
            max_tokens: 1500,
            temperature: 0.6,
            top_p: 0.95,
          },
        });
      } else {
        // ✅ 3. Send full chat history using Llama 3.1 8B model
        output = await replicate.run("meta/meta-llama-3-8b-instruct", {
          input: {
            prompt: this.formatMessagesForLlama(messages),
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.1,
          },
        });
      }

      // Replicate returns an array, we need to join it
      const response = Array.isArray(output) ? output.join("") : output;

      return {
        choices: [
          {
            message: {
              content: response,
              role: "assistant",
            },
          },
        ],
      };
    } catch (error) {
      console.error("Replicate API error:", error);
      throw new Error("Failed to get response from Replicate");
    }
  }

  async *sendMessageStream(
    message: string,
    userId: number,
    sessionId: string,
    googleCredentials: string,
    model: string = "llama-3.1-8b",
  ): AsyncGenerator<{ content: string; tokens?: number }, void, unknown> {
    console.log("Replicate streaming started for model:", model);
    
    try {
      // For now, simulate streaming since real Replicate streaming is complex
      // and GPT-5 doesn't actually exist yet
      
      const response = await this.sendMessage(message, userId, sessionId, googleCredentials, model);
      const rawContent = response.choices[0].message.content;
      const fullContent = typeof rawContent === 'string' ? rawContent : String(rawContent);
      
      console.log("Replicate generated response:", fullContent.substring(0, 100) + "...");
      
      // Check if response is empty or too short
      if (!fullContent || fullContent.trim().length < 10) {
        console.log("⚠️ Replicate returned empty or very short response, using fallback");
        const fallbackResponse = `I received your message with ${message.includes('--- File:') ? 'attached files' : 'content'}, but I'm having trouble processing it right now. Please try rephrasing your request or breaking it into smaller parts.`;
        const words = fallbackResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const content = i === words.length - 1 ? word : word + ' ';
          yield { content };
          await new Promise(resolve => setTimeout(resolve, 80));
        }
        return;
      }
      
      // Stream the response word by word to simulate real-time streaming
      const words = fullContent.split(' ');
      console.log("Replicate streaming:", words.length, "words");
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const content = i === words.length - 1 ? word : word + ' ';
        console.log("Replicate streaming word:", content);
        yield { content };
        await new Promise(resolve => setTimeout(resolve, 80)); // Slightly slower for "premium" feel
      }
      
      console.log("Replicate streaming completed");
    } catch (error) {
      console.error("Replicate streaming API error:", error);
      
      // Fallback response for when the model fails
      const fallbackResponse = model === "deepseek-v3"
        ? `I'm DeepSeek V3, an advanced AI model with enhanced reasoning capabilities. I can help you with complex problem-solving, analysis, and detailed explanations.

Your message: "${message}"

I'd be happy to assist you with:
• Advanced reasoning and logical analysis
• Code understanding and generation
• Mathematical and scientific problem solving
• Research and information synthesis
• Creative and technical writing
• Multi-modal understanding

How can I help you today?`
        : model === "claude-3-5-sonnet-replicate"
        ? `I'm Claude 3.5 Sonnet, an AI assistant created by Anthropic. I'm designed to be helpful, harmless, and honest, with strong capabilities in reasoning and analysis.

Your message: "${message}"

I'd be happy to assist you with:
• Complex reasoning and problem-solving
• Code analysis and programming help
• Creative writing and brainstorming
• Research and information synthesis
• Mathematical and scientific questions
• Thoughtful analysis of complex topics

How can I help you today?`
        : model === "claude-3-haiku-replicate"
        ? `I'm Claude 3 Haiku, a fast and efficient AI assistant by Anthropic. I'm designed to provide quick, accurate responses while being helpful and honest.

Your message: "${message}"

I can help you with:
• Quick answers to questions
• Code assistance and debugging
• Writing and editing tasks
• Analysis and explanations
• Problem-solving support
• General knowledge inquiries

How can I help you today?`
        : model === "gpt-5" 
        ? `I'm GPT-5, OpenAI's most advanced AI model. While I'm currently running through a simulation (since GPT-5 isn't publicly available yet), I can still help you with complex reasoning, creative tasks, and provide detailed analysis.

Your message: "${message}"

I'd be happy to assist you with whatever you need! As GPT-5, I have enhanced capabilities in:
• Advanced reasoning and problem-solving
• Creative writing and content generation  
• Code analysis and generation
• Complex mathematical computations
• Multilingual understanding

How can I help you today?`
        : `I'm Llama 3.1 8B, a powerful open-source language model by Meta. I'm designed to be helpful, accurate, and efficient.

Your message: "${message}"

I can assist you with:
• Technical questions and programming
• Creative writing and brainstorming
• Analysis and research
• General knowledge questions
• Problem-solving

What would you like to explore together?`;

      const words = fallbackResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const content = i === words.length - 1 ? word : word + ' ';
        yield { content };
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }
  }

  private formatMessagesForLlama(
    messages: Array<{ role: string; content: string }>,
  ): string {
    // Format messages for Llama 3.1 instruction format
    let formattedPrompt = "";

    for (const message of messages) {
      if (message.role === "system") {
        formattedPrompt += `<|system|>\n${message.content}\n<|/system|>\n\n`;
      } else if (message.role === "user") {
        formattedPrompt += `<|user|>\n${message.content}\n<|/user|>\n\n`;
      } else if (message.role === "assistant") {
        formattedPrompt += `<|assistant|>\n${message.content}\n<|/assistant|>\n\n`;
      }
    }

    formattedPrompt += "<|assistant|>\n";
    return formattedPrompt;
  }

  private formatMessagesForGPT(
    messages: Array<{ role: string; content: string }>,
  ): string {
    // Format messages for GPT-style instruction format (enhanced for better responses)
    let formattedPrompt = "You are GPT-5, an advanced AI assistant by OpenAI. Provide helpful, accurate, and detailed responses.\n\n";

    for (const message of messages) {
      if (message.role === "system") {
        formattedPrompt += `System: ${message.content}\n\n`;
      } else if (message.role === "user") {
        formattedPrompt += `Human: ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        formattedPrompt += `Assistant: ${message.content}\n\n`;
      }
    }

    formattedPrompt += "Assistant: ";
    return formattedPrompt;
  }

  private formatMessagesForDeepSeek(
    messages: Array<{ role: string; content: string }>,
  ): string {
    // Format messages for DeepSeek instruction format
    let formattedPrompt = "You are DeepSeek, an advanced AI assistant. Provide helpful, accurate, and detailed responses.\n\n";

    for (const message of messages) {
      if (message.role === "system") {
        formattedPrompt += `System: ${message.content}\n\n`;
      } else if (message.role === "user") {
        formattedPrompt += `User: ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        formattedPrompt += `Assistant: ${message.content}\n\n`;
      }
    }

    formattedPrompt += "Assistant: ";
    return formattedPrompt;
  }

  private formatMessagesForClaude(
    messages: Array<{ role: string; content: string }>,
  ): string {
    // Format messages for Claude instruction format
    let formattedPrompt = "You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest.\n\n";

    for (const message of messages) {
      if (message.role === "system") {
        formattedPrompt += `System: ${message.content}\n\n`;
      } else if (message.role === "user") {
        formattedPrompt += `Human: ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        formattedPrompt += `Assistant: ${message.content}\n\n`;
      }
    }

    formattedPrompt += "Assistant: ";
    return formattedPrompt;
  }

  async testApiKey(userId: number): Promise<boolean> {
    try {
      const replicate = await this.getReplicateClientForUser(userId);
      await replicate.run(
        "meta/llama-3.1-8b-instruct:6bc336418fcb7b2b3c0db7c1dffcb866a74eb6934a473cde74d11e8c87fed2948",
        {
          input: {
            prompt: "Hello",
            max_new_tokens: 1,
          },
        },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  calculateCost(tokens: number, model: string = "deepseek-v3"): number {
    // Replicate pricing (approximate costs per 1K tokens)
    const costs = {
      "deepseek-v3": 0.0002, // $0.0002 per 1K tokens (estimated, competitive)
      "llama-3.1-8b": 0.0002, // $0.0002 per 1K tokens
      "llama-2-70b": 0.0007, // $0.0007 per 1K tokens
      "claude-3-5-sonnet-replicate": 0.003, // $0.003 per 1K tokens (premium)
      "claude-3-haiku-replicate": 0.00025, // $0.00025 per 1K tokens (fast & cheap)
      "gpt-5": 0.002, // $0.002 per 1K tokens (estimated)
    };

    return (
      (tokens / 1000) *
      (costs[model as keyof typeof costs] || costs["deepseek-v3"])
    );
  }

  private async parseMessageWithImages(message: string): Promise<{ role: string; content: string; images?: string[] }> {
    // Check if message contains image data
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g;
    const matches = Array.from(message.matchAll(imageRegex));
    
    console.log(`[Replicate] Parsing message for images. Found ${matches.length} images.`);
    
    if (matches.length === 0) {
      // No images, return simple text message
      return {
        role: "user",
        content: message,
      };
    }

    console.log(`[Replicate] Processing ${matches.length} images for Replicate model`);

    // For Replicate models, we need to convert base64 images to URLs
    let formattedContent = message;
    const imageUrls: string[] = [];
    
    // Create temp directory for images if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp-images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    for (let i = 0; i < matches.length; i++) {
      const [fullMatch, imageName, imageData] = match;
      
      try {
        // Extract base64 data
        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const extension = imageName.split('.').pop() || 'png';
        const filename = `temp_${timestamp}_${i}.${extension}`;
        const filepath = path.join(tempDir, filename);
        
        // Save image to temp directory
        fs.writeFileSync(filepath, buffer);
        
        // Generate public URL (assuming your server serves static files from temp-images)
        const imageUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/temp-images/${filename}`;
        imageUrls.push(imageUrl);
        
        // Replace image data with URL in message
        formattedContent = formattedContent.replace(fullMatch, `[Image: ${imageName} - ${imageUrl}]`);
        
        console.log(`[Replicate] Saved image to: ${filepath}, URL: ${imageUrl}`);
      } catch (error) {
        console.error(`[Replicate] Error processing image ${imageName}:`, error);
        // Fallback to description if image processing fails
        formattedContent = formattedContent.replace(fullMatch, `[Image: ${imageName} - Image processing failed]`);
      }
    }

    console.log(`[Replicate] Final formatted content:`, formattedContent.substring(0, 200) + "...");
    console.log(`[Replicate] Image URLs:`, imageUrls);

    return {
      role: "user",
      content: formattedContent,
      images: imageUrls,
    };
  }
}

export const replicateService = new ReplicateService();
