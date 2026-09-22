from pathlib import Path

from PIL import Image, ImageEnhance


ASSETS = Path(__file__).resolve().parents[1] / "assets"
SOURCE = Image.open(ASSETS / "ingredients-flatlay.webp").convert("RGB")


def tune(image, brightness=1.0, contrast=1.0, color=1.0):
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    return ImageEnhance.Color(image).enhance(color)


def tune_rgba(image, brightness=1.0, contrast=1.0, color=1.0):
    rgba = image.convert("RGBA")
    rgb = tune(rgba.convert("RGB"), brightness, contrast, color)
    rgb.putalpha(rgba.getchannel("A"))
    return rgb


filling_crops = {
    "chestnut": ((445, 270, 705, 530), (1.03, 1.05, 1.12)),
    "redbean": ((430, 270, 700, 535), (0.92, 1.04, 1.22)),
    "matcha": ((600, 55, 875, 300), (0.95, 1.02, 0.82)),
}

for name, (box, factors) in filling_crops.items():
    image = SOURCE.crop(box).resize((320, 320), Image.Resampling.LANCZOS)
    tune(image, *factors).save(ASSETS / f"filling-{name}.webp", "WEBP", quality=92)

cut_sources = {
    "chestnut": ("mooncake-cut-lotus.webp", (1.05, 1.02, 0.92)),
    "redbean": ("mooncake-cut-lotus.webp", (0.96, 1.02, 1.16)),
    "matcha": ("mooncake-cut-osmanthus.webp", (0.92, 1.04, 0.82)),
}

for name, (source_name, factors) in cut_sources.items():
    image = tune_rgba(Image.open(ASSETS / source_name), *factors)
    image.save(ASSETS / f"mooncake-cut-{name}.webp", "WEBP", quality=90, method=6)

# The source photos are intentionally detailed, but a mobile Builder Hub package
# should stay light. Keep the displayed cut at 800px with a high-quality WebP
# encode; this is still larger than the on-screen card while saving bandwidth.
for path in ASSETS.glob("mooncake-cut-*.webp"):
    if path.name.endswith(".tmp.webp"):
        continue
    image = Image.open(path).convert("RGBA").resize((720, 720), Image.Resampling.LANCZOS)
    temp_path = path.with_suffix(".tmp.webp")
    image.save(temp_path, "WEBP", quality=70, method=6)
    temp_path.replace(path)

print("DERIVED_ASSETS=PASS")
