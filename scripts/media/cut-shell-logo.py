import cv2, numpy as np
from PIL import Image

SRC = '/home/daniel/dev/pnina-website/private-media/originals/pnina-sunset-wide.png'
im = Image.open(SRC).convert('RGB').crop((470, 545, 1320, 1345))
arr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
h, w = arr.shape[:2]

mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
yy, xx = np.mgrid[0:h, 0:w]
n = ((xx - w*0.50)/(w*0.485))**2 + ((yy - h*0.52)/(h*0.455))**2
mask[n < 1.0] = cv2.GC_PR_FGD
mask[n < 0.22] = cv2.GC_FGD
mask[n > 1.08] = cv2.GC_BGD
cv2.grabCut(arr, mask, None, np.zeros((1,65),np.float64), np.zeros((1,65),np.float64),
            10, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

nlab, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
if nlab > 1:
    fg = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8) * 255
holes = fg.copy(); cv2.floodFill(holes, np.zeros((h+2,w+2),np.uint8), (0,0), 255)
fg = fg | cv2.bitwise_not(holes)
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((21,21),np.uint8))
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN,  np.ones((15,15),np.uint8))
fg = cv2.erode(fg, np.ones((5,5),np.uint8))
fg = cv2.GaussianBlur(fg, (0,0), 3.0)

out = im.convert('RGBA'); out.putalpha(Image.fromarray(fg))
out = out.crop(out.getbbox())
sq = Image.new('RGBA', (1024,1024), (0,0,0,0))
sc = 980/max(out.size)
out = out.resize((round(out.width*sc), round(out.height*sc)), Image.LANCZOS)
sq.paste(out, ((1024-out.width)//2, (1024-out.height)//2), out)
sq.save('pearl-shell.png')
a = np.asarray(sq)[:,:,3]
print(f"opaque {100*(a>200).mean():.1f}%  fringe {100*((a>20)&(a<200)).mean():.1f}%")
bg = Image.new('RGB',(1024,1024),(28,32,40)); bg.paste(sq,(0,0),sq); bg.resize((560,560)).save('prev-shell.png')
