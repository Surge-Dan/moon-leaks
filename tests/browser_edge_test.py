from pathlib import Path
import os

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get("MINI_TOOL_URL", "http://127.0.0.1:4223")


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
        assert page.get_by_text("今晚，先把月亮补圆。").is_visible()
        assert page.locator('[data-action="open-last"]').count() == 0
        assert not errors, errors
        page.evaluate("localStorage.clear()")
        page.reload()
        page.locator('[data-action="drag-shard"]').press("Enter")
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
        assert not errors, errors
        browser.close()

    print("BROWSER_EDGE=PASS")
    print(f"RESULT_PAGES_WITH_HIDDEN={visited}")
    print("KEYBOARD=intro,knead,stamp,reveal")
    print("JSBRIDGE=writeTempFile,saveImageToPhotosAlbum")
    print("CACHE_SCHEMA=PASS")
    print("REVEAL_TRAITS=FINAL")


if __name__ == "__main__":
    main()
