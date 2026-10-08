#!/usr/bin/env python3
"""Buduje podpisany APK (v1 + v2) z szablonu android/template.apk i index.html."""
import sys, io, zipfile, struct, hashlib, os, datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import pkcs7
import base64

tpl, html, out, keydir = sys.argv[1:5]
os.makedirs(keydir, exist_ok=True)
kp, cp = os.path.join(keydir, 'bunkier.key.pem'), os.path.join(keydir, 'bunkier.cert.pem')
if not os.path.exists(kp):
    key = rsa.generate_private_key(65537, 2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'BUNKIER'), x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'GrzespTG')])
    now = datetime.datetime(2026, 1, 1)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now).not_valid_after(now + datetime.timedelta(days=36500))
            .sign(key, hashes.SHA256()))
    open(kp, 'wb').write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    open(cp, 'wb').write(cert.public_bytes(serialization.Encoding.PEM))
key = serialization.load_pem_private_key(open(kp, 'rb').read(), None)
cert = x509.load_pem_x509_certificate(open(cp, 'rb').read())

# --- pliki ---
src = zipfile.ZipFile(tpl)
files = {}
for n in src.namelist():
    if n.startswith('META-INF/'): continue
    files[n] = src.read(n)
files['assets/index.html'] = open(html, 'rb').read()
order = [n for n in files]

# --- v1 ---
b64 = lambda d: base64.b64encode(d).decode()
mf = 'Manifest-Version: 1.0\r\nCreated-By: bunkier\r\n\r\n'
sf_entries = ''
for n in order:
    sec = f'Name: {n}\r\nSHA-256-Digest: {b64(hashlib.sha256(files[n]).digest())}\r\n\r\n'
    mf += sec
    sf_entries += f'Name: {n}\r\nSHA-256-Digest: {b64(hashlib.sha256(sec.encode()).digest())}\r\n\r\n'
sf = f'Signature-Version: 1.0\r\nCreated-By: bunkier\r\nSHA-256-Digest-Manifest: {b64(hashlib.sha256(mf.encode()).digest())}\r\n\r\n' + sf_entries
rsa_blob = (pkcs7.PKCS7SignatureBuilder().set_data(sf.encode()).add_signer(cert, key, hashes.SHA256())
            .sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature, pkcs7.PKCS7Options.NoAttributes]))
meta = [('META-INF/MANIFEST.MF', mf.encode()), ('META-INF/BUNKIER.SF', sf.encode()), ('META-INF/BUNKIER.RSA', rsa_blob)]

# --- zip z wyrównaniem 4 B dla nieskompresowanych ---
buf = io.BytesIO()
z = zipfile.ZipFile(buf, 'w')
def add(n, data, stored):
    zi = zipfile.ZipInfo(n, (1980, 1, 1, 0, 0, 0)); zi.external_attr = 0o644 << 16
    zi.compress_type = zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
    if stored:
        pad = (-(buf.tell() + 30 + len(n.encode()))) % 4
        if pad: zi.extra = struct.pack('<HH', 0xD935, pad - 4) + b'\0' * (pad - 4) if pad >= 4 else b''
        if pad and pad < 4:
            pad += 4; zi.extra = struct.pack('<HH', 0xD935, pad - 4) + b'\0' * (pad - 4)
    z.writestr(zi, data)
for n in order:
    add(n, files[n], n == 'resources.arsc' or n.endswith('.png'))
for n, d in meta: add(n, d, False)
z.close()
raw = buf.getvalue()

# --- v2 ---
eocd = raw.rfind(b'PK\x05\x06')
cd_off = struct.unpack('<I', raw[eocd + 16:eocd + 20])[0]
sec1, sec3, sec2 = raw[:cd_off], raw[cd_off:eocd], raw[eocd:]
def chunks(d): return [d[i:i + (1 << 20)] for i in range(0, len(d), 1 << 20)] or [b'']
ch = []
for part in (sec1, sec3, sec2):
    ch += chunks(part)
digs = [hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest() for c in ch]
top = hashlib.sha256(b'\x5a' + struct.pack('<I', len(digs)) + b''.join(digs)).digest()
L = lambda b: struct.pack('<I', len(b)) + b
ALGO = 0x0103
cert_der = cert.public_bytes(serialization.Encoding.DER)
signed = L(L(struct.pack('<I', ALGO) + L(top))) + L(L(cert_der)) + L(b'')
sig = key.sign(signed, padding.PKCS1v15(), hashes.SHA256())
pub = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
signer = L(signed) + L(L(struct.pack('<I', ALGO) + L(sig))) + L(pub)
value = L(L(signer))
pair = struct.pack('<Q', 4 + len(value)) + struct.pack('<I', 0x7109871a) + value
blk = struct.pack('<Q', len(pair) + 24) + pair + struct.pack('<Q', len(pair) + 24) + b'APK Sig Block 42'
# digest liczono przy cd_off wskazującym początek bloku podpisu = cd_off (bez zmiany); po wstawieniu przesuwamy offset
new_eocd = sec2[:16] + struct.pack('<I', cd_off + len(blk)) + sec2[20:]
open(out, 'wb').write(sec1 + blk + sec3 + new_eocd)
print('OK', out, os.path.getsize(out))
