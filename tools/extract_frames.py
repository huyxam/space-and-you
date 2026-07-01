import cv2
import os
import pathlib

cap = cv2.VideoCapture('public/assets/tiktok.mp4')
if not cap.isOpened():
    raise SystemExit('Cannot open video file')
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
print('frame_count', frame_count, 'fps', fps)
output_dir = pathlib.Path('public/assets/frames')
output_dir.mkdir(parents=True, exist_ok=True)
count = 0
saved = 0
interval = max(1, frame_count // 10 if frame_count > 0 else 1)

while saved < 10:
    ret, frame = cap.read()
    if not ret:
        break
    if count % interval == 0:
        path = output_dir / f'frame_{saved:02d}.jpg'
        cv2.imwrite(str(path), frame)
        print('saved', path)
        saved += 1
    count += 1

cap.release()
