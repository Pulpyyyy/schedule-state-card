"""Create (or update) the dedicated schedule-state-card test dashboard.

Needs the fixtures of packages/schedule_card_tests.yaml on the target HA.
Required environment:
  HA_HOST        host:port of the test instance
  HA_TOKEN_FILE  file holding an admin long-lived access token (keep it
                 outside the repository)
Requires: pip install websockets
"""
import asyncio, json, os, pathlib, websockets

HOST = os.environ["HA_HOST"]
TOKEN = pathlib.Path(os.environ["HA_TOKEN_FILE"]).read_text().strip()
URL_PATH = "schedule-tests"

SENSORS = ["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic"]
HELPERS = ["input_boolean.sst_away", "input_number.sst_outdoor", "input_number.sst_setpoint"]

CARD = "custom:schedule-state-card"
CONFIG = {
    "title": "Schedule tests",
    "views": [
        {"title": "Jours", "path": "days", "cards": [
            {"type": CARD, "title": "Layout days", "layout": "days", "entities": SENSORS},
            {"type": CARD, "layout": "days", "show_state_in_title": False,
             "entities": [{"entity": "sensor.sst_thermostat", "name": "Sans titre ni état", "icon": "mdi:radiator"}]},
            {"type": "entities", "title": "Pilotage des conditions", "entities": HELPERS},
        ]},
        {"title": "Entités", "path": "entities", "cards": [
            {"type": CARD, "title": "Layout entities", "layout": "entities", "entities": SENSORS},
        ]},
        {"title": "Sections", "path": "sections", "type": "sections", "max_columns": 2, "sections": [
            {"type": "grid", "cards": [
                {"type": CARD, "title": "Sections view", "layout": "days", "entities": SENSORS[:2]},
            ]},
        ]},
        {"title": "Issues", "path": "issues", "cards": [
            {"type": CARD, "title": "#18 Σ fusion des segments", "layout": "days",
             "entities": ["sensor.sst_issue_18"]},
            {"type": "entities", "title": "Pilotage #18", "entities": HELPERS[:2]},
        ]},
        {"title": "Couleurs", "path": "colors", "cards": [
            {"type": CARD, "title": "Overrides", "layout": "days", "entities": ["sensor.sst_price"],
             "color_overrides": {"0|€/kWh": {"color": "#4CAF50", "textColor": "#000000"}}},
        ]},
    ],
}


async def main():
    async with websockets.connect(f"ws://{HOST}/api/websocket", max_size=None) as ws:
        await ws.recv()
        await ws.send(json.dumps({"type": "auth", "access_token": TOKEN}))
        auth = json.loads(await ws.recv())
        assert auth["type"] == "auth_ok", auth["type"]
        n = 0

        async def call(msg):
            nonlocal n
            n += 1
            await ws.send(json.dumps({"id": n, **msg}))
            while True:
                r = json.loads(await ws.recv())
                if r.get("id") == n:
                    return r

        dashboards = (await call({"type": "lovelace/dashboards/list"}))["result"]
        if not any(d["url_path"] == URL_PATH for d in dashboards):
            r = await call({"type": "lovelace/dashboards/create", "url_path": URL_PATH,
                            "title": "Schedule tests", "icon": "mdi:test-tube",
                            "mode": "storage", "require_admin": False, "show_in_sidebar": True})
            print("create:", r["success"], r.get("error"))
        else:
            print("dashboard already exists")
        r = await call({"type": "lovelace/config/save", "url_path": URL_PATH, "config": CONFIG})
        print("save config:", r["success"], r.get("error"))
        r = await call({"type": "lovelace/config", "url_path": URL_PATH})
        print("views:", [v["path"] for v in r["result"]["views"]])

asyncio.run(main())
