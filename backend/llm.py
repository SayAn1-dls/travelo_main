"""Provider-agnostic AI layer for TRAVELO.

Order of preference:
  1. EMERGENT_LLM_KEY  (+ emergentintegrations package installed)
  2. OPENAI_API_KEY    (talks to the OpenAI REST API directly via httpx)
  3. None              (callers fall back to the built-in local NOMAD engine)
"""
import base64
import json
import logging
import os
from typing import AsyncIterator, List, Optional

import httpx

logger = logging.getLogger("travelo.llm")

OPENAI_BASE = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")


def _emergent_key() -> Optional[str]:
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        return None
    try:
        import emergentintegrations  # noqa: F401
    except ImportError:
        return None
    return key


def _openai_key() -> Optional[str]:
    return os.environ.get("OPENAI_API_KEY") or None


def provider() -> Optional[str]:
    if _emergent_key():
        return "emergent"
    if _openai_key():
        return "openai"
    return None


def available() -> bool:
    return provider() is not None


def _chat_model() -> str:
    return os.environ.get("LLM_MODEL", "gpt-4o-mini")


# ---------------------------------------------------------------- streaming chat
async def stream_chat(system: str, prompt: str, session_id: str) -> AsyncIterator[str]:
    """Yield text deltas. Raises RuntimeError when no provider is configured."""
    p = provider()
    if p == "emergent":
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
        chat = LlmChat(
            api_key=_emergent_key(), session_id=session_id, system_message=system,
        ).with_model("openai", "gpt-5.4")
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                yield ev.content
            elif isinstance(ev, StreamDone):
                break
        return
    if p == "openai":
        body = {
            "model": _chat_model(),
            "stream": True,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        headers = {"Authorization": f"Bearer {_openai_key()}"}
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", f"{OPENAI_BASE}/chat/completions", json=body, headers=headers) as r:
                if r.status_code >= 400:
                    detail = (await r.aread()).decode(errors="ignore")[:300]
                    raise RuntimeError(f"OpenAI error {r.status_code}: {detail}")
                async for line in r.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        delta = json.loads(payload)["choices"][0]["delta"].get("content")
                    except (ValueError, KeyError, IndexError):
                        continue
                    if delta:
                        yield delta
        return
    raise RuntimeError("No LLM key configured")


# ---------------------------------------------------------------- one-shot chat (text or vision)
async def complete(system: str, prompt: str, images_b64: Optional[List[str]] = None, session_id: str = "x") -> str:
    p = provider()
    if p == "emergent":
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        chat = LlmChat(api_key=_emergent_key(), session_id=session_id, system_message=system).with_model("openai", "gpt-5.4")
        attachments = [ImageContent(image_base64=i) for i in (images_b64 or [])]
        response = await chat.send_message(UserMessage(text=prompt, file_contents=attachments or None))
        return response if isinstance(response, str) else str(response)
    if p == "openai":
        content: list = [{"type": "text", "text": prompt}]
        for img in images_b64 or []:
            content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}})
        body = {
            "model": _chat_model(),
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": content if images_b64 else prompt},
            ],
        }
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(f"{OPENAI_BASE}/chat/completions", json=body,
                                  headers={"Authorization": f"Bearer {_openai_key()}"})
        if r.status_code >= 400:
            raise RuntimeError(f"OpenAI error {r.status_code}: {r.text[:300]}")
        return r.json()["choices"][0]["message"]["content"] or ""
    raise RuntimeError("No LLM key configured")


# ---------------------------------------------------------------- speech to text (whisper-1)
async def transcribe(path: str, language: Optional[str], prompt: str) -> str:
    p = provider()
    if p == "emergent":
        from emergentintegrations.llm.openai import OpenAISpeechToText
        stt = OpenAISpeechToText(api_key=_emergent_key())
        kwargs = {"model": "whisper-1", "response_format": "json", "prompt": prompt}
        if language:
            kwargs["language"] = language
        with open(path, "rb") as f:
            resp = await stt.transcribe(file=f, **kwargs)
        return (getattr(resp, "text", "") or "").strip()
    if p == "openai":
        data = {"model": "whisper-1", "response_format": "json", "prompt": prompt}
        if language:
            data["language"] = language
        with open(path, "rb") as f:
            files = {"file": (os.path.basename(path), f.read())}
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(f"{OPENAI_BASE}/audio/transcriptions", data=data, files=files,
                                  headers={"Authorization": f"Bearer {_openai_key()}"})
        if r.status_code >= 400:
            raise RuntimeError(f"OpenAI error {r.status_code}: {r.text[:300]}")
        return (r.json().get("text") or "").strip()
    raise RuntimeError("No speech-to-text key configured")


def b64_payload(data_url: str) -> str:
    """Strip a data: URL prefix and validate the base64."""
    raw = data_url.split(",")[-1]
    base64.b64decode(raw, validate=False)
    return raw
