const aiService = require('./src/services/ai.service');

async function testAIService() {
  console.log('Testing AI Service...\n');

  // Test 1: Health check
  console.log('1. Testing health check...');

  const health = await aiService.healthCheck();

  console.log(JSON.stringify(health, null, 2));

  // Test 2: Readiness check
  console.log('\n2. Testing readiness check...');

  const ready = await aiService.readinessCheck();

  console.log(JSON.stringify(ready, null, 2));

  // Test 3: Model information
  console.log('\n3. Testing model info...');

  try {
    const modelInfo = await aiService.getModelInfo();

    console.log(JSON.stringify(modelInfo, null, 2));
  } catch (error) {
    console.error('Model info error:', error.message);
  }

  console.log('\nAI Service tests completed.');
}

testAIService().catch((error) => {
  console.error('Test failed:', error);
});