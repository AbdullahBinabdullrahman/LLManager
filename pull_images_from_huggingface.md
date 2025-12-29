# Pulling Images from Hugging Face (Complete Guide)

This document explains **all supported ways to pull image files from Hugging Face**, whether they come from:
- datasets
- model repositories
- public or private sources

It is written to be practical for **data pipelines, dashboards, and ML workflows**.

---

## 1) Understand where images live on Hugging Face

Hugging Face hosts images in **two main places**:

### A) Dataset repositories
- URL pattern:
  ```
  https://huggingface.co/datasets/<ORG>/<DATASET>
  ```
- Typically used for:
  - training data
  - evaluation images
  - multimodal datasets

### B) Model repositories
- URL pattern:
  ```
  https://huggingface.co/<ORG>/<MODEL>
  ```
- Images may be:
  - sample inputs
  - documentation assets
  - test fixtures

Both are backed by **Git + Git LFS**.

---

## 2) Download a single image (fastest)

If you know the exact file path, use the **resolve** URL.

### URL format
```
https://huggingface.co/<ORG>/<REPO>/resolve/main/<path/to/image>
```

### Example
```bash
wget -O image.png \
  https://huggingface.co/datasets/<ORG>/<DATASET>/resolve/main/images/sample.png
```

This works for **public repos**.

---

## 3) Download images with authentication (private repos)

### Option A: Login once (recommended)
```bash
pip install huggingface_hub
huggingface-cli login
```

### Option B: Token via environment variable
```bash
export HF_TOKEN="hf_xxxxxxxxxxxxxxxxx"
```

Then use `huggingface-cli download`:

```bash
huggingface-cli download <ORG>/<REPO> images/sample.png --local-dir .
```

---

## 4) Clone entire repo (best for many images)

Because Hugging Face uses **Git LFS**, this is the most reliable way to pull lots of images.

### Install Git LFS
```bash
git lfs install
```

### Clone dataset repo
```bash
git clone https://huggingface.co/datasets/<ORG>/<DATASET>
```

### Clone model repo
```bash
git clone https://huggingface.co/<ORG>/<MODEL>
```

All images will be downloaded automatically.

---

## 5) Programmatic download (Python – recommended for pipelines)

### Install dependencies
```bash
pip install datasets pillow
```

### Load dataset and access images
```python
from datasets import load_dataset

ds = load_dataset("<ORG>/<DATASET>", split="train")
img = ds[0]["image"]  # PIL.Image
img.save("example.png")
```

### Export all images
```python
from datasets import load_dataset
import os

ds = load_dataset("<ORG>/<DATASET>", split="train")
os.makedirs("images", exist_ok=True)

for i, row in enumerate(ds):
    row["image"].save(f"images/{i:06d}.png")
```

---

## 6) Download files without loading dataset into memory

Useful for **large datasets**.

```bash
pip install huggingface_hub
```

```bash
huggingface-cli download <ORG>/<DATASET> \
  --repo-type dataset \
  --local-dir ./data \
  --local-dir-use-symlinks False
```

---

## 7) When images are stored as URLs (not files)

Some datasets store image URLs instead of files.

```python
import requests
from datasets import load_dataset

ds = load_dataset("<ORG>/<DATASET>", split="train")

url = ds[0]["image_url"]
img = requests.get(url).content

with open("image.jpg", "wb") as f:
    f.write(img)
```

---

## 8) Common mistakes (avoid these)

❌ Trying to use `ollama pull` for images  
❌ Expecting Hugging Face to behave like a Docker registry  
❌ Using PyTorch checkpoints when you need raw image files  
❌ Forgetting Git LFS  

---

## 9) Decision table

| Use case | Best method |
|--------|------------|
| One image | `wget resolve` |
| Many images | `git clone` |
| ML pipeline | `datasets` |
| Private repo | `huggingface-cli login` |
| Large dataset | `huggingface-cli download` |

---

## 10) Practical recommendation

For **dashboards / services**:
- Use `huggingface-cli download` or `git clone`
- Cache images locally
- Never fetch images live in production

For **training pipelines**:
- Use `datasets`
- Save images once
- Version your dataset snapshot

---

## TL;DR

- Hugging Face ≠ Ollama
- Images are files, not models
- Use Git LFS or datasets API
- Authenticate once, reuse everywhere

---

**End of file**
