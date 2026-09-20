from pathlib import Path
import os

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get("MINI_TOOL_URL", "http://127.0.0.1:4223")


def fast_to_reveal(page):
    page.locator('[data-action="start-intro"]').click()
    page.locator('[data-action="pick-skin"]').first.click()
    page.locator('[data-action="confirm-skin"]').click()
    page.locator('[data-action="confirm-filling"]').click()
    page.locator('[data-action="confirm-blend"]').click()
    page.locator('[data-action="dodge-surprise"]').click()
    page.locator('[data-action="confirm-surprise"]').click()
    if page.locator('[data-action="choose-fate"]').count():
        page.locator('[data-action="choose-fate"]').first.click()
    page.locator('[data-role="knead-board"]').press("Enter")
    page.locator('[data-action="confirm-knead"]').click()
    page.locator('[data-action="pick-stamp"]').first.click()
    page.locator('[data-action="press-stamp"]').press("Enter")
    page.locator('[data-action="confirm-stamp"]').click()
    page.locator('[data-action="take-moon"]').click()


def main():
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script(
            """
            window.__bridgeCalls = [];
            window.xhs = { miniTool: {
              writeTempFile: function () { window.__bridgeCalls.push('write'); return Promise.resolve({ filePath: 'moon-card.png' }); },
              saveImageToPhotosAlbum: function () { window.__bridgeCalls.push('save'); return Promise.resolve({}); }
            }};
            """
        )
        page.goto(BASE_URL)
        page.evaluate(
            """
            const traits = { novelty: 50, control: 50, emotion: 50, intuition: 50, aftertaste: 50, boundary: 50, decorum: 50 };
            const content = window.MoonContent;
            const archetype = content.archetypes.NCEI;
            localStorage.setItem('moon-leaks-progress-v1', JSON.stringify({
              step: 'fate',
              session: { id: 'broken-fate', traits, choices: {}, actions: [], signals: [], durations: [] },
              skinId: 'snow', fillingId: 'lotus', fillingIndex: 0, blendIndex: 0, ratio: 50,
              surpriseSet: content.surprises.slice(0, 3), surpriseOutcome: 'missed', surpriseId: null,
              fate: null, kneadProgress: 0, kneadPoints: [], stampId: null, bakeLevel: 28
            }));
            localStorage.setItem('moon-leaks-last-result', JSON.stringify({ result: {
              code: 'NCEI', name: archetype.name, line: archetype.line, essay: archetype.essay,
              relation: archetype.relation, cannotStand: archetype.cannotStand, tonight: archetype.tonight,
              number: '01', traits,
              model: { bakeLevel: 60, fillingColor: '#fff', blendColors: ['#111', '#222'], ratio: 50, emotion: 50, boundary: 50, control: 50, intuition: 50 },
              filling: content.fillings[0], blend: content.blends[0], stamp: content.stamps[0],
              surprise: null, evidence: [], hiddenPages: []
            }, snapshot: {
              skinId: content.skins[0].id, fillingIndex: 0, fillingId: content.fillings[0].id,
              blendIndex: 0, ratio: 50, ratioAdjustments: 0, surpriseId: null,
              fate: null, fateChoice: null, stampId: content.stamps[0].id, bakeLevel: 60
            }}));
            """
        )
        page.reload()
        assert page.get_by_text("今晚做一只", exact=False).is_visible()
        assert page.locator('[data-action="open-last"]').count() == 0
        assert not errors, errors
        page.evaluate(
            """
            (() => {
              const saved = JSON.parse(localStorage.getItem('moon-leaks-last-result'));
              saved.result.skin = window.MoonContent.skins[0];
              saved.snapshot.fateChoice = 'left';
              saved.snapshot.fate = null;
              localStorage.removeItem('moon-leaks-progress-v1');
              localStorage.setItem('moon-leaks-last-result', JSON.stringify(saved));
            })()
            """
        )
        page.reload()
        assert page.get_by_text("今晚做一只", exact=False).is_visible()
        assert page.locator('[data-action="open-last"]').count() == 0
        assert not errors, errors
        page.evaluate(
            """
            (() => {
              const saved = JSON.parse(localStorage.getItem('moon-leaks-last-result'));
              saved.snapshot.fateChoice = null;
              saved.snapshot.fillingId = window.MoonContent.fillings[1].id;
              saved.result.skin = window.MoonContent.skins[0];
              saved.result.filling = window.MoonContent.fillings[1];
              localStorage.setItem('moon-leaks-last-result', JSON.stringify(saved));
            })()
            """
        )
        page.reload()
        assert page.locator('[data-action="open-last"]').is_visible()
        page.evaluate(
            """
            (() => {
              window.__legacyModel = null;
              const draw = window.MoonVisuals.drawMooncake;
              window.MoonVisuals.drawMooncake = function (canvas, model, cut, size) {
                if (canvas && canvas.id === 'result-hero-canvas') window.__legacyModel = model;
                return draw(canvas, model, cut, size);
              };
            })()
            """
        )
        page.locator('[data-action="open-last"]').click()
        page.wait_for_function("window.__legacyModel !== null")
        assert page.evaluate("window.__legacyModel.fillingId") == "sesame"
        assert page.evaluate("window.__legacyModel.skinId") == "snow"
        page.evaluate("localStorage.clear()")
        page.reload()
        page.locator('[data-action="start-intro"]').press("Enter")
        page.wait_for_selector('[data-action="pick-skin"]')
        page.locator('[data-action="pick-skin"]').first.click()
        page.locator('[data-action="confirm-skin"]').click()
        page.locator('[data-action="confirm-filling"]').click()

        ratio = page.locator('[data-role="ratio-range"]')
        for value in [55, 45, 60, 40, 65, 35, 62, 38, 64]:
            ratio.evaluate(
                "(el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }",
                value,
            )
        page.locator('[data-action="confirm-blend"]').click()
        page.locator('[data-action="dodge-surprise"]').click()
        page.locator('[data-action="confirm-surprise"]').click()
        if page.locator('[data-action="choose-fate"]').count():
            page.locator('[data-action="choose-fate"]').first.click()

        board = page.locator('[data-role="knead-board"]')
        board.press("Enter")
        assert page.locator('[data-action="confirm-knead"]').is_enabled()
        page.locator('[data-action="confirm-knead"]').click()

        page.locator('[data-action="pick-stamp"]').first.click()
        page.locator('[data-action="press-stamp"]').press("Enter")
        assert page.locator('[data-action="confirm-stamp"]').is_enabled()
        page.locator('[data-action="confirm-stamp"]').click()
        page.wait_for_selector('[data-action="take-moon"]')
        page.evaluate(
            """
            (() => {
              window.__personalityModels = { reveal: null, result: null };
              const originalDrawMooncake = window.MoonVisuals.drawMooncake;
              window.MoonVisuals.drawMooncake = function (canvas, model, progress, preferredSize) {
                if (canvas && canvas.id === 'reveal-canvas') {
                  window.__personalityModels.reveal = JSON.parse(JSON.stringify(model));
                }
                if (canvas && canvas.id === 'result-hero-canvas') {
                  window.__personalityModels.result = JSON.parse(JSON.stringify(model));
                }
                return originalDrawMooncake(canvas, model, progress, preferredSize);
              };
              return true;
            })()
            """
        )
        page.locator('[data-action="take-moon"]').click()
        page.wait_for_function("window.__personalityModels.reveal !== null")
        reveal_model = page.evaluate("window.__personalityModels.reveal")
        assert any(reveal_model[key] != 50 for key in ["emotion", "boundary", "control", "intuition"])
        assert page.locator('[data-action="cut-now"]').is_visible()
        assert page.locator('[data-role="reveal-stage"]').evaluate("el => getComputedStyle(el).touchAction") == "none"
        page.wait_for_timeout(2200)
        page.locator('[data-role="reveal-stage"]').press("Enter")
        page.wait_for_selector(".result-name")
        page.wait_for_function("window.__personalityModels.result !== null")
        result_model = page.evaluate("window.__personalityModels.result")
        assert {key: reveal_model[key] for key in ["emotion", "boundary", "control", "intuition"]} == {
            key: result_model[key] for key in ["emotion", "boundary", "control", "intuition"]
        }

        page.locator('[data-action="open-share"]').click()
        page.locator('[data-action="save-share"]').click()
        page.wait_for_function("window.__bridgeCalls.length === 2")
        assert page.evaluate("window.__bridgeCalls.join(',')") == "write,save"

        page.locator('[data-action="close-share"]').click()
        visited = 1
        while page.locator('[data-action="next-result"]').is_enabled():
            page.locator('[data-action="next-result"]').click()
            visited += 1
        assert visited >= 6, "ratio-adjustment hidden page was not generated"

        page.locator('[data-action="restart"]').click()
        fast_to_reveal(page)
        cake = page.locator("#reveal-canvas").bounding_box()
        assert cake
        page.mouse.move(cake["x"] + cake["width"] * .2, cake["y"] + cake["height"] / 2)
        page.mouse.down()
        page.evaluate(
            "({ x, y }) => document.querySelector('[data-role=reveal-stage]').dispatchEvent(new PointerEvent('pointermove', { pointerId: 99, pointerType: 'touch', isPrimary: false, clientX: x, clientY: y, bubbles: true }))",
            {"x": cake["x"] + cake["width"] * .85, "y": cake["y"] + cake["height"] / 2},
        )
        assert page.locator('.knife-track').evaluate("el => el.style.getPropertyValue('--cut')") == "0%"
        page.mouse.move(cake["x"] + cake["width"] * .3, cake["y"] + cake["height"] / 2)
        page.mouse.up()
        assert page.locator('[data-role="reveal-stage"]').is_visible(), "short swipe must not cut"
        page.locator('[data-action="cut-now"]').click()
        page.wait_for_selector(".result-name")

        while page.locator('[data-action="next-result"]').is_enabled():
            page.locator('[data-action="next-result"]').click()
        page.locator('[data-action="restart"]').click()
        fast_to_reveal(page)
        cake = page.locator("#reveal-canvas").bounding_box()
        assert cake
        page.mouse.move(cake["x"] + cake["width"] * .82, cake["y"] + cake["height"] / 2)
        page.mouse.down()
        page.mouse.move(cake["x"] + cake["width"] * .18, cake["y"] + cake["height"] / 2, steps=18)
        page.mouse.up()
        page.wait_for_selector(".result-name")
        assert not errors, errors
        browser.close()

    print("BROWSER_EDGE=PASS")
    print(f"RESULT_PAGES_WITH_HIDDEN={visited}")
    print("KEYBOARD=intro,knead,stamp,reveal")
    print("CUT=left-to-right,right-to-left,cancel,fallback")
    print("JSBRIDGE=writeTempFile,saveImageToPhotosAlbum")
    print("CACHE_SCHEMA=PASS")
    print("REVEAL_TRAITS=FINAL")


if __name__ == "__main__":
    main()
