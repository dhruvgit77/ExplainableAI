fetch('http://localhost:8000/api/eda/summary')
  .then(res => res.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend Error:', err.message));
