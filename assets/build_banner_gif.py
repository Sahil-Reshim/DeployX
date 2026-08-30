"""Generate an animated GIF banner for DeployX using PIL.

GitHub's image proxy strips SMIL animations from repo-hosted SVGs, so an SVG
banner shows as a static/blank image on READMEs. An animated GIF always renders
and plays on GitHub. This script draws the banner frame-by-frame with PIL using
the app's theme (near-black bg, cherry red #ef4444/#dc2626, electric blue
#2563eb, accents green/yellow/violet).
"""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 840, 240
BG = (5, 6, 15)                 # #05060f
RED = (239, 68, 68)             # #ef4444
RED_D = (220, 38, 38)           # #dc2626
BLUE = (37, 99, 235)            # #2563eb
GREEN = (34, 197, 94)           # #22c55e
YELLOW = (234, 179, 8)          # #eab308
VIOLET = (139, 92, 246)         # #8b5cf6
WHITE = (234, 240, 255)

FRAMES = 40          # total frames in loop
FPS = 12             # frames per second
DUR = 1000 // FPS    # ms per frame


def sin2(x):
    return (math.sin(x * 2 * math.pi) + 1) / 2


def lerp(a, b, t):
    return a + (b - a) * t


def blend(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


def find_font(size):
    for path in (
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/Arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_gradient(size, c1, c2):
    """Vertical gradient image c1(top)->c2(bottom)."""
    w, h = size
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        d.line([(0, y), (w, y)], fill=blend(c1, c2, y / max(1, h - 1)))
    return img
