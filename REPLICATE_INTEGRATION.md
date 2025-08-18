# Replicate.com LLM Integration

This document explains how to set up and use the Replicate.com LLM integration in JOSUDO.

## What is Replicate?

Replicate is a platform that allows you to run open-source AI models in the cloud. It provides access to models like:
- **Llama 3.1 8B** - Fast, efficient language model
- **GPT-5** - OpenAI's latest advanced language model (via Replicate)

## Setup Instructions

### 1. Get Your Replicate API Key

1. Go to [replicate.com](https://replicate.com)
2. Sign up or log in to your account
3. Go to your [Account Settings](https://replicate.com/account)
4. Copy your API token (starts with `r8_`)

### 2. Add Replicate Integration in JOSUDO

1. Open JOSUDO
2. Click on the **Settings** icon (gear icon)
3. Go to **Integrations** tab
4. Find **Replicate** in the AI Models section
5. Click **Connect**
6. Enter your Replicate API key
7. Click **Connect**

### 3. Select Replicate Models

Once connected, you can select from these Replicate models:

- **Llama 3.1 8B** (`llama-3.1-8b`) - Fast, cost-effective
- **GPT-5** (`gpt-5`) - Advanced reasoning and capabilities, higher cost

## Pricing

Replicate offers competitive pricing:
- **Llama 3.1 8B**: $0.0002 per 1K tokens
- **GPT-5**: $0.002 per 1K tokens (estimated)

## Features

✅ **Chat History**: Full conversation context maintained  
✅ **Google Drive Integration**: Conversations saved to your Drive  
✅ **Cost Tracking**: Usage and costs logged automatically  
✅ **Multiple Models**: Switch between different model sizes  
✅ **Secure**: API keys encrypted and stored securely  

## Model Comparison

| Model | Size | Speed | Quality | Cost | Best For |
|-------|------|-------|---------|------|----------|
| Llama 3.1 8B | Small | Fast | Good | Low | General chat, quick responses |
| GPT-5 | Large | Medium | Excellent | High | Advanced reasoning, complex tasks |

## Troubleshooting

### "No Replicate integration found"
- Make sure you've added your Replicate API key in Settings > Integrations
- Check that the integration is marked as "Active"

### "API key not found"
- Verify your API key starts with `r8_`
- Try copying and pasting the key again
- Check your Replicate account for any billing issues

### Slow responses
- Try switching to a smaller model (Llama 3.1 8B instead of GPT-5)
- Check your internet connection
- Replicate models may have varying response times

## Switching Between LLM Providers

You can easily switch between different LLM providers:
- **Replicate**: Open-source models, cost-effective
- **OpenAI**: GPT-4, high quality, higher cost
- **Claude**: Anthropic's models, good reasoning
- **Gemini**: Google's models, balanced performance
- **DeepSeek**: Free tier available

All your existing integrations remain active, so you can switch back and forth as needed.

## Support

If you encounter issues:
1. Check this documentation
2. Verify your API key is correct
3. Check your Replicate account status
4. Contact support if problems persist
