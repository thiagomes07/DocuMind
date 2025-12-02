import os

ROOT_DIR = "."  # Diretório raiz do projeto
OUTPUT_FILE = "repo_dump.md"

# Liste aqui qualquer arquivo ou diretório que você quer ignorar
IGNORE_PATTERNS = [
    ".git",
    "__pycache__",
    ".dockerignore",
    ".gitignore",
    "repo_dump.md",
    "README.md",
    "scan_back.py",
]


def should_ignore(path):
    return any(pattern in path for pattern in IGNORE_PATTERNS)


def collect_files(root):
    file_paths = []
    for dirpath, _, filenames in os.walk(root):
        # Ignorar diretórios com match em IGNORE_PATTERNS
        if should_ignore(dirpath):
            continue

        for f in filenames:
            full_path = os.path.join(dirpath, f)

            # Ignorar arquivos
            if should_ignore(full_path):
                continue

            file_paths.append(full_path)

    # Ordenação respeitando estrutura
    return sorted(file_paths, key=lambda x: x.lower())


def read_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().strip()
            return content
    except Exception:
        return ""


def generate_markdown(file_data):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as md:
        md.write("# 📁 Dump Completo do Repositório\n\n")

        for path, content in file_data:
            md.write(f"## `{path}`:\n\n")

            if content:
                md.write("```\n")
                md.write(content)
                md.write("\n```\n")
            else:
                md.write("_Arquivo vazio_\n")

            md.write("\n---\n\n")

        # Resumo final
        md.write("\n# 📌 Resumo Geral\n\n")

        md.write("## Arquivos com conteúdo:\n")
        for path, content in file_data:
            if content:
                md.write(f"- {path}\n")

        md.write("\n## Arquivos vazios:\n")
        for path, content in file_data:
            if not content:
                md.write(f"- {path}\n")

    print(f"Arquivo Markdown gerado: {OUTPUT_FILE}")


def main():
    files = collect_files(ROOT_DIR)

    file_data = []
    for f in files:
        content = read_file(f)
        file_data.append((f, content))

    generate_markdown(file_data)


if __name__ == "__main__":
    main()
