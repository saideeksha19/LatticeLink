import os
import shutil
from pathlib import Path

base_dir = Path(__file__).resolve().parent
public_dir = base_dir / "public"

source_earth = os.getenv("SOURCE_EARTH") or str(base_dir / "holographic_earth.png")
source_cubes = os.getenv("SOURCE_CUBES") or str(base_dir / "quantum_cubes.png")
dest_dir = os.getenv("ASSET_DEST_DIR", str(public_dir))

# Ensure public directory exists
os.makedirs(dest_dir, exist_ok=True)

try:
    print("Copying holographic_earth.png...")
    shutil.copy(source_earth, os.path.join(dest_dir, "holographic_earth.png"))
    print("Success!")

    print("Copying quantum_cubes.png...")
    shutil.copy(source_cubes, os.path.join(dest_dir, "quantum_cubes.png"))
    print("Success!")
except Exception as e:
    print(f"Error copying files: {e}")

print("Assets setup complete. Your React app should now show the new generated images!")
