import json
import os
import shutil
from pathlib import Path

import cv2

base_dir = Path(__file__).resolve().parent
frames_dir = base_dir / "public" / "frames"
video_path = os.getenv("VIDEO_PATH", "")
dest_dir = os.getenv("FRAME_DEST_DIR", str(frames_dir))

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)
os.makedirs(dest_dir, exist_ok=True)

print(f"Extracting frames from {video_path}...")

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print(f"Error: Could not open video {video_path}")
    exit(1)

frame_count = 0
# To prevent excessive browser memory usage, let's extract every Nth frame if the video is very long/high fps.
# Assuming standard 30fps video, extracting every frame might yield thousands of images.
# Let's extract 1 out of every 2 frames for performance, but for this cinematic prompt, let's just do every frame up to a limit or if it's a short video, every frame.
skip_frames = 1 # Extract every frame
current_frame = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
        
    if current_frame % skip_frames == 0:
        # Save frame
        frame_count += 1
        dst_name = f"frame_{frame_count}.jpg"
        dst_path = os.path.join(dest_dir, dst_name)
        
        # cv2 saves in BGR by default, but write functions handle BGR correctly for jpg.
        cv2.imwrite(dst_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        
        if frame_count % 50 == 0:
            print(f"Extracted {frame_count} frames...")
            
    current_frame += 1

cap.release()

# Write metadata
metadata = {
    "frameCount": frame_count
}
with open(os.path.join(dest_dir, "metadata.json"), "w") as f:
    json.dump(metadata, f)

print(f"Done! {frame_count} frames saved to {dest_dir}.")
