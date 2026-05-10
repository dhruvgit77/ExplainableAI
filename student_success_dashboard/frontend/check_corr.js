fetch('http://localhost:8000/api/eda/correlation')
  .then(res => res.json())
  .then(data => console.log('Corr OK:', data.matrix[0].slice(0, 5)))
  .catch(err => console.error('Backend Error:', err.message));
