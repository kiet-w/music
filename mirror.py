import time
import subprocess
import os

html_content = """<!DOCTYPE html>
<html>
<head>
  <title>Live Android Screen</title>
  <style>
    body { background: #09090b; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0; min-height: 100vh; font-family: sans-serif; }
    h2 { margin: 10px 0; font-size: 16px; color: #a1a1aa; }
    img { max-height: 85vh; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); border: 2px solid #27272a; }
  </style>
</head>
<body>
  <h2>📱 Live Screen Mirroring</h2>
  <img id="screen" src="live.jpg" />
  <script>
    const img = document.getElementById('screen');
    setInterval(() => {
      img.src = 'live.jpg?t=' + Date.now();
    }, 250);
  </script>
</body>
</html>
"""

with open('/home/baudui/Projects/project/music/mirror.html', 'w') as f:
    f.write(html_content)

print("Mirror HTML created.")
