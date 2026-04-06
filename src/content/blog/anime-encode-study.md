---
title: アニメエンコードの研究(笑)
description: アニメエンコードの研究をしているログです。
pubDate: 2026-04-06T09:56
updatedDate: 2026-04-06T01:32:06.957Z
heroImage: 🎬
tags:
  - tag: 雑記
  - tag: エンコード
draft: false
author: samenoko
featured: false
---
## アニメエンコード

録画などを容量節約のために高効率なコーデックで再エンコードをすることです。

元データが大体1.4GBで大体300~400MBくらいに削減できるような設定を狙っていきます。

## 使用するツール

### NVEnc

[https://github.com/rigaya/NVEnc](https://github.com/rigaya/NVEnc)

rigaya氏が開発しているツールです。性能と画質を調査することを目的としているソフトウェアらしいですが、普通にツールとして利用可能です。
というかそっちが目的でしょ。しらんけど。

## コマンド

基本的なコマンドは次の通り。

```shell
nvencc -i "input.mkv" --avhw -c hevc --audio-codec libopus --audio-bitrate 128 -o "output.mkv"
```

各オプションの解説をしておきます。

### `-i “input.mkv“`

ファイルを入力します。

### `--avhw`

ファイルの読み込みにGPUを使用する。h264であれば使用可能。
CPUを使用するよりも高速です。

### `-c hevc`

使用するコーデックを選択します。割とどの環境でも再生可能なhevcを選択しています。

### `--audio-codec libopus --audio-bitrate 128`

音声をopusでエンコードする。ビットレートは128kbpsです。
Windowsのメディアプレイヤー以外なら再生できる。

### `-o "output.mkv"`

出力ファイル。

## 現時点で使用しているコマンド

私が今使っているコマンドです。

```shell
nvencc -i "input.mkv" --avhw -c hevc --qvbr 24 -u P6 --output-depth 10 --lookahead 32 -b 4 --bref-mode each --aq --aq-temporal --audio-codec libopus --audio-bitrate 128 -o "output.mkv"
```

追加されたオプションの解説をしておきます。

### `--qvbr 24`

品質ベースの可変ビットレートです。24はそこそこって感じの値です。
もし画質が悪いようであれば値を小さくするといいです。ファイルサイズは大きくなりますけどね。

### `-u P6`

プリセットです。P6は画質と速度のバランスが最も良い値らしいです。
最も品質がいいのはP7。速度はあまり変わらない(10fpsくらい下がるだけ)

### `--output-depth 10`

10bitで出力する。背景のグラデーションなどが美しくなる。気持ち圧縮効率も上がるらしいですよ。

### `--lookahead 32`

先読みするフレーム数です。ビットレートの配分がいい感じになるそうです。

### `-b 4 --bref-mode each`

Bフレームの設定です。Bフレームの参照をすべてのフレームにしています。

### `--aq --aq-temporal`

空間・時間的な最適量子化を有効にする。ビットレートの配分をいい感じにする設定。

というような設定です。

変換用のpyスクリプトも書いたので残しておく。

```python
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

EXTS = {
    ".mkv",
    ".mp4",
    ".m2ts"
}

def pick_input_dir() -> Path | None:
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    folder = filedialog.askdirectory(title="入力フォルダ")
    root.destroy()
    return Path(folder) if folder else None

def process_videos(input_dir: Path) -> int:
    output_dir = input_dir / "out"
    output_dir.mkdir(exist_ok=True)

    count = 0
    for path in input_dir.iterdir():
        if not path.is_file():
            continue
        if path.suffix.lower() not in EXTS:
            continue
        output_path = output_dir / path.name
        cmd = [
            "nvencc",
            "-i", str(path),
            "--avhw",
            "-c", "hevc",
            "--qvbr", "24",
            "-u", "P6",
            "--output-depth", "10",
            "--lookahead", "32",
            "-b", "4", "--bref-mode", "each",
            "--aq", "--aq-temporal",
            "--audio-codec", "libopus",
            "--audio-bitrate", "128",
            "-o", str(output_path)
        ]

        print("Running"," ".join(cmd))
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(f"Failed: {path.name}")
            continue
        count += 1
        print(f"Done: {path.name} -> {output_path}")

    return count

def main() -> None:
    input_dir = pick_input_dir()
    if input_dir is None:
        return

    if not input_dir.exists() or not input_dir.is_dir():
        messagebox.showerror("エラー", "有効なフォルダが選択されませんでした。")
        return

    processed = process_videos(input_dir=input_dir)
    messagebox.showinfo("完了",f"{processed}個の動画を処理しました")

if __name__ == "__main__":
    main()
```

## 比較する

### VMAF

FFMetricsというツールを使って入力ファイルとエンコードされたファイルの画質比較を行う。許容は95程度。
05:00~07:00の2分間を比較しています。

![](https://imag.samenoko.work/uploads/1775438628597-uxd7lj.png)

![](https://imag.samenoko.work/uploads/1775438695811-5657p3.png)

結果は画像の通りで、97。90以上が高画質とされています。つまりそこそこということですね。

### ファイルサイズ

元データが1.34GB、ビットレートが8147kbpsで、出力ファイルが242MB、ビットレートが1433kbpsです。

大体8割削減されたことになります。ダイエット大成功！！

## おわり

現時点でかなりの設定を出せています。
まぁ互換性とかライセンスの問題でHEVCとかAV1って再生できない環境も多いので、いい加減オープンでフリーな高効率なコーデックが出てほしいですね。

それでは！