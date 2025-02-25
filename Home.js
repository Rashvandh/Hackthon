document.getElementById('uploadForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const fileInput = document.getElementById('emailInput');
  const file = fileInput.files[0];
  if (!file) {
    alert("Please upload an email file.");
    return;
  }

  // For this example, we're using a simple file name check, but you can extend this with better logic.
  let fileName = file.name.toLowerCase();
  let resultText = 'We couldn\'t detect anything suspicious.';
  let resultClass = 'alert-info';

  // Check for suspicious patterns in the file name (this is just an example, you can extend it)
  if (fileName.includes('phishing') || fileName.includes('suspicious')) {
    resultText = 'Phishing attempt detected!';
    resultClass = 'alert-danger';
  } else {
    resultText = 'No phishing indicators found.';
    resultClass = 'alert-success';
  }

  // Show result to the user
  const resultElement = document.getElementById('result');
  resultElement.className = `alert ${resultClass}`;
  resultElement.textContent = resultText;
  resultElement.style.display = 'block';
});
