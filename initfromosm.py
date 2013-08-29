import sys, os

coords = sys.argv

os.system('geogit init')
os.system('geogit osm download --bbox ' + ' '.join( coords ))
os.system('geogit add')
os.system('geogit commit -m "initial commit"')
