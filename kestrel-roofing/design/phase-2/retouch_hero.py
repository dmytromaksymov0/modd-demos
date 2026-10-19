"""Retouch hero-1: remove printed brand marks ("Summit 60 / Atlas") from the roof underlayment,
tone down HDR saturation. Run: python3 design/phase-2/retouch_hero.py <src> <dst>"""
import sys, cv2, numpy as np
src, dst = sys.argv[1], sys.argv[2]
img = cv2.imread(src)
h, w = img.shape[:2]
hsv0 = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
H, S, V = [hsv0[:, :, i].astype(int) for i in range(3)]
blue = (H >= 98) & (H <= 132)
# Membrane mask by colour: light, low-saturation grey. Closing fills the printed letters,
# so the mask covers membrane + print but never the saturated sky.
band = np.zeros((h, w), np.uint8); band[250:780, 250:1850] = 1
sky = (H >= 92) & (H <= 112) & (S > 105) & (V > 170)
warm = ((H < 35) | (H > 160)) & (S > 50)
grey = (~sky & ~warm & (V > 85) & (band > 0)).astype(np.uint8)
roi = cv2.morphologyEx(grey, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
roi = cv2.morphologyEx(roi, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
roi = cv2.erode(roi, np.ones((7, 7), np.uint8))
roi = roi & ~(sky.astype(np.uint8))  # never touch sky
roi[480:700, 320:450] = 0   # left gable window
roi[690:800, 250:740] = 0   # porch siding below the left gable
cv2.imwrite(dst.replace('.jpg', '-roi.png'), roi * 255)

# Pass 1: inpaint strong print.
mask = (blue & (S > 90) & (V < 190) & (roi > 0)).astype(np.uint8) * 255
mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
out = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)

# Pass 2: neutralise faint print — drop blue saturation, pull value toward local median.
hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
H2, S2, V2 = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
faint = ((H2 >= 98) & (H2 <= 132) & (S2 > 30) & (roi > 0)).astype(np.float32)
faint = cv2.GaussianBlur(faint, (0, 0), 1.2)
medV = cv2.medianBlur(V2.astype(np.uint8), 15).astype(np.float32)
hsv[:, :, 1] = S2 * (1 - 0.8 * faint)
hsv[:, :, 2] = V2 * (1 - 0.7 * faint) + medV * 0.7 * faint

# Global: -13% saturation (HDR look), tiny highlight compression.
hsv[:, :, 1] *= 0.87
hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.98 + 2, 0, 255)
out = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 90])
print('pass1 px', int((mask > 0).sum()))
