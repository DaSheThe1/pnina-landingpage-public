# gemini-logo-remover — patch variant.
#
# Plain TELEA inpainting removes the star but leaves a smooth, grainless patch
# that reads as a soft rectangle against this sand. These frames have a large
# area of statistically identical sand right beside the mark, so the better
# repair is to CLONE a clean block of the same sand over it with a feathered
# edge: the grain survives because it is real grain, not reconstructed.
import cv2, numpy as np

def patch(src, dst, box, offset, feather=26):
    img = cv2.imread(src).astype(np.float32)
    x1, y1, x2, y2 = box
    dx, dy = offset
    w, h = x2 - x1, y2 - y1
    donor = img[y1 + dy:y1 + dy + h, x1 + dx:x1 + dx + w].copy()

    # Match the donor's local mean/quantile to the target's so a lighting
    # gradient across the frame doesn't show as a brightness step.
    tgt = img[y1:y2, x1:x2]
    ring = np.ones((h, w), bool)
    ring[feather:-feather, feather:-feather] = False
    donor += (tgt[ring].mean(axis=0) - donor[ring].mean(axis=0))

    # Feathered alpha so the seam is a ramp rather than an edge.
    ax = np.minimum(np.arange(w), np.arange(w)[::-1]) / feather
    ay = np.minimum(np.arange(h), np.arange(h)[::-1]) / feather
    a = np.clip(np.minimum(ax[None, :], ay[:, None]), 0, 1)
    a = (a * a * (3 - 2 * a))[..., None]

    img[y1:y2, x1:x2] = donor * a + tgt * (1 - a)
    cv2.imwrite(dst, np.clip(img, 0, 255).astype(np.uint8))
    print(f"{dst} patched {box} from offset {offset}")

patch('/home/daniel/t.png', 'wide-clean.png', (2440, 1204, 2590, 1370), (-330, -40))
patch('/home/daniel/mopbile.png', 'tall-clean.png', (1220, 2433, 1380, 2593), (-340, -60))
