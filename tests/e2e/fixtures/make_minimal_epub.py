from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile


output = Path(__file__).with_name("minimal.epub")

container = """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>"""

package = """<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">miraf-test-book</dc:identifier>
    <dc:title>The Quiet Chapter</dc:title>
    <dc:creator>Miraf</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="chapter"/></spine>
</package>"""

navigation = """<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Contents</title></head><body>
<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol><li><a href="chapter.xhtml">A quiet beginning</a></li></ol></nav>
</body></html>"""

chapter = """<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>A quiet beginning</title></head><body>
<h1>A quiet beginning</h1>
<p>Reading begins with a little room around the words. Miraf keeps that room calm, clear, and close at hand.</p>
<p>This small test book verifies importing, rendering, navigation, typography, and reading progress without relying on a network resource.</p>
<h2>The next page</h2>
<p>A good reader disappears when the story begins. Preferences remain nearby, and the library remembers the exact place where reading stopped.</p>
</body></html>"""

with ZipFile(output, "w") as archive:
    archive.writestr("mimetype", "application/epub+zip", compress_type=ZIP_STORED)
    archive.writestr("META-INF/container.xml", container, compress_type=ZIP_DEFLATED)
    archive.writestr("OEBPS/content.opf", package, compress_type=ZIP_DEFLATED)
    archive.writestr("OEBPS/nav.xhtml", navigation, compress_type=ZIP_DEFLATED)
    archive.writestr("OEBPS/chapter.xhtml", chapter, compress_type=ZIP_DEFLATED)

print(output)
