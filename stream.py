import subprocess
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

os.chdir('/home/baudui/Projects/project/music')

def capture_loop():
    while True:
        try:
            subprocess.run("adb shell screencap -p /sdcard/live.png && adb pull /sdcard/live.png live.jpg", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        time.sleep(0.3)

t = threading.Thread(target=capture_loop, daemon=True)
t.start()

server = HTTPServer(('127.0.0.1', 8999), SimpleHTTPRequestHandler)
print("Live Streamer running at http://127.0.0.1:8999/mirror.html")
server.serve_forever()
