"""File storage abstraction: "store a file, get back a retrievable URL."

`LocalFileStorage` writes to local disk (dev only — most hosts, including
Render's free/starter web services, have ephemeral disks, so anything
written there is lost on redeploy or restart). `S3FileStorage` writes to
an S3-compatible bucket (Cloudflare R2, AWS S3, etc.) and is used whenever
`S3_BUCKET` is configured. `get_storage()` picks between them so callers
never need to know which one is active.
"""

import os
import uuid
from pathlib import Path

import boto3
from fastapi import UploadFile

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads"))
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")

S3_BUCKET = os.environ.get("S3_BUCKET")
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL")
S3_ACCESS_KEY_ID = os.environ.get("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.environ.get("S3_SECRET_ACCESS_KEY")
S3_PUBLIC_BASE_URL = os.environ.get("S3_PUBLIC_BASE_URL", "").rstrip("/")


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


class S3FileStorage(FileStorage):
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT_URL,
            aws_access_key_id=S3_ACCESS_KEY_ID,
            aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        )

    def save(self, upload_file: UploadFile, folder: str) -> str:
        extension = Path(upload_file.filename or "").suffix
        key = f"{folder}/{uuid.uuid4().hex}{extension}"

        self._client.upload_fileobj(
            upload_file.file,
            S3_BUCKET,
            key,
            ExtraArgs={"ContentType": upload_file.content_type or "application/octet-stream"},
        )

        return f"{S3_PUBLIC_BASE_URL}/{key}"


def get_storage() -> FileStorage:
    if S3_BUCKET:
        return S3FileStorage()
    return LocalFileStorage()
