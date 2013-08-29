import sys, os

args = sys.argv
coords = [ args[1], args[2], args[3], args[4] ]

os.system('geogit init')
os.system('geogit osm download --bbox "' + '" "'.join( coords ) + '"')
os.system('geogit add')
os.system('geogit commit -m "initial commit"')
