import binascii
import os

print(binascii.hexlify(os.urandom(32)).decode())
