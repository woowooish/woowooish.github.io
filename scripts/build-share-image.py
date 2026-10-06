"""Build WooWooish's portrait-free share card and mobile icons.

Run with Python and Pillow from the repository root. Uses the site's own fonts.
"""

from math import cos, sin, pi
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONTS = ASSETS / "fonts"
NAVY = "#052453"
AQUA = "#6cd2dd"
CREAM = "#f5fbfc"
SCALE = 3


def sun(draw, center, radius, color=AQUA):
    """A geometric version of the site's existing sun mark."""
    x, y = center
    for index in range(16):
        angle = index * pi / 8
        inner, outer = radius * 0.50, radius
        a = (x + cos(angle) * inner, y + sin(angle) * inner)
        b = (x + cos(angle) * outer, y + sin(angle) * outer)
        draw.line((a, b), fill=color, width=max(2, round(radius * 0.09)))
        for px, py in (a, b):
            r = radius * 0.045
            draw.ellipse((px-r, py-r, px+r, py+r), fill=color)
    r = radius * 0.27
    draw.ellipse((x-r, y-r, x+r, y+r), fill=color)


def text(draw, value, y, size, font_file, color=CREAM):
    font = ImageFont.truetype(str(FONTS / font_file), size * SCALE)
    box = draw.textbbox((0, 0), value, font=font)
    width, height = box[2] - box[0], box[3] - box[1]
    # Keep lettering in the center square, safe for compact thumbnail crops.
    if width > 590 * SCALE:
        raise ValueError(f"Text exceeds thumbnail safe area: {value}")
    draw.text(((1200*SCALE-width)/2-box[0], y*SCALE-box[1]), value,
              fill=color, font=font)
    return height / SCALE


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    card = Image.new("RGB", (1200*SCALE, 630*SCALE), NAVY)
    draw = ImageDraw.Draw(card)
    # Soft ocean-colored circles and a low wave leave a quiet center for type.
    draw.ellipse((-270*SCALE, -300*SCALE, 270*SCALE, 240*SCALE), fill="#103967")
    draw.ellipse((960*SCALE, 360*SCALE, 1470*SCALE, 870*SCALE), fill="#103967")
    wave = [(x*SCALE, (590+14*sin(x/115))*SCALE) for x in range(-5,1206,5)]
    draw.polygon(wave+[(1200*SCALE,630*SCALE),(0,630*SCALE)], fill="#0b416a")
    sun(draw, (600*SCALE, 123*SCALE), 43*SCALE)
    grotesque = "c9f14cb6-c5b5-4ac9-a6ce-8fb7e9058438.woff2"
    mono = "6af5bc34-a972-43b6-8613-749dcb88d3b4.woff2"
    text(draw, "WooWooish", 216, 100, grotesque)
    text(draw, "A little reminder of", 335, 40, grotesque)
    text(draw, "what’s already within.", 388, 40, grotesque)
    text(draw, "woowooish.com", 503, 22, mono, AQUA)
    card = card.resize((1200,630), Image.Resampling.LANCZOS)
    card.quantize(colors=128).save(ASSETS / "woowooish-share-20261006.png", optimize=True)
    for size in (32,180):
        icon = Image.new("RGB", (size*SCALE,size*SCALE), NAVY)
        sun(ImageDraw.Draw(icon), (size*SCALE/2,size*SCALE/2), size*SCALE*0.34)
        icon.resize((size,size),Image.Resampling.LANCZOS).save(
            ASSETS / f"woowooish-icon-{size}-20261006.png", optimize=True)
    print("Built portrait-free share card (1200×630) and 32/180 px brand icons.")


if __name__ == "__main__":
    main()
