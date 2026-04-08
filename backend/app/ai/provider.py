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
import re
import httpx
from app.core.config import settings


class AIProvider:
    def __init__(self):
        self.base_url = settings.AI_BASE_URL.rstrip("/")
        self.model = settings.AI_MODEL
        self.api_key = settings.AI_API_KEY

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Send a completion request to the configured AI provider."""
        if not self.api_key:
            raise ValueError("AI_API_KEY is not set in .env")

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

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def complete_json(self, system_prompt: str, user_prompt: str) -> dict:
        """
        Complete and parse JSON response.
        Does NOT use response_format: json_object since not all providers/models
        support it (including Gemini 2.5 Pro). Instead we enforce via prompt
        and parse defensively.
        """
        enforced_system = (
            system_prompt.strip()
            + "\n\nIMPORTANT: Respond with valid JSON only. "
            "Do not include any text before or after the JSON. "
            "Do not wrap in markdown code blocks."
        )

        raw = await self.complete(enforced_system, user_prompt)
        return self._parse_json(raw)

    def _parse_json(self, raw: str) -> dict:
        """Robustly parse JSON from model output, handling common formatting issues."""
        text = raw.strip()

        # Remove markdown code fences: ```json ... ``` or ``` ... ```
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        text = text.strip()

        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to extract JSON object from surrounding text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # Safe fallback — app never crashes on bad AI output
        return {"error": "Failed to parse AI response", "raw": text[:500]}


# Singleton — import this everywhere
ai = AIProvider()