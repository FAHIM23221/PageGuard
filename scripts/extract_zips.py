#!/usr/bin/env python3
from pathlib import Path, PurePosixPath
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "incoming-zips"
MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
MAX_EXPANDED_BYTES = 500 * 1024 * 1024

def safe_parts(name):
    name = name.replace("\\", "/")
    p = PurePosixPath(name)
    if p.is_absolute() or not p.parts or any(
        x in ("", ".", "..") for x in p.parts
    ):
        raise ValueError(f"Unsafe ZIP path: {name}")
    if p.parts[0].endswith(":"):
        raise ValueError(f"Drive path not allowed: {name}")
    return p.parts

def process(archive):
    if archive.stat().st_size > MAX_ARCHIVE_BYTES:
        raise ValueError("ZIP exceeds 100 MB")

    with zipfile.ZipFile(archive) as zf:
        infos = [i for i in zf.infolist() if not i.is_dir()]
        if not infos:
            raise ValueError("ZIP is empty")

        parsed = [(i, safe_parts(i.filename)) for i in infos]

        if sum(i.file_size for i, _ in parsed) > MAX_EXPANDED_BYTES:
            raise ValueError("Expanded ZIP exceeds 500 MB")

        first = {parts[0] for _, parts in parsed}
        strip_root = (
            len(first) == 1
            and all(len(parts) > 1 for _, parts in parsed)
        )

        written = 0

        for info, parts in parsed:
            if strip_root:
                parts = parts[1:]

            if not parts:
                continue

            if parts[0] == ".git" or parts[:2] == (
                ".github", "workflows"
            ):
                print(f"Skipping protected path: {info.filename}")
                continue

            target = ROOT.joinpath(*parts)

            if ROOT.resolve() not in target.resolve().parents:
                raise ValueError("Unsafe extraction path")

            mode = (info.external_attr >> 16) & 0o170000
            if mode == 0o120000:
                raise ValueError("Symlink not allowed")

            target.parent.mkdir(parents=True, exist_ok=True)

            with zf.open(info) as source, target.open("wb") as dest:
                while True:
                    chunk = source.read(1024 * 1024)
                    if not chunk:
                        break
                    dest.write(chunk)

            written += 1

        if written == 0:
            raise ValueError("No files extracted")

    archive.unlink()
    print(f"Extracted {written} files from {archive.name}")

def main():
    INBOX.mkdir(exist_ok=True)

    for archive in sorted(INBOX.glob("*.zip")):
        process(archive)

if __name__ == "__main__":
    main()
