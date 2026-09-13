import glob
import json
import os
import zipfile
from pathlib import Path

base_dir = Path(__file__).resolve().parent
frames_dir = base_dir / "public" / "frames"
zip_path = os.getenv("FRAME_ZIP", "")
dest_dir = os.getenv("FRAME_DEST_DIR", str(frames_dir))

# Ensure destination exists
os.makedirs(dest_dir, exist_ok=True)

# Clear existing frames
existing_files = glob.glob(os.path.join(dest_dir, "*"))
for f in existing_files:
    os.remove(f)

print(f"Extracting {zip_path or 'default archive'}...")

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Extract files to a temporary directory first (or memory)
        files = zip_ref.namelist()
        files = [f for f in files if f.endswith('.jpg') or f.endswith('.png')]
        files.sort() # Sort alphabetically to maintain order
        
        for i, file_name in enumerate(files):
            # Extract the specific file
            zip_ref.extract(file_name, dest_dir)
            # Rename it to frame_1.jpg, frame_2.jpg, etc.
            old_path = os.path.join(dest_dir, file_name)
            new_path = os.path.join(dest_dir, f"frame_{i+1}.jpg")
            if os.path.exists(new_path):
                os.remove(new_path)
            os.rename(old_path, new_path)
            
        print(f"Successfully extracted and renamed {len(files)} frames to {dest_dir}")
        
        # Write metadata.json for the React component
        with open(os.path.join(dest_dir, "metadata.json"), "w") as f:
            json.dump({"frameCount": len(files)}, f)
        
except Exception as e:
    print(f"Error extracting zip: {e}")
