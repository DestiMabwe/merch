"""File storage abstraction: "store a file, get back a retrievable URL."

`LocalFileStorage` is the only implementation for now (dev/local disk). A
future S3/R2-compatible backend can be added as another `FileStorage`
subclass and swapped in via `get_storage()` without touching callers.
"""

import os
import uuid
from pathlib import Path

from fastapi import UploadFile

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads"))
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")


class FileStorage:
    def save(self, upload_file: UploadFile, folder: str) -> str:
        raise NotImplementedError


class LocalFileStorage(FileStorage):
    def save(self, upload_file: UploadFile, folder: str) -> str:
        extension = Path(upload_file.filename or "").suffix
        filename = f"{uuid.uuid4().hex}{extension}"

        target_dir = UPLOAD_DIR / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / filename
        with target_path.open("wb") as f:
            f.write(upload_file.file.read())

        return f"{PUBLIC_BASE_URL}/uploads/{folder}/{filename}"


def get_storage() -> FileStorage:
    return LocalFileStorage()
