const axios = require('axios');

async function testMayar() {
  // Use user's API key
  const apiKey = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjU3NmI5YS1jNGQxLTRkNzktODZhOC00YmIyNjZmMjMzZjMiLCJhY2NvdW50SWQiOiI1NTM4MDE5OS03ZWUxLTRiYTQtYTFhNC1lOTk1Yjk0N2MzZGIiLCJjcmVhdGVkQXQiOiIxNzkxMjc0NTMyMzM2Iiwicm9sZSI6ImRldmVsb3BlciIsInNjb3BlIjp7InJlYWQiOnRydWV9LCJzdWIiOiJhcmFmaWFuc3lhaDIwQGdtYWlsLmNvbSIsIm5hbWUiOiJEb2NzbHkiLCJsaW5rIjoiZG9jc2x5IiwiaXNTZWxmRG9tYWluIjpudWxsLCJpYXQiOjE3OTEyNzQ1MzJ9.gqcCQnjzbDaay6UHlHURT80uh6osIfZvLDek0hx_IJWoR46G5GonFyyUiCKBHj2gJrVZTIQGBHyn-XkV_9Tjyarm5Yahxpww1QD5uRzotHbzyb5LH1fRZLCf-c-6dPLHKwG52sW96wOwQVRDsap1yCnpGivmTyTAmhvXinnk_Wxm8K8rBPm3korUWSQXiETT8I8C5tntGn9Gw6z5LONyCinNb0l1wGkcse7v4864bCfxx-tHxxTu3Bhd3SMEDjXwbQ3f0ZFzmHwweRU2OY2iPDbRGSnHZcVxexPI3dnno9A3EIUqgCxZRFokGVslO--TkyyTFQV4Jo-ZGtmo9O9l8Q';
  
  try {
    const response = await axios.post('https://api.mayar.club/hl/v2/qr-codes/create', {
      amount: 79000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

testMayar();
