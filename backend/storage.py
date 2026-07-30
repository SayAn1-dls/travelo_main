import os
import logging
import httpx

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "travelo"
logger = logging.getLogger("travelo.storage")

_storage_key = None
_base_url = STORAGE_URL


def _candidate_bases():
    bases = [STORAGE_URL]
    proxy = os.environ.get("INTEGRATION_PROXY_URL")
    if proxy:
        bases.append(proxy.rstrip("/") + "/objstore/api/v1/storage")
    return bases


async def init_storage(force: bool = False) -> str:
    global _storage_key, _base_url
    if _storage_key and not force:
        return _storage_key
    last_err = None
    async with httpx.AsyncClient(timeout=30) as c:
        for base in _candidate_bases():
            try:
                r = await c.post(f"{base}/init", json={"emergent_key": os.environ["EMERGENT_LLM_KEY"]})
                r.raise_for_status()
                _storage_key = r.json()["storage_key"]
                _base_url = base
                return _storage_key
            except httpx.HTTPError as e:
                last_err = e
    raise last_err


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.put(f"{_base_url}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type}, content=data)
        if r.status_code == 403:
            key = await init_storage(force=True)
            r = await c.put(f"{_base_url}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type}, content=data)
        r.raise_for_status()
        return r.json()


async def get_object(path: str):
    key = await init_storage()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.get(f"{_base_url}/objects/{path}", headers={"X-Storage-Key": key})
        if r.status_code == 403:
            key = await init_storage(force=True)
            r = await c.get(f"{_base_url}/objects/{path}", headers={"X-Storage-Key": key})
        r.raise_for_status()
        return r.content, r.headers.get("Content-Type", "application/octet-stream")
