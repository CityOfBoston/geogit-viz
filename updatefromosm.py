# UpdateFromOSM.py
import os

try:
    # see if this repo was initialized
    file = open('osmrecord.osm', 'r')
    file.close()
except:
    # initialize this repo and mark it as initialized
    os.system('geogit init')
    file = open('osmrecord.osm', 'w')
    file.write('activated')
    file.close()

os.system('geogit osm import bbox')
os.system('geogit add')
os.system('geogit commit -m "update from OSM.org"')