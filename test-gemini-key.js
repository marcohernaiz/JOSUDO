// Test script to verify your Gemini API key
// Usage: node test-gemini-key.js YOUR_API_KEY

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Please provide your API key as an argument:');
  console.error('   node test-gemini-key.js YOUR_API_KEY');
  process.exit(1);
}

const trimmedKey = apiKey.trim();

console.log('🔍 Testing Gemini API Key...');
console.log(`   Key length: ${trimmedKey.length} characters`);
console.log(`   Key preview: ${trimmedKey.substring(0, 10)}...`);
console.log('');

// Test 1: Check key format
if (!trimmedKey.startsWith('AIza')) {
  console.error('❌ Invalid key format! Gemini API keys should start with "AIza"');
  console.error('   Make sure you\'re using a Google AI Studio API key from:');
  console.error('   https://aistudio.google.com/app/apikey');
  process.exit(1);
}

console.log('✅ Key format looks correct (starts with AIza)');
console.log('');

// Test 2: List available models
console.log('📡 Testing API connection...');
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`)
  .then(async (response) => {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API test failed!`);
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}`);
      
      if (response.status === 400) {
        console.error('');
        console.error('💡 Possible issues:');
        console.error('   - Invalid API key');
        console.error('   - API key not activated');
        console.error('   - Wrong key type (make sure it\'s from Google AI Studio, not Vertex AI)');
      } else if (response.status === 403) {
        console.error('');
        console.error('💡 Possible issues:');
        console.error('   - API key restrictions enabled');
        console.error('   - Billing not enabled');
        console.error('   - API not enabled in Google Cloud Console');
      }
      process.exit(1);
    }
    
    const data = await response.json();
    console.log(`✅ API connection successful!`);
    console.log(`   Found ${data.models?.length || 0} available models`);
    console.log('');
    
    // Show available Gemini models
    if (data.models && data.models.length > 0) {
      console.log('📋 Available Gemini models:');
      const geminiModels = data.models
        .filter(m => m.name && m.name.includes('gemini'))
        .map(m => m.name.replace('models/', ''))
        .slice(0, 10);
      
      geminiModels.forEach(model => {
        console.log(`   - ${model}`);
      });
      console.log('');
    }
    
    // Test 3: Try generating content
    console.log('🧪 Testing content generation...');
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${trimmedKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say "Hello" if you can read this.'
          }]
        }]
      })
    });
  })
  .then(async (response) => {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Content generation test failed!`);
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}`);
      process.exit(1);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    console.log(`✅ Content generation successful!`);
    console.log(`   Response: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log('');
    console.log('🎉 Your API key is valid and working!');
    console.log('');
    console.log('💡 If you still get errors in the app, check:');
    console.log('   1. Make sure there are no extra spaces in the key');
    console.log('   2. Try copying the key again from Google AI Studio');
    console.log('   3. Check server logs for detailed error messages');
  })
  .catch((error) => {
    console.error(`❌ Network error:`, error.message);
    console.error('');
    console.error('💡 Check your internet connection and try again');
    process.exit(1);
  });




