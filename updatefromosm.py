# UpdateFromOSM.py
import os, json

os.system('geogit osm download --update')
os.system('geogit add')
os.system('geogit commit -m "update from OSM.org"')

# make export files
path = os.path.abspath('').split('/')
repo = path[len(path)-2] + "/" + path[len(path)-1]
repo = repo[ : len(repo)-3 ]

os.system('mkdir /root/geogit-viz/public/' + repo.split('/')[0] + ' ; mkdir /root/geogit-viz/public/' + repo + ' ; mkdir /root/geogit-viz/public/' + repo + '/shp ; mkdir /root/geogit-viz/public/' + repo + '/pg ; mkdir /root/geogit-viz/public/' + repo + '/sl')

# shapefiles
os.system('geogit shp export HEAD:node /root/geogit-viz/public/' + repo + '/shp/node.shp --alter -o')
os.system('geogit shp export HEAD:way /root/geogit-viz/public/' + repo + '/shp/way.shp --alter -o')
os.system('geogit shp export HEAD:relation /root/geogit-viz/public/' + repo + '/shp/relation.shp --alter -o')
os.system('zip /root/geogit-viz/public/' + repo + '/shp.zip /root/geogit-viz/public/' + repo + '/shp/node.* /root/geogit-viz/public/' + repo + '/shp/way.* /root/geogit-viz/public/' + repo + '/shp/relation.*')

# ogr2ogr GeoJSON files
os.system('rm *.geojson')
gjout = { "type": "FeatureCollection", "features": [ ] }
if os.path.isfile('/root/geogit-viz/public/' + repo + '/shp/node.shp'):
  os.system('ogr2ogr node.geojson -f "GeoJSON" /root/geogit-viz/public/' + repo + '/shp/node.shp')
  gjinfile = open('node.geojson', 'r', encoding="ISO-8859-1")
  gjin = gjinfile.read()
  gjout["features"] = json.loads( gjin )["features"]
  gjinfile.close()

if os.path.isfile('/root/geogit-viz/public/' + repo + '/shp/way.shp'):
  os.system('ogr2ogr way.geojson -f "GeoJSON" /root/geogit-viz/public/' + repo + '/shp/way.shp')
  gjinfile = open('way.geojson', 'r', encoding="ISO-8859-1")
  gjin = gjinfile.read()
  gjout["features"].extend( json.loads( gjin )["features"] )
  gjinfile.close()

if os.path.isfile('/root/geogit-viz/public/' + repo + '/shp/relation.shp'):
  os.system('ogr2ogr relation.geojson -f "GeoJSON" /root/geogit-viz/public/' + repo + '/shp/relation.shp')
  gjinfile = open('relation.geojson', 'r', encoding="ISO-8859-1")
  gjin = gjinfile.read()
  gjout["features"].extend( json.loads( gjin )["features"] )
  gjinfile.close()

gjfile = open('/root/geogit-viz/public/' + repo + '/current.geojson', 'w')
gjfile.write( json.dumps( gjout ) )
gjfile.close()

"""
os.system('geogit pg export HEAD:node /root/geogit-viz/public/' + repo + '/pg/node.pg --alter -o')
os.system('geogit pg export HEAD:way /root/geogit-viz/public/' + repo + '/pg/way.pg --alter -o')
os.system('geogit pg export HEAD:relation /root/geogit-viz/public/' + repo + '/pg/relation.pg --alter -o')
os.system('zip /root/geogit-viz/public/' + repo + '/pg.zip /root/geogit-viz/public/' + repo + '/pg/node.* /root/geogit-viz/public/' + repo + '/pg/way.* /root/geogit-viz/public/' + repo + '/pg/relation.*')

os.system('geogit sl export HEAD:node /root/geogit-viz/public/' + repo + '/sl/node.sl --alter -o')
os.system('geogit sl export HEAD:way /root/geogit-viz/public/' + repo + '/sl/way.sl --alter -o')
os.system('geogit sl export HEAD:relation /root/geogit-viz/public/' + repo + '/sl/relation.sl --alter -o')
os.system('zip /root/geogit-viz/public/' + repo + '/sl.zip /root/geogit-viz/public/' + repo + '/sl/node.* /root/geogit-viz/public/' + repo + '/sl/way.* /root/geogit-viz/public/' + repo + '/sl/relation.*')
"""
