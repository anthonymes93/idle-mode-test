import sys
import time
from pynput import mouse, keyboard
from PyQt6.QtWidgets import QApplication, QLabel
from PyQt6.QtCore import QTimer, Qt

IDLE_LIMIT_SECONDS = 10
last_activity = time.time()

def mark_active(*args):
    global last_activity
    last_activity = time.time()

mouse_listener = mouse.Listener(
    on_move=mark_active,
    on_click=mark_active,
    on_scroll=mark_active
)

keyboard_listener = keyboard.Listener(
    on_press=mark_active
)

mouse_listener.start()
keyboard_listener.start()

app = QApplication(sys.argv)

label = QLabel("WORK MODE")
label.setAlignment(Qt.AlignmentFlag.AlignCenter)
label.resize(500, 250)
label.show()

def set_work():
    label.setText("WORK MODE")
    label.setStyleSheet("""
        background: #111;
        color: lime;
        font-size: 48px;
        font-weight: bold;
    """)

def set_chill():
    label.setText("CHILL MODE")
    label.setStyleSheet("""
        background: #111;
        color: purple;
        font-size: 48px;
        font-weight: bold;
    """)

def update():
    idle_seconds = time.time() - last_activity

    if idle_seconds >= IDLE_LIMIT_SECONDS:
        set_chill()
    else:
        set_work()

timer = QTimer()
timer.timeout.connect(update)
timer.start(500)

set_work()
sys.exit(app.exec())