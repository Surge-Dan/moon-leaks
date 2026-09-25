"""Targeted visual-interaction regression checks for the September revision."""
from pathlib import Path
import hashlib

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:4223"
OUT = ROOT / "test-results"


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        assert page.locator(".topline").bounding_box()["y"] >= 54
        assert page.locator(".atelier-photo").bounding_box()["y"] > page.locator(".topline").bounding_box()["y"] + 40
        assert page.locator(".topline-mark").count() == 0

        page.locator('[data-action="start-intro"]').click()
        skin = page.locator('[data-action="pick-skin"]').first
        box = skin.bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.wait_for_timeout(520)
        page.mouse.up()
        assert skin.get_attribute("aria-pressed") == "false", "长按不应顺带选中"
        skin.click()
        assert skin.get_attribute("aria-pressed") == "true"
        page.locator('[data-action="confirm-skin"]').click()
        header_y = page.locator(".topline").bounding_box()["y"]
        for _ in range(8):
            page.locator('[data-action="next-filling"]').click()
            assert abs(page.locator(".topline").bounding_box()["y"] - header_y) < 1
            assert page.locator(".ingredient-photo").is_visible()
        assets = [ROOT / "assets" / f"filling-{name}-v2.webp" for name in ("chestnut", "redbean", "matcha")]
        assert len({hashlib.sha256(path.read_bytes()).hexdigest() for path in assets}) == 3
        alpha_corners = page.evaluate("""async () => {
          const sources = ['chestnut-v2', 'redbean-v2', 'matcha-v2'];
          return Promise.all(sources.map(async (name) => {
            const image = new Image();
            image.src = `./assets/filling-${name}.webp`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image, 0, 0);
            const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            const points = [3, (canvas.width - 1) * 4 + 3, ((canvas.height - 1) * canvas.width) * 4 + 3, (canvas.width * canvas.height - 1) * 4 + 3];
            return points.every(index => pixels[index] === 0);
          }));
        }""")
        assert all(alpha_corners), "新增馅料必须保持透明背景"
        ingredient_coverage = page.evaluate("""async () => {
          const sources = ['lotus', 'sesame', 'osmanthus', 'custard', 'coffee', 'chestnut-v2', 'redbean-v2', 'matcha-v2'];
          return Promise.all(sources.map(async (name) => {
            const image = new Image(); image.src = `./assets/filling-${name}.webp`; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
            for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
              if (pixels[(y * canvas.width + x) * 4 + 3] > 12) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
            }
            return { name, width: (right - left + 1) / canvas.width, height: (bottom - top + 1) / canvas.height };
          }));
        }""")
        baseline = ingredient_coverage[:5]
        baseline_extent = sum(max(item["width"], item["height"]) for item in baseline) / len(baseline)
        baseline_area = sum(item["width"] * item["height"] for item in baseline) / len(baseline)
        for item in ingredient_coverage[5:]:
            assert abs(max(item["width"], item["height"]) - baseline_extent) < .09, ingredient_coverage
            assert abs(item["width"] * item["height"] - baseline_area) < .10, ingredient_coverage
        page.locator('[data-action="confirm-filling"]').click()
        page.locator('[data-action="confirm-blend"]').click()
        page.locator('[data-action="dodge-surprise"]').click()
        page.locator('[data-action="confirm-surprise"]').click()
        if page.locator('[data-action="choose-fate"]').count():
            page.locator('[data-action="choose-fate"]').first.click()
        assert "三圈" in page.locator('[data-role="knead-feedback"]').inner_text()
        assert "184, 91, 69" in page.locator(".knead-meter span").evaluate("el => getComputedStyle(el).backgroundImage")
        page.locator('[data-role="knead-board"]').press("Enter")
        assert "揉好了" in page.locator('[data-role="knead-feedback"]').inner_text()
        page.screenshot(path=str(OUT / "adversarial-knead.png"), full_page=True)
        page.locator('[data-action="confirm-knead"]').click()
        page.wait_for_load_state("networkidle")
        first = page.locator('[data-action="pick-stamp"]').first
        second = page.locator('[data-action="pick-stamp"]').nth(1)
        first.click()
        image_a = page.locator("#press-preview-canvas").evaluate("el => el.toDataURL()")
        second.click()
        image_b = page.locator("#press-preview-canvas").evaluate("el => el.toDataURL()")
        assert image_a != image_b, "换花纹后预览必须变化"
        page.screenshot(path=str(OUT / "adversarial-stamp-before.png"), full_page=True)
        press = page.locator('[data-action="press-stamp"]')
        box = press.bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.wait_for_timeout(850)
        page.mouse.up()
        assert page.locator('[data-action="confirm-stamp"]').is_enabled()
        assert press.evaluate("el => parseFloat(el.style.getPropertyValue('--press-progress'))") > 40
        page.screenshot(path=str(OUT / "adversarial-stamp-after.png"), full_page=True)
        visual_difference = page.evaluate("""() => {
          const render = (skinId, fillingAsset, stampId, cut, stampProgress) => {
            const c = document.createElement('canvas'); c.style.width='300px'; c.style.height='300px';
            MoonVisuals.drawMooncake(c, {skinId, fillingAsset, fillingColor: fillingAsset==='matcha'?'#76865f':'#c99c62', stampId, stampProgress, bakeLevel:76, blendColors:['#783a45','#c9993d'], ratio:63}, cut, 300);
            return c.toDataURL();
          };
          return {
            skins: render('tea','lotus','osmanthus',0)!==render('charcoal','lotus','osmanthus',0),
            fillings: render('tea','lotus','osmanthus',1)!==render('tea','matcha','osmanthus',1),
            stamps: render('tea','lotus','osmanthus',0,1)!==render('tea','lotus','rabbit',0,1),
            finalStampIsPhotographic: render('tea','lotus','osmanthus',1)===render('tea','lotus','rabbit',1),
            ratios: (() => {
              const a = document.createElement('canvas'); a.style.width='300px'; a.style.height='300px';
              const b = document.createElement('canvas'); b.style.width='300px'; b.style.height='300px';
              const base = {skinId:'tea', fillingAsset:'lotus', fillingColor:'#c99c62', stampId:'osmanthus', bakeLevel:76, blendColors:['#783a45','#c9993d']};
              MoonVisuals.drawMooncake(a, {...base, ratio:25}, 1, 300);
              MoonVisuals.drawMooncake(b, {...base, ratio:75}, 1, 300);
              return a.toDataURL() !== b.toDataURL();
            })(),
            bake: render('tea','lotus','osmanthus',0)!==render('tea','lotus','osmanthus',1)
          };
        }""")
        assert all(visual_difference.values()), visual_difference
        assert not errors, errors
        browser.close()
        print("ADVERSARIAL_UI=PASS")
        print("SKIN_LONG_PRESS=PASS")
        print("STATIC_HEADER=PASS")
        print("STAMP_PREVIEW_VARIANTS=PASS")
        print("VISUAL_MODEL_VARIANTS=PASS")


if __name__ == "__main__":
    main()
