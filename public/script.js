// Initialize CodeMirror
var sentCodeEditor = CodeMirror.fromTextArea(document.getElementById("sentCode"), {
    mode: "text/x-c++src",
    lineNumbers: true,
    theme: "dracula", // dark theme
});

// var receivedCodeEditor = CodeMirror.fromTextArea(document.getElementById("receivedCode"), {
//     mode: "text/x-c++src",
//     lineNumbers: true,
//     theme: "dracula", // dark theme
// });

function copyCode(codeMirrorInstance, button) {
    var code = codeMirrorInstance.getValue();

    var tempTextarea = document.createElement("textarea");
    tempTextarea.value = code;
    document.body.appendChild(tempTextarea);

    tempTextarea.select();
    tempTextarea.setSelectionRange(0, 99999); // For mobile devices

    document.execCommand('copy');

    document.body.removeChild(tempTextarea);

    // Show the message popup
    var originalText = button.innerText;
    button.innerText = 'Copied!';
    setTimeout(function () {
        button.innerText = originalText;
    }, 500);
}
function openChat(index) {
    var textarea = document.getElementById(index);
  textarea.select();

  // Set the value of sentCodeEditor to the selected text
  sentCodeEditor.setValue(textarea.value);
}










function openShareModal() {
    document.getElementById('shareModal').style.display = 'inline-block';
}
function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}
async function submitShareHandle(button) {
    const shareHandle = document.getElementById('shareHandle').value;
    const shareCode = sentCodeEditor.getValue();
    console.log(shareHandle);
    console.log(shareCode);
    // Make a POST request to the root (or your desired endpoint)
    const response = await fetch('/user/' + shareHandle, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: shareHandle, code: shareCode }),
    });

    if (response.ok) {
        document.getElementById('shareHandle').value = "";
        button.innerText = 'Sent!';
        setTimeout(function () {
            button.innerText = 'Submit';
            closeShareModal();
        }, 1000);
    } else {
        button.innerText = 'Not found!';
        setTimeout(function () {
            button.innerText = 'Submit';
        }, 1000);
    }
}

function handleDeleteClick(index, username) {
    console.log(index, username);
    // Make an HTTP request to post the index and username to the root
    fetch('/deleteCode/'+username, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ index: index, username: username }),
    })
      .then(response => response.json())
      .then(data => {
        // Handle the response as needed
        console.log(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }