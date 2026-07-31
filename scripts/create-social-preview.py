#!/usr/bin/env python3
"""Generate GitHub social preview (1280x640) for Dacx."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "branding" / "social-preview.png"
ICON = ROOT / "assets" / "icon" / "icon.png"
SHOT = ROOT / "assets" / "screenshots" / "dacx_sc.png"

W, H = 1280, 640
BG_TOP = (10, 20, 36)
BG_BOTTOM = (21, 42, 69)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/segoeuib.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                "C:/Windows/Fonts/segoeui.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/System/Library/Fonts/Supplemental/Arial.ttf",
            ]
        )
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def vertical_gradient(size: tuple[int, int]) -> Image.Image:
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    for y in range(size[1]):
        t = y / max(size[1] - 1, 1)
        color = tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3))
        draw.line([(0, y), (size[0], y)], fill=color)
    return img


def wrap_text(text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        trial = " ".join(current + [word])
        if font.getlength(trial) <= max_width or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    canvas = vertical_gradient((W, H))

    icon = Image.open(ICON).convert("RGBA").resize((150, 150), Image.Resampling.LANCZOS)
    canvas.paste(icon, (90, 80), icon)

    title_font = load_font(64, bold=True)
    body_font = load_font(28)
    tag_font = load_font(22)

    draw = ImageDraw.Draw(canvas)
    draw.text((90, 250), "Dacx", fill=(255, 255, 255), font=title_font)

    subtitle = "Cross-platform music and video player for Windows, macOS, and Linux"
    y = 330
    for line in wrap_text(subtitle, body_font, 520):
        draw.text((90, y), line, fill=(184, 197, 214), font=body_font)
        y += 36

    draw.text((90, 440), "Flutter + libmpv  |  Open source", fill=(122, 155, 196), font=tag_font)

    shot = Image.open(SHOT).convert("RGBA")
    shot_w = 680
    shot_h = int(shot.height * (shot_w / shot.width))
    shot = shot.resize((shot_w, shot_h), Image.Resampling.LANCZOS)

    border = 8
    framed = Image.new("RGBA", (shot_w + border * 2, shot_h + border * 2), (*BG_TOP, 255))
    framed.paste(shot, (border, border), shot)

    x = W - framed.width - 60
    y = (H - framed.height) // 2
    canvas.paste(framed, (x, y), framed)

    canvas.save(OUT, format="PNG", optimize=True)
    print(f"Created {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
