import sys, os

coords = sys.argv

os.system('geogit init')
os.system('geogit osm download --bbox "' + sys.argv[1] + '" "' + sys.argv[2] + '" "' + sys.argv[3] + '" "' + sys.argv[4] + '"')
os.system('geogit add')
os.system('geogit commit -m "initial commit"')
