# UpdateFromOSM.py
import os

updating = True

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
    updating = False

if(updating == True):
  north = 15.5376
  south = 15.349
  east = 32.9725
  west = 32.663
  os.system('geogit osm download --bbox ' + str(south) + ' ' + str(west) + ' ' + str(north) + ' ' + str(east) )
else:
  north = 15.5376
  south = 15.349
  east = 32.9725
  west = 32.663
  os.system('geogit osm download --bbox ' + str(south) + ' ' + str(west) + ' ' + str(north) + ' ' + str(east) )

os.system('geogit add')
os.system('geogit commit -m "update from OSM.org"')
