#!/usr/bin/env python3
"""Prepare the explicitly selected TwinPast examples without editing source data.

Requires ffmpeg and ffprobe. Example:
  python prepare_media.py --repo-root /path/to/streaming --output /tmp/twinpast-web-assets-v2 --reuse-dir /path/to/streaming/Paper/website/dist
The selection file defaults to selection.json beside this script. AIR assets are
copied from --reuse-dir; they are never re-encoded. All source media remain read-only.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from fractions import Fraction
import json
from pathlib import Path
import shutil
import subprocess

LIMIT = 25 * 1024 * 1024


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt",
        "-of", "json", str(path),
    ]))


def poster(source, target, seconds):
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2",
        "-ss", str(seconds), "-i", str(source), "-frames:v", "1", "-an",
        "-vf", "scale='min(960,iw)':-2", "-q:v", "2", "-threads", "2", str(target),
    ], check=True)


def encode(job):
    source, target, original = job["source"], job["target"], job["original"]
    video = next(s for s in original["streams"] if s["codec_type"] == "video")
    fps = video["r_frame_rate"]
    temporary = target.with_name(target.stem + ".part" + target.suffix)
    is_webm = target.suffix == ".webm"
    for crf in ((35, 38, 41) if is_webm else (28, 30, 32)):
        codec_options = ([
            "-c:v", "libvpx-vp9", "-cpu-used", "4", "-row-mt", "1",
            "-crf", str(crf), "-b:v", "0",
        ] if is_webm else [
            "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
            "-movflags", "+faststart",
        ])
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2",
            "-i", str(source), "-map", "0:v:0", "-an",
            "-vf", "scale='min(960,iw)':-2", "-r", fps,
            *codec_options, "-pix_fmt", "yuv420p", "-threads", "2",
            "-map_metadata", "-1", str(temporary),
        ], check=True)
        if temporary.stat().st_size < LIMIT:
            break
    result = probe(temporary)
    duration = float(result["format"]["duration"])
    source_duration = float(original["format"]["duration"])
    if abs(duration - source_duration) > 1 / float(Fraction(fps)):
        raise ValueError(f"Duration changed: {target.name}")
    if temporary.stat().st_size >= LIMIT:
        raise ValueError(f"Asset exceeds 25 MiB: {target.name}")
    if any(s["codec_type"] == "audio" for s in result["streams"]):
        raise ValueError(f"Unexpected audio: {target.name}")
    encoded = next(s for s in result["streams"] if s["codec_type"] == "video")
    if Fraction(encoded["r_frame_rate"]) != Fraction(fps):
        raise ValueError(f"Frame rate changed: {target.name}")
    temporary.replace(target)
    record = {
        "file": f"assets/media/{target.name}", "duration_s": duration,
        "size_bytes": target.stat().st_size, "width": encoded["width"],
        "height": encoded["height"], "fps": float(Fraction(fps)), "crf": crf,
        "codec": encoded["codec_name"], "audio": False, "reused": False,
    }
    print(json.dumps(record), flush=True)
    return record


def copy_reused(reuse, output, relative):
    source, target = reuse / relative, output / relative
    if not source.is_file():
        raise FileNotFoundError(f"Missing reused asset: {source}")
    if not target.exists() or target.stat().st_size != source.stat().st_size or target.stat().st_mtime_ns != source.stat().st_mtime_ns:
        shutil.copy2(source, target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--reuse-dir", type=Path, required=True)
    parser.add_argument("--selection", type=Path, default=Path(__file__).with_name("selection.json"))
    parser.add_argument("--posters-only", action="store_true")
    parser.add_argument("--videos-only", action="store_true")
    parser.add_argument("--jobs", type=int, default=2)
    parser.add_argument("--formats", nargs="+", choices=("webm", "mp4"), default=["webm", "mp4"])
    args = parser.parse_args()
    if args.posters_only and args.videos_only:
        parser.error("Choose one preparation phase or omit both flags")
    repo, output, reuse = args.repo_root.resolve(), args.output.resolve(), args.reuse_dir.resolve()
    media = output / "assets/media"
    media.mkdir(parents=True, exist_ok=True)
    selection = json.loads(args.selection.read_text())
    reused_metadata_path = reuse / "metadata.json"
    reused_metadata = json.loads(reused_metadata_path.read_text()) if reused_metadata_path.exists() else {"videos": []}
    manifest = {row["pair_id"]: row for row in (json.loads(line) for line in (repo / "OUR_Benchmark/manifest.jsonl").read_text().splitlines())}
    cases, jobs, records = [], [], []
    for selected in selection["cases"]:
        pid, code = selected["pair_id"], selected["code"]
        definition = selection["categories"][code]
        annotation = repo / "OUR_Benchmark/annotations" / pid
        qa = json.loads((annotation / "qa.json").read_text())
        research = json.loads((annotation / "research.json").read_text())
        sources = {b: repo / "OUR_Benchmark" / manifest[pid]["media"][b]["path"] for b in ("A", "B")}
        originals = {b: probe(sources[b]) for b in ("A", "B")}
        durations = {b: float(originals[b]["format"]["duration"]) for b in ("A", "B")}
        if durations["A"] != durations["B"]:
            raise ValueError(f"Paired durations differ: {pid}")
        fps = float(Fraction(next(s for s in originals["A"]["streams"] if s["codec_type"] == "video")["r_frame_rate"]))
        suffix = selected["common_suffix_start_frame"] / fps
        if not (0 <= selected["evidence_time_s"] < suffix < durations["A"]):
            raise ValueError(f"Invalid selected timing: {pid}")
        stem = selected.get("asset_stem", pid)
        entry = {
            "code": code, "title": definition["title"], "count": definition["count"],
            "pair_id": pid, "example_label": selected["example_label"],
            "question": qa["question"], "options": qa["options"],
            "answer_a": qa["answer_a"], "answer_b": qa["answer_b"],
            "answer_texts": [qa["options"][ord(qa[key]) - ord("A")] for key in ("answer_a", "answer_b")],
            "display_question": selected.get("display_question", qa["question"]),
            "display_options": selected.get("display_options", qa["options"]),
            "suffix_start_s": suffix, "duration_s": durations["A"],
            "evidence_time_s": selected["evidence_time_s"],
            "poster_time_s": selected["poster_time_s"],
            "scene": selected["scene"], "source": selected.get("source", research["source_dataset"]),
            "shared_poster": f"assets/media/{stem}-shared.jpg",
            "shared_poster_time_s": selected["shared_poster_time_s"],
        }
        for branch in ("A", "B"):
            branch_stem = f"{stem}-{branch}"
            entry[f"video_{branch.lower()}"] = f"assets/media/{branch_stem}.mp4"
            entry[f"video_{branch.lower()}_webm"] = f"assets/media/{branch_stem}.webm"
            entry[f"poster_{branch.lower()}"] = f"assets/media/{branch_stem}.jpg"
            if selected.get("reuse_media"):
                for extension in ("mp4", "webm", "jpg"):
                    relative = f"assets/media/{branch_stem}.{extension}"
                    copy_reused(reuse, output, relative)
                    if extension != "jpg":
                        registered = next((v for v in reused_metadata["videos"] if v["file"] == relative), None)
                        if registered is None:
                            existing = probe(reuse / relative)
                            stream = next(s for s in existing["streams"] if s["codec_type"] == "video")
                            registered = {
                                "file": relative, "duration_s": float(existing["format"]["duration"]),
                                "size_bytes": (reuse / relative).stat().st_size,
                                "width": stream["width"], "height": stream["height"],
                                "fps": float(Fraction(stream["r_frame_rate"])), "crf": None,
                                "codec": stream["codec_name"],
                                "audio": any(s["codec_type"] == "audio" for s in existing["streams"]),
                            }
                        records.append({**registered, "reused": True})
            elif not args.videos_only:
                poster(sources[branch], media / f"{branch_stem}.jpg", selected["poster_time_s"][branch])
        if selected.get("reuse_media"):
            copy_reused(reuse, output, entry["shared_poster"])
        else:
            if not args.videos_only:
                poster(sources["A"], media / f"{stem}-shared.jpg", selected["shared_poster_time_s"])
            for extension in dict.fromkeys(args.formats):
                for branch in ("A", "B"):
                    jobs.append({"source": sources[branch], "target": media / f"{stem}-{branch}.{extension}", "original": originals[branch]})
        cases.append(entry)
    (output / "cases.json").write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n")
    print(f"Prepared {len(cases)} explicitly selected cases", flush=True)
    if args.posters_only:
        return
    with ThreadPoolExecutor(max_workers=max(1, min(args.jobs, 2))) as executor:
        futures = [executor.submit(encode, job) for job in jobs]
        records.extend(future.result() for future in as_completed(futures))
    metadata_path = output / "metadata.json"
    previous = json.loads(metadata_path.read_text()).get("videos", []) if metadata_path.exists() else []
    allowed = {c[k] for c in cases for k in ("video_a", "video_b", "video_a_webm", "video_b_webm")}
    combined = {item["file"]: item for item in previous if item["file"] in allowed and (output / item["file"]).exists()}
    combined.update({item["file"]: item for item in records})
    records = sorted(combined.values(), key=lambda item: item["file"])
    metadata = {
        "media_format": "Full-length H.264 MP4 and VP9 WebM preview derivatives; source frame rates and timing retained; no audio.",
        "selection": "selection.json", "max_parallel_encodes": min(max(args.jobs, 1), 2),
        "threads_per_encode": 2, "total_video_bytes": sum(item["size_bytes"] for item in records),
        "videos": records,
    }
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")


if __name__ == "__main__":
    main()
