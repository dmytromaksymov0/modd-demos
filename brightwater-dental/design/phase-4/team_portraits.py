"""Unify the three doctor portraits: same head-and-shoulders crop (4:5), eyes on one line,
same face size, one colour grade. Run from the site folder: python3 design/phase-4/team_portraits.py"""
import cv2, numpy as np
from PIL import Image

SRC = 'src/assets/photos/'
people = {'ruiz': 'team-dr-1.jpg', 'holloway': 'team-dr-2.jpg', 'kessler': 'team-dr-3.jpg'}
W, H = 1600, 2000            # output 4:5
FACE_H = 0.34                # face box height as share of frame height
EYE_Y = 0.34                 # eye line on the upper third




# Face boxes measured by hand on the originals (Haar misfires on glasses / three-quarter poses):
# (eye-line y, face height forehead→chin, face centre x) in source pixels.
faces = {'ruiz': (750, 770, 1290), 'holloway': (1870, 430, 1260), 'kessler': (740, 600, 1430)}
crops = {}
for k, f in people.items():
    img = cv2.imread(SRC + f)
    if k == 'ruiz':  # paint out the scrubs brand mark on the left sleeve
        mask = np.zeros(img.shape[:2], np.uint8); cv2.rectangle(mask, (1770, 2140), (1910, 2290), 255, -1)
        img = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
    eye_y, fh, cx = faces[k]
    scale = (FACE_H * H) / fh
    cw, ch = W / scale, H / scale
    left = min(max(cx - cw / 2, 0), img.shape[1] - cw); top = min(max(eye_y - EYE_Y * ch, 0), img.shape[0] - ch)
    c = img[int(top):int(top + ch), int(left):int(left + cw)]
    crops[k] = cv2.resize(c, (W, H), interpolation=cv2.INTER_CUBIC if cw < W else cv2.INTER_AREA)
    print(k, 'crop', int(left), int(top), int(cw), int(ch), 'eyes at', round((eye_y - top) / ch, 3))

# One grade: move each image's LAB statistics halfway to the group mean (Reinhard transfer),
# then a gentle shared warmth and slightly lower saturation so three different shoots sit together.
labs = {k: cv2.cvtColor(v, cv2.COLOR_BGR2LAB).astype(np.float32) for k, v in crops.items()}
mean = np.mean([l.reshape(-1, 3).mean(0) for l in labs.values()], 0)
std = np.mean([l.reshape(-1, 3).std(0) for l in labs.values()], 0)
for k, l in labs.items():
    m, s = l.reshape(-1, 3).mean(0), l.reshape(-1, 3).std(0)
    t = (l - m) / s * std + mean
    out = 0.7 * t + 0.3 * l
    out[..., 1] += 0.5; out[..., 2] += 2.0       # a touch warmer
    bgr = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32); hsv[..., 1] *= 0.9
    bgr = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
    Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).save(f'{SRC}team-portrait-{k}.jpg', quality=90)
print('ok')
