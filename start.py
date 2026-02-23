import subprocess
import sys
import os
import signal

def start_servers():
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    # Path to Backend and Frontend
    backend_dir = os.path.join(project_root, "backend")
    frontend_dir = os.path.join(project_root, "frontend")
    venv_python = os.path.join(backend_dir, "venv", "bin", "python3")

    print("🚀 Starting TradeJournal Project...")

    # 1. Start Backend
    backend_process = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8000"],
        cwd=project_root
    )
    print("✅ Backend started on http://127.0.0.1:8000")

    # 2. Start Frontend
    frontend_process = subprocess.Popen(
        ["yarn", "dev"],
        cwd=frontend_dir
    )
    print("✅ Frontend started on http://127.0.0.1:5173")

    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_servers()
