import os

ROOT_DIR = "."  # Diretório raiz
OUTPUT_FILE = "repo_dump_backend.md"

# Pastas e arquivos a serem ignorados
IGNORE_PATTERNS = [
    ".git",
    "__pycache__",
    "node_modules",
    ".dockerignore",
    ".gitignore",
    ".env",
    ".env.example",
    "package-lock.json",
    "dist",
    "coverage",
    "test",
    OUTPUT_FILE,
]

# Extensões permitidas
ALLOWED_EXTENSIONS = [
    ".ts", ".js", ".mjs", ".json", ".prisma", ""
]

def should_ignore(path):
    """Verifica se o caminho deve ser ignorado."""
    path = path.replace("\\", "/")
    return any(pattern in path for pattern in IGNORE_PATTERNS)


def has_allowed_extension(path):
    ext = os.path.splitext(path)[1]
    return ext in ALLOWED_EXTENSIONS


def collect_files(root):
    file_paths = []

    for dirpath, _, filenames in os.walk(root):
        normalized = dirpath.replace("\\", "/")
        if should_ignore(normalized):
            continue

        for f in filenames:
            full_path = os.path.join(dirpath, f).replace("\\", "/")

            if should_ignore(full_path):
                continue

            if not has_allowed_extension(full_path):
                continue

            file_paths.append(full_path)

    return sorted(file_paths, key=str.lower)


def read_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    except Exception:
        return ""


def generate_markdown(file_data):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as md:
        md.write("# 📁 Dump Completo do Backend (NestJS)\n\n")

        # 🔥 LISTA APENAS ARQUIVOS COM CONTEÚDO
        for path, content in file_data:
            if not content:  # <-- remove do dump
                continue

            is_ts = path.endswith(".ts")
            md.write(f"## `{path}`\n\n")
            md.write("```ts\n" if is_ts else "```\n")
            md.write(content)
            md.write("\n```\n")
            md.write("\n---\n\n")

        # Resumo opcional
        md.write("\n# 📌 Resumo\n\n")

        md.write("## ✔ Arquivos com conteúdo:\n")
        for path, content in file_data:
            if content:
                md.write(f"- {path}\n")

        md.write("\n## ⚠ Arquivos vazios:\n")
        for path, content in file_data:
            if not content:
                md.write(f"- {path}\n")

    print(f"📄 Arquivo gerado: {OUTPUT_FILE}")


def main():
    files = collect_files(ROOT_DIR)
    file_data = [(path, read_file(path)) for path in files]
    generate_markdown(file_data)


if __name__ == "__main__":
    main()