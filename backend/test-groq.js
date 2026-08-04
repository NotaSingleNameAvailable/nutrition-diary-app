//This is a test file to verify that the GROQ API is working correctly with the provided API key.
//in order to run it you hace to create a .env file in the backend folder with the following content:
//GROQ_API_KEY=your_api_key_here
//then run the file with node test-groq.js (make sure that you are in the backend folder when you run the command)

require('dotenv').config();

async function testGroq() {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'user', content: 'Say hello in one short sentence.' }
      ]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].message.content);
}

testGroq(); 