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
        assert page.locator(".topline").bounding_box()["y"] >= 80
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
        assets = [ROOT / "assets" / f"filling-{name}.webp" for name in ("chestnut", "redbean", "matcha")]
        assert len({hashlib.sha256(path.read_bytes()).hexdigest() for path in assets}) == 3
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
          const render = (skinId, fillingAsset, stampId, cut) => {
            const c = document.createElement('canvas'); c.style.width='300px'; c.style.height='300px';
            MoonVisuals.drawMooncake(c, {skinId, fillingAsset, fillingColor: fillingAsset==='matcha'?'#76865f':'#c99c62', stampId, bakeLevel:76, blendColors:['#783a45','#c9993d'], ratio:63}, cut, 300);
            return c.toDataURL();
          };
          return {
            skins: render('tea','lotus','osmanthus',0)!==render('charcoal','lotus','osmanthus',0),
            fillings: render('tea','lotus','osmanthus',1)!==render('tea','matcha','osmanthus',1),
            stamps: render('tea','lotus','osmanthus',0)!==render('tea','lotus','rabbit',0),
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
