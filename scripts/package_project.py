"""
Package Government Sahayak into a clean, standalone, submission-ready ZIP file.
"""
import os
import zipfile
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\khadh\Downloads\autonomous-data-scientist\autonomous-data-scientist")
OUTPUT_ZIP = Path(r"C:\Users\khadh\Downloads\Government_Sahayak_Complete.zip")

EXCLUDE_DIRS = {
    ".git",
    ".pytest_cache",
    "node_modules",
    "__pycache__",
    "scratch",
    ".idea",
    ".vscode",
}

EXCLUDE_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".tmp",
    ".log",
}

def create_zip():
    print(f"Creating ZIP at: {OUTPUT_ZIP}")
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(SOURCE_DIR):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in EXCLUDE_EXTENSIONS:
                    continue
                
                full_path = Path(root) / f
                rel_path = full_path.relative_to(SOURCE_DIR)
                # Archive under root folder name 'Government_Sahayak'
                arc_name = Path("Government_Sahayak") / rel_path
                zf.write(full_path, arcname=str(arc_name))
                
    size_mb = OUTPUT_ZIP.stat().st_size / (1024 * 1024)
    print(f"Done! File size: {size_mb:.2f} MB")

if __name__ == "__main__":
    create_zip()
