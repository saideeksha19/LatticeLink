import os
import shutil
from pathlib import Path

base_dir = Path(__file__).resolve().parent
public_dir = base_dir / "public"
source_logo = os.getenv("SOURCE_LOGO") or str(base_dir / "latticelink_logo.png")
dest_dir = os.getenv("LOGO_DEST_DIR", str(public_dir))

os.makedirs(dest_dir, exist_ok=True)

try:
    print("Copying latticelink_logo.png...")
    shutil.copy(source_logo, os.path.join(dest_dir, "latticelink_logo.png"))
    print("Success!")
except Exception as e:
    print(f"Error copying files: {e}")

print("Logo setup complete!")
