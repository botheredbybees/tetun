#!/usr/bin/env python3
"""Draws the app icons: a white speech bubble reading "Te" on the app's green.

Developer tool only (needs Python with Pillow; the app itself has no dependencies).
Run from the repo root:  python3 tools/make-icons.py
Writes icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png,
apple-touch-icon-precomposed.png (180px) and favicon.png (32px).
"""
from PIL import Image, ImageDraw, ImageFont

GREEN = (31, 111, 92, 255)
WHITE = (255, 255, 255, 255)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BIG = 1024  # draw large, then scale down for clean edges


def draw(kind):
    """kind: 'any' (rounded corners), 'full' (square, for iOS) or 'maskable' (square, content kept small)."""
    img = Image.new('RGBA', (BIG, BIG), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if kind == 'any':
        d.rounded_rectangle((0, 0, BIG - 1, BIG - 1), radius=int(BIG * 0.22), fill=GREEN)
    else:
        d.rectangle((0, 0, BIG, BIG), fill=GREEN)
    width = BIG * (0.56 if kind == 'maskable' else 0.70)  # maskable keeps to the central safe zone
    height = width * 0.68
    cx, cy = BIG / 2, BIG / 2 - BIG * 0.03
    left, top, right, bottom = cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2
    d.rounded_rectangle((left, top, right, bottom), radius=height * 0.30, fill=WHITE)
    d.polygon([(cx - width * 0.26, bottom - 4), (cx - width * 0.36, bottom + height * 0.30), (cx - width * 0.02, bottom - 4)], fill=WHITE)
    font = ImageFont.truetype(FONT, int(height * 0.66))
    d.text((cx, cy - height * 0.02), 'Te', font=font, fill=GREEN, anchor='mm')
    return img


def save(kind, size, path):
    draw(kind).resize((size, size), Image.LANCZOS).save(path)


save('any', 192, 'icons/icon-192.png')
save('any', 512, 'icons/icon-512.png')
save('maskable', 512, 'icons/icon-maskable-512.png')
save('full', 180, 'apple-touch-icon-precomposed.png')
save('any', 32, 'favicon.png')
print('icons written')
