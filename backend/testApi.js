const http = require('http');

http.get('http://localhost:5000/api/resource-hub?projectId=69eda8c34d871d25d526d78b', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
