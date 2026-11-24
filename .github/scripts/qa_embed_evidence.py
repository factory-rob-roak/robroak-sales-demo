#!/usr/bin/env python3
"""Turn the QA agent's report into the PR comment body.

The agent references evidence files with placeholder lines such as
``[[evidence:<run-id>/03-keyboard-placement.gif]]`` and never handles tokens.
This script uploads each referenced file to GitHub's user-attachments store with
QA_EVIDENCE_TOKEN and embeds the returned URL: images as ``![name](url)``, videos
as a bare URL on its own line (GitHub only renders the player that way). When the
token is missing or an upload fails, the placeholder points to the workflow
artifact instead. It never fails the workflow over evidence.

Usage: qa_embed_evidence.py <report.md> <comment-body.md> [<results-dir>]
"""

from __future__ import annotations

import http.client
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

MARKER = "<!-- qa-report -->"
COMMENT_LIMIT = 65000  # GitHub rejects comment bodies over 65,536 characters.
UPLOAD_ENDPOINT = "https://uploads.github.com/user-attachments/assets"
PLACEHOLDER = re.compile(r"\[\[evidence:\s*([^\]\s][^\]]*?)\s*\]\]")
IMAGE_TYPES = {".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
VIDEO_TYPES = {".webm": "video/webm", ".mp4": "video/mp4", ".mov": "video/quicktime"}
ALLOWED_URL_HOSTS = ("github.com",)
ALLOWED_URL_HOST_SUFFIXES = (".githubusercontent.com",)


class UploadError(Exception):
    pass


def upload(path: Path, content_type: str, token: str, repo_id: str) -> str:
    query = urllib.parse.urlencode(
        {"name": path.name, "content_type": content_type, "repository_id": repo_id}
    )
    try:
        data = path.read_bytes()
    except OSError as error:
        raise UploadError(type(error).__name__) from None
    request = urllib.request.Request(
        f"{UPLOAD_ENDPOINT}?{query}",
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
            "Accept": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        detail = ""
        try:
            detail = json.load(error).get("message", "")
        except (ValueError, AttributeError, OSError, http.client.HTTPException):
            pass
        raise UploadError(f"HTTP {error.code} {detail}".strip()) from None
    # Connection resets, TLS errors, and truncated responses are not all wrapped in URLError.
    except (OSError, http.client.HTTPException, ValueError) as error:
        raise UploadError(type(error).__name__) from None
    url = payload.get("url") if isinstance(payload, dict) else None
    if not isinstance(url, str) or not is_trusted_url(url):
        raise UploadError("response had no usable asset URL")
    return url


def is_trusted_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or ""
    return parsed.scheme == "https" and (
        host in ALLOWED_URL_HOSTS or host.endswith(ALLOWED_URL_HOST_SUFFIXES)
    )


def safe_name(text: str) -> str:
    return re.sub(r"[\[\]()`<>]", "", text)


class Embedder:
    def __init__(self, results_dir: Path, artifact_url: str, run_url: str) -> None:
        self.results_dir = results_dir.resolve()
        self.artifact_url = artifact_url
        self.run_url = run_url
        self.token = os.environ.get("QA_EVIDENCE_TOKEN", "").strip()
        self.repo_id = os.environ.get("REPO_ID", "").strip()
        try:
            self.max_bytes = int(float(os.environ.get("MAX_UPLOAD_MB") or 10) * 1024 * 1024)
        except ValueError:
            self.max_bytes = 10 * 1024 * 1024
        self.cache: dict[Path, str] = {}
        self.failures: list[str] = []
        self.fallback_count = 0
        self.embedded_count = 0

    def artifact_note(self, name: str) -> str:
        self.fallback_count += 1
        where = f"[QA artifact]({self.artifact_url})" if self.artifact_url else f"[workflow run]({self.run_url}) artifacts"
        return f"`{safe_name(name)}` (in the {where})"

    def replace(self, match: re.Match[str]) -> str:
        relative = match.group(1)
        candidate = (self.results_dir / relative).resolve()
        name = candidate.name
        if self.results_dir not in candidate.parents:
            self.failures.append(f"`{safe_name(relative)}`: path is outside qa-results")
            return f"`{safe_name(relative)}` (invalid evidence path)"
        if not candidate.is_file() or candidate.stat().st_size == 0:
            self.failures.append(f"`{safe_name(relative)}`: file missing or empty")
            return f"`{safe_name(name)}` (file missing)"
        suffix = candidate.suffix.lower()
        content_type = IMAGE_TYPES.get(suffix) or VIDEO_TYPES.get(suffix)
        if content_type is None or not self.token or not self.repo_id:
            return self.artifact_note(name)
        if candidate.stat().st_size > self.max_bytes:
            self.failures.append(f"`{safe_name(name)}`: larger than the upload limit")
            return self.artifact_note(name)
        if candidate not in self.cache:
            try:
                self.cache[candidate] = upload(candidate, content_type, self.token, self.repo_id)
            except UploadError as error:
                self.failures.append(f"`{safe_name(name)}`: {error}")
                return self.artifact_note(name)
        url = self.cache[candidate]
        self.embedded_count += 1
        if suffix in VIDEO_TYPES:
            return f"\n\n{url}\n\n"
        return f"![{safe_name(name)}]({url})"

    def notes(self) -> list[str]:
        notes = []
        if self.fallback_count and not self.token:
            notes.append(
                "> [!NOTE]\n> Evidence is not shown inline because the `QA_EVIDENCE_TOKEN` secret is not set."
                " Screenshots and GIFs are in the downloadable artifact."
            )
        if self.failures:
            items = "\n".join(f"> - {failure}" for failure in self.failures)
            notes.append(
                "> [!WARNING]\n> Some evidence could not be embedded; it is in the downloadable artifact.\n" + items
            )
        return notes


def build_body(report_path: Path, results_dir: Path) -> str:
    artifact_url = os.environ.get("ARTIFACT_URL", "").strip()
    run_url = os.environ.get("RUN_URL", "").strip()
    if report_path.is_file() and report_path.read_text(encoding="utf-8").strip():
        report = report_path.read_text(encoding="utf-8").strip()
    else:
        report = (
            "## QA Report\n\n:no_entry: The QA run produced no report. "
            f"Check the [workflow run]({run_url}) log."
        )
    if not report.lstrip().startswith("## QA Report"):
        report = "## QA Report\n\n" + report

    embedder = Embedder(results_dir, artifact_url, run_url)
    report = PLACEHOLDER.sub(embedder.replace, report)
    report = re.sub(r"\n{3,}", "\n\n", report)

    notes = embedder.notes()
    if notes:
        heading, _, rest = report.partition("\n")
        report = heading + "\n\n" + "\n\n".join(notes) + "\n" + rest

    links = []
    if artifact_url:
        links.append(f"[Download QA artifact]({artifact_url})")
    if run_url:
        links.append(f"[Workflow run]({run_url})")
    footer = "\n\n---\n\n" + " · ".join(links) if links else ""

    body = f"{MARKER}\n{report}"
    if len(body) + len(footer) > COMMENT_LIMIT:
        cut = COMMENT_LIMIT - len(footer) - 200
        body = body[:cut] + "\n\n_Report truncated; the full report is in the artifact._"
    print(
        f"Embedded {embedder.embedded_count} evidence reference(s); "
        f"{embedder.fallback_count} pointed to the artifact; {len(embedder.failures)} problem(s)."
    )
    return body + footer + "\n"


def main(argv: list[str]) -> int:
    if len(argv) not in (3, 4):
        print(__doc__, file=sys.stderr)
        return 2
    report_path = Path(argv[1])
    out_path = Path(argv[2])
    results_dir = Path(argv[3]) if len(argv) == 4 else report_path.parent
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_body(report_path, results_dir), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
