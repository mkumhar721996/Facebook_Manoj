def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def lum(hexs):
    r, g, b = int(hexs[0:2], 16), int(hexs[2:4], 16), int(hexs[4:6], 16)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def contrast(a, b):
    la, lb = lum(a), lum(b)
    L1, L2 = max(la, lb), min(la, lb)
    return (L1 + 0.05) / (L2 + 0.05)

pairs = [
    ("fg/bg", "1a1a1a", "ffffff"),
    ("primary/white", "0b5fff", "ffffff"),
    ("fg-muted/bg", "4b5563", "ffffff"),
    ("success/success-bg", "067647", "ecfdf3"),
    ("danger/danger-bg", "b42318", "fef3f2"),
    ("warning/warning-bg", "b54708", "fffaeb"),
]
for name, a, b in pairs:
    print(name, round(contrast(a, b), 2))
