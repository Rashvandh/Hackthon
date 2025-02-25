document.getElementById('uploadForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const fileInput = document.getElementById('emailInput');
  const file = fileInput.files[0];

  if (!file) {
      alert("Please upload an email file.");
      return;
  }

  const formData = new FormData();
  formData.append("email", file);

  try {
      const response = await fetch('/upload', {
          method: 'POST',
          body: formData
      });

      const resultElement = document.getElementById('result');
      if (response.ok) {
          const data = await response.json();
          resultElement.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
          resultElement.className = 'alert alert-success';
          resultElement.style.display = 'block';
      } else {
          const errorData = await response.json();
          resultElement.textContent = errorData.error || "An error occurred.";
          resultElement.className = 'alert alert-danger';
          resultElement.style.display = 'block';
      }
  } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the file.");
  }
});
