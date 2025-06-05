# Contributing to LingUBible 🤝

[![English](https://img.shields.io/badge/Language-English-blue)](CONTRIBUTING.md)
[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red)](zh-TW/CONTRIBUTING.md)
[![简体中文](https://img.shields.io/badge/Language-简体中文-green)](zh-CN/CONTRIBUTING.md)

Thank you for your interest in contributing to LingUBible! This guide will help you get started.

## 🌍 Multilingual Documentation

LingUBible supports multiple languages. When contributing to documentation:

### Language Structure
```
docs/
├── README.md                 # English (default)
├── setup/                    # English documentation
├── features/
├── deployment/
├── testing/
├── zh-TW/                    # Traditional Chinese
│   ├── README.md
│   ├── setup/
│   ├── features/
│   ├── deployment/
│   └── testing/
└── zh-CN/                    # Simplified Chinese
    ├── README.md
    ├── setup/
    ├── features/
    ├── deployment/
    └── testing/
```

### Adding Language Badges

All documentation files should include language switcher badges at the top:

```markdown
[![English](https://img.shields.io/badge/Language-English-blue)](README.md)
[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red)](zh-TW/README.md)
[![简体中文](https://img.shields.io/badge/Language-简体中文-green)](zh-CN/README.md)
```

Adjust the relative paths based on the file location.

## 📝 Documentation Guidelines

### 1. Creating New Documentation

When creating new documentation:

1. **Start with English** - Create the English version first in the appropriate `docs/` subdirectory
2. **Add Language Badges** - Include language switcher badges at the top
3. **Create Translations** - Add corresponding files in `docs/zh-TW/` and `docs/zh-CN/`
4. **Update Indexes** - Update the README.md files in each language directory

### 2. Translation Guidelines

- **Maintain Structure** - Keep the same heading structure across languages
- **Preserve Links** - Ensure internal links work correctly for each language
- **Cultural Context** - Adapt examples and references to be culturally appropriate
- **Technical Terms** - Use consistent technical terminology

### 3. File Naming Convention

- Use the same filename across all languages
- Keep filenames in English for consistency
- Use descriptive, kebab-case names (e.g., `setup-guide.md`)

## 🔧 Development Workflow

### Setting Up for Documentation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/campus-comment-verse.git
   cd campus-comment-verse
   ```

2. **Create documentation structure** (if needed)
   ```bash
   node scripts/create-multilingual-docs.js
   ```

3. **Make your changes**
   - Edit existing documentation
   - Add new documentation files
   - Ensure all languages are updated

4. **Test locally**
   - Check that all links work
   - Verify language badges are correct
   - Ensure consistent formatting

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b docs/your-feature-name
   ```

2. **Make your changes**
   - Follow the documentation guidelines above
   - Update all relevant language versions

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "docs: add/update documentation for [feature]"
   ```

4. **Push and create PR**
   ```bash
   git push origin docs/your-feature-name
   ```

5. **PR Review**
   - Our GitHub Actions will automatically check documentation structure
   - Reviewers will verify translations and consistency
   - Address any feedback before merging

## 🎯 What We're Looking For

### High Priority
- **Translation of existing documentation** to Traditional and Simplified Chinese
- **Setup and installation guides** in all languages
- **Feature documentation** with examples
- **Troubleshooting guides**

### Medium Priority
- **API documentation**
- **Architecture diagrams** with multilingual labels
- **Video tutorials** (with subtitles)

### Low Priority
- **Blog posts** about features
- **Community guidelines**
- **FAQ sections**

## 🛠️ Tools and Resources

### Helpful Tools
- **Google Translate** - For initial translations (always review and refine)
- **DeepL** - Often provides better translations than Google
- **Grammarly** - For English proofreading
- **Vale** - Linting tool for documentation

### Style Guides
- Use clear, concise language
- Prefer active voice over passive voice
- Use bullet points and numbered lists for clarity
- Include code examples where appropriate

## 🤔 Questions?

If you have questions about contributing:

1. **Check existing documentation** in your preferred language
2. **Search existing issues** on GitHub
3. **Create a new issue** with the `documentation` label
4. **Join our community** discussions

## 🙏 Recognition

Contributors to documentation will be:
- Listed in our contributors section
- Mentioned in release notes for significant contributions
- Invited to join our documentation team for ongoing contributors

---

Thank you for helping make LingUBible accessible to users worldwide! 🌍 