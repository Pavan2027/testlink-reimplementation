"""
AI Provider abstraction layer.
To swap models, change AI_BASE_URL, AI_MODEL, and AI_API_KEY in your .env file.
The base URL should be OpenAI-compatible (most providers support this).

Examples:
  Gemini:  https://generativelanguage.googleapis.com/v1beta/openai
  Groq:    https://api.groq.com/openai/v1
  Ollama:  http://localhost:11434/v1
  OpenAI:  https://api.openai.com/v1
"""
import json
import httpx
from typing import Optional
from app.core.config import settings


class AIProvider:
    def __init__(self):
        self.base_url = settings.AI_BASE_URL
        self.model = settings.AI_MODEL
        self.api_key = settings.AI_API_KEY

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = False,
    ) -> str:
        """Send a completion request to the configured AI provider."""
        if not self.api_key:
            return '{"error": "AI_API_KEY not configured"}'

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def complete_json(self, system_prompt: str, user_prompt: str) -> dict:
        """Complete and parse JSON response."""
        raw = await self.complete(system_prompt, user_prompt, json_mode=True)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Strip markdown fences if model wraps in ```json
            cleaned = raw.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)


# Singleton instance — import this everywhere
ai = AIProvider()