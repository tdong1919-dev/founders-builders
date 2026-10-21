"""Check local HTML references and unique IDs without network access or dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if 'id' in values:
            self.ids.append(values['id'])
        for key in ('href', 'src'):
            if key in values:
                self.links.append(values[key])


def main():
    root = Path(__file__).resolve().parent.parent
    pages = {}
    errors = []
    for path in sorted(root.glob('*.html')):
        page = Page()
        page.feed(path.read_text())
        pages[path] = page
        if len(page.ids) != len(set(page.ids)):
            errors.append(f'{path.name}: duplicate IDs')
    for path, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            if url.path.startswith('/'):
                target = (root / unquote(url.path.lstrip('/'))).resolve()
            elif url.path:
                target = (path.parent / unquote(url.path)).resolve()
            else:
                target = path
            if not target.exists():
                errors.append(f'{path.name}: missing local target {link}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f'{path.name}: missing anchor {link}')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'{len(pages)} HTML pages: local assets, links, anchors and unique IDs pass.')


if __name__ == '__main__':
    main()
