# UpdateFromOSM.py
import os

os.system('geogit osm download --update')
os.system('geogit add')
os.system('geogit commit -m "update from OSM.org"')
