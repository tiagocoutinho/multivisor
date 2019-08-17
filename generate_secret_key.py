import os
import binascii

print(binascii.hexlify(os.urandom(32)))
