#!/usr/bin/env python3
"""Tworzy z szablonu APK nowy szablon: inny pakiet, nazwa aplikacji i ikona."""
import sys, struct, zipfile, io
src, out, pkg, label, icon = sys.argv[1:6]
z = zipfile.ZipFile(src)
d = z.read('AndroidManifest.xml')
# chunk XML: type(2) hs(2) size(4) ; potem pula napisów
off = 8
t, hs, sz, n, ns, fl, ss, sts = struct.unpack('<HHIIIIII', d[off:off + 28])
assert t == 1 and fl & 0x100 == 0, 'oczekiwano puli UTF-16'
offs = struct.unpack('<%dI' % n, d[off + 28:off + 28 + 4 * n])
base = off + ss
strs = []
for o in offs:
    p = base + o
    ln = struct.unpack('<H', d[p:p + 2])[0]; p += 2
    if ln & 0x8000:
        ln = ((ln & 0x7fff) << 16) | struct.unpack('<H', d[p:p + 2])[0]; p += 2
    strs.append(d[p:p + ln * 2].decode('utf-16le'))
print('napisy:', strs)
rep = {'pl.bunkier.game': pkg, 'B.U.N.K.I.E.R.': label}
new = [rep.get(s, s) for s in strs]
assert any(a != b for a, b in zip(strs, new))
blob = b''; noffs = []
for s in new:
    noffs.append(len(blob)); b = s.encode('utf-16le')
    blob += struct.pack('<H', len(s)) + b + b'\0\0'
while len(blob) % 4: blob += b'\0'
newhs = 28 + 4 * n
pool = struct.pack('<HHIIIIII', 1, 28, newhs + len(blob), n, 0, 0, newhs, 0) + struct.pack('<%dI' % n, *noffs) + blob
rest = d[off + sz:]
body = pool + rest
dd = d[:4] + struct.pack('<I', 8 + len(body)) + body
assert struct.unpack('<I', d[4:8])[0] == len(d)
o = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for it in z.infolist():
    data = z.read(it.filename)
    if it.filename == 'AndroidManifest.xml': data = dd
    if it.filename == 'res/drawable/icon.png': data = open(icon, 'rb').read()
    o.writestr(it.filename, data)
o.close(); print('OK', out)
