"""Remove dark manufacturer print from light underlayment (e.g. "ABC").
python3 design/phase-2/retouch_print.py <src> <dst> x0 y0 x1 y1   (region to search, px)"""
import sys, cv2, numpy as np
src, dst = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = map(int, sys.argv[3:7])
img = cv2.imread(src); h, w = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
S, V = hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
band = np.zeros((h, w), np.uint8); band[y0:y1, x0:x1] = 1
light = ((S < 45) & (V > 150) & (band > 0)).astype(np.uint8)
membrane = cv2.morphologyEx(light, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35)))
membrane = cv2.morphologyEx(membrane, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
ink = ((V < 150) & (S < 90) & (membrane > 0)).astype(np.uint8) * 255
ink = cv2.dilate(ink, np.ones((3, 3), np.uint8), iterations=1)
out = cv2.inpaint(img, ink, 4, cv2.INPAINT_TELEA)
cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 90])
print('inked px', int((ink > 0).sum()))
