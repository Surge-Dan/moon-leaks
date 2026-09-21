from pathlib import Path
import math
import os

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "test-results"
SCREENSHOTS.mkdir(exist_ok=True)
BASE_URL = os.environ.get("MINI_TOOL_URL", "http://127.0.0.1:4223")
START_WIDTH = int(os.environ.get("MINI_TOOL_WIDTH", "375"))
START_HEIGHT = int(os.environ.get("MINI_TOOL_HEIGHT", "812"))


def drag(page, source, target_x, target_y):
    box = source.bounding_box()
    assert box, "drag source has no box"
    start_x = box["x"] + box["width"] / 2
    start_y = box["y"] + box["height"] / 2
    page.mouse.move(start_x, start_y)
    page.mouse.down()
    page.mouse.move(target_x, target_y, steps=18)
    page.mouse.up()


def main():
    console_errors = []
    page_errors = []
    external_requests = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": START_WIDTH, "height": START_HEIGHT}, device_scale_factor=1)
        page.set_default_timeout(8000)
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on(
            "request",
            lambda request: external_requests.append(request.url)
            if not request.url.startswith(BASE_URL)
            else None,
        )

        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=str(SCREENSHOTS / "01-intro.png"), full_page=True)
        assert page.get_by_text("今晚，做一只月饼", exact=False).is_visible()
        page.locator('[data-action="start-intro"]').click()
        page.wait_for_selector('[data-action="pick-skin"]')
        page.wait_for_timeout(520)
        page.screenshot(path=str(SCREENSHOTS / "04-skin.png"), full_page=True)
        page.reload()
        page.wait_for_selector('[data-action="pick-skin"]')
        assert page.get_by_text("要不先挑一层饼皮", exact=False).is_visible()

        page.locator('[data-action="pick-skin"]').nth(2).click()
        page.locator('[data-action="confirm-skin"]').click()
        assert page.get_by_text("原来你喜欢", exact=False).is_visible()

        page.locator('[data-action="next-filling"]').click()
        page.locator('[data-action="next-filling"]').click()
        page.wait_for_timeout(520)
        page.screenshot(path=str(SCREENSHOTS / "05-filling.png"), full_page=True)
        page.locator('[data-action="confirm-filling"]').click()
        assert page.get_by_text("这一口", exact=False).is_visible()

        page.locator('[data-action="select-blend"]').nth(2).click()
        ratio = page.locator('[data-role="ratio-range"]')
        ratio.evaluate("el => { el.value = 63; el.dispatchEvent(new Event('input', { bubbles: true })); }")
        assert "63" in page.locator(".ratio-readout").inner_text()
        page.wait_for_timeout(520)
        page.screenshot(path=str(SCREENSHOTS / "06-blend.png"), full_page=True)
        page.locator('[data-action="confirm-blend"]').click()
        page.reload()
        page.wait_for_selector('[data-action="catch-surprise"]')
        assert page.locator('[data-action="catch-surprise"]').count() == 3
        page.wait_for_timeout(520)
        page.screenshot(path=str(SCREENSHOTS / "07-surprise.png"), full_page=True)

        page.locator('[data-action="catch-surprise"]').first.click()
        page.locator('[data-action="confirm-surprise"]').click()
        if page.locator('[data-action="choose-fate"]').count():
            page.locator('[data-action="choose-fate"]').last.click()

        board = page.locator('[data-role="knead-board"]')
        board_box = board.bounding_box()
        assert board_box
        center_x = board_box["x"] + board_box["width"] / 2
        center_y = board_box["y"] + board_box["height"] / 2
        canvas = page.locator("#knead-canvas")
        alpha_before = canvas.evaluate(
            "el => { const pixels = el.getContext('2d').getImageData(0, 0, el.width, el.height).data; let total = 0; for (let i = 3; i < pixels.length; i += 4) total += pixels[i]; return total; }"
        )
        page.mouse.move(center_x - board_box["width"] * 0.16, center_y)
        page.mouse.down()
        page.mouse.move(center_x + board_box["width"] * 0.16, center_y)
        page.mouse.up()
        alpha_after = canvas.evaluate(
            "el => { const pixels = el.getContext('2d').getImageData(0, 0, el.width, el.height).data; let total = 0; for (let i = 3; i < pixels.length; i += 4) total += pixels[i]; return total; }"
        )
        assert alpha_after > alpha_before, f"揉月轨迹没有绘制到Canvas：前{alpha_before}后{alpha_after}，区域{board_box}"
        radius = board_box["width"] * 0.31
        page.mouse.move(center_x + radius, center_y)
        page.mouse.down()
        for turn in range(4):
            for step in range(48):
                angle = 2 * math.pi * step / 48
                page.mouse.move(
                    center_x + math.cos(angle) * radius,
                    center_y + math.sin(angle) * radius,
                )
        page.mouse.up()
        assert page.locator('[data-action="confirm-knead"]').is_enabled()
        page.locator('[data-action="confirm-knead"]').click()

        page.locator('[data-action="pick-stamp"]').nth(1).click()
        press_pad = page.locator('[data-action="press-stamp"]')
        press_box = press_pad.bounding_box()
        assert press_box
        page.mouse.move(press_box["x"] + press_box["width"] / 2, press_box["y"] + press_box["height"] / 2)
        page.mouse.down()
        page.wait_for_timeout(900)
        page.mouse.up()
        assert page.locator('[data-action="confirm-stamp"]').is_enabled()
        page.locator('[data-action="confirm-stamp"]').click()

        page.wait_for_selector('[data-action="take-moon"]')
        page.wait_for_timeout(2500)
        page.screenshot(path=str(SCREENSHOTS / "08-bake.png"), full_page=True)
        page.locator('[data-action="take-moon"]').click()
        page.screenshot(path=str(SCREENSHOTS / "09-reveal.png"), full_page=True)

        reveal = page.locator('#reveal-canvas')
        reveal_box = reveal.bounding_box()
        assert reveal_box
        page.mouse.move(reveal_box["x"] + reveal_box["width"] * .18, reveal_box["y"] + reveal_box["height"] / 2)
        page.mouse.down()
        page.mouse.move(reveal_box["x"] + reveal_box["width"] * .82, reveal_box["y"] + reveal_box["height"] / 2, steps=22)
        page.mouse.up()
        page.wait_for_selector(".result-name")
        page.screenshot(path=str(SCREENSHOTS / "02-result.png"), full_page=True)

        page.locator('[data-action="open-share"]').click()
        page.wait_for_selector(".share-preview")
        assert page.locator(".share-preview").get_attribute("src").startswith("data:image/png;base64,")
        page.screenshot(path=str(SCREENSHOTS / "10-share.png"), full_page=True)
        page.locator('[data-action="close-share"]').click()
        page.locator('[data-action="save-result"]').click()

        visited = 1
        while page.locator('[data-action="next-result"]').is_enabled():
            page.locator('[data-action="next-result"]').click()
            visited += 1
            if visited == 2:
                page.wait_for_timeout(420)
                title_box = page.locator('.anatomy .screen-title').bounding_box()
                image_box = page.locator('#anatomy-canvas').bounding_box()
                metrics_box = page.locator('.anatomy-metrics').bounding_box()
                assert title_box and image_box and metrics_box
                assert title_box['y'] + title_box['height'] <= image_box['y'] + 2
                assert image_box['y'] + image_box['height'] <= metrics_box['y'] + 2
                page.screenshot(path=str(SCREENSHOTS / "11-anatomy.png"), full_page=True)
        assert visited >= 5
        assert page.get_by_text("再做一轮月亮").is_visible()

        page.reload()
        page.wait_for_selector('[data-action="open-last"]')
        page.locator('[data-action="open-last"]').click()
        page.wait_for_selector(".result-name")
        assert page.locator(".result-name").is_visible()

        for width, height in [(320, 700), (430, 900)]:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(120)
            dimensions = page.evaluate(
                "() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })"
            )
            assert dimensions["scrollWidth"] <= dimensions["innerWidth"]
        page.screenshot(path=str(SCREENSHOTS / "03-result-430.png"), full_page=True)

        assert not console_errors, console_errors
        assert not page_errors, page_errors
        assert not external_requests, external_requests
        browser.close()

    print("BROWSER_FLOW=PASS")
    print(f"RESULT_PAGES={visited}")
    print("VIEWPORTS=320,375,430")


if __name__ == "__main__":
    main()
