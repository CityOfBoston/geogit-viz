# InitFromDrawn.py
import json, os
from urllib import request as urllib
from datetime import datetime
import xml.etree.ElementTree as ET

# get GitHub project path user/project
path = os.path.abspath('').split('/')
port = path[ len(path) - 1 ]

detailURL = "http://geoginger.com/drawn/" + port + "?version=2"
message = "draw commit"

try:
  gj = json.loads( urllib.urlopen( detailURL ).readall().decode('utf-8') )
  message = gj["commit"].replace('"', "'").replace("\\", "\\\\")
except:
  print( "not valid JSON!" )
  
osm = ET.Element('osm')
osm.set('version', '0.6')
osm.set('generator', 'geogit-viz-geojson')

# convert these features to OSM XML
featureCount = 1
allfeatures = gj["features"]
for feature in gj["features"]:
  id = featureCount
  if("id" in feature):
    id = feature["id"]
  elif("ID" in feature):
    id = feature["ID"]
  elif("id" in feature["properties"]):
    id = feature["properties"]["id"]
  elif("ID" in feature["properties"]):
    id = feature["properties"]["ID"]
  elif("objectid" in feature["properties"]):
    id = feature["properties"]["objectid"]
  elif("OBJECTID" in feature["properties"]):
    id = feature["properties"]["OBJECTID"]
  id = str(id)
  mn = None

  if(feature["geometry"]["type"] == "Point"):
    # Node
    mn = ET.SubElement(osm, "node")
    mn.set("id", id)
    mn.set("lat", str(round(feature["geometry"]["coordinates"][1],6)))
    mn.set("lon", str(round(feature["geometry"]["coordinates"][0],6)))
    mn.set("user", "mapmeld")
    mn.set("uid", "0")
    mn.set("visible", "true")
    mn.set("version", "1")
    mn.set("changeset", "1")
    mn.set("timestamp", "2008-09-21T00:00:00Z")    
    
  elif(feature["geometry"]["type"] == "MultiPolygon"):
    # Relation
    wayids = [ ]
    for shape in feature["geometry"]["coordinates"]:
      for ring in shape:
        nodeids = [ ]
        ptIndex = 0
        for pt in ring:
          node = ET.SubElement(osm, "node")
          nodeid = "10" + id + str(len(nodeids))
          nodeids.append( nodeid )
          node.set("id", nodeid )
          node.set("lat", str(round(ring[ptIndex][1],6)))
          node.set("lon", str(round(ring[ptIndex][0],6)))
          node.set("user", "mapmeld")
          node.set("uid", "0")
          node.set("visible", "true")
          node.set("version", "1")
          node.set("changeset", "1")
          node.set("timestamp", "2008-09-21T00:00:00Z")
          ptIndex = ptIndex + 1
        nodeids.append( nodeids[0] )
        
        way = ET.SubElement(osm, "way")
        wayid = "20" + id + str(len(wayids))
        wayids.append( wayid )
        way.set("id", wayid )
        way.set("user", "mapmeld")
        way.set("uid", "0")
        way.set("visible", "true")
        way.set("version", "1")
        way.set("changeset", "1")
        way.set("timestamp", "2008-09-21T00:00:00Z")
        for nodeid in nodeids:
          node = ET.SubElement(way, "nd")
          node.set("ref", nodeid)

    mn = ET.SubElement(osm, "relation")
    mn.set("id", id )
    mn.set("user", "mapmeld")
    mn.set("uid", "0")
    mn.set("visible", "true")
    mn.set("version", "1")
    mn.set("changeset", "1")
    mn.set("timestamp", "2008-09-21T00:00:00Z")
    for wayid in wayids:
      member = ET.SubElement(mn, "member")
      member.set("type", "way")
      member.set("ref", wayid)

  else:
    # Way
    if( type( feature["geometry"]["coordinates"][0][0] ) == type( 30.4 ) or type( feature["geometry"]["coordinates"][0][0] ) == type( 30 ) ):
      # polyline
      ptIndex = 0
      nodeids = [ ]
      for pt in feature["geometry"]["coordinates"]:
        node = ET.SubElement(osm, "node")
        nodeid = "10" + id + str(len(nodeids))
        nodeids.append( nodeid )
        node.set("id", nodeid )
        node.set("lat", str(round(feature["geometry"]["coordinates"][ptIndex][1],6)))
        node.set("lon", str(round(feature["geometry"]["coordinates"][ptIndex][0],6)))
        node.set("user", "mapmeld")
        node.set("uid", "0")
        node.set("visible", "true")
        node.set("version", "1")
        node.set("changeset", "1")
        node.set("timestamp", "2008-09-21T00:00:00Z")
        ptIndex = ptIndex + 1
              
      mn = ET.SubElement(osm, "way")
      mn.set("id", id)
      mn.set("user", "mapmeld")
      mn.set("uid", "0")
      mn.set("visible", "true")
      mn.set("version", "1")
      mn.set("changeset", "1")
      mn.set("timestamp", "2008-09-21T00:00:00Z")
      
      for nodeid in nodeids:
        node = ET.SubElement(mn, "nd")
        node.set("ref", nodeid)
              
    else:
      # polygon
      wayids = [ ]
      for ring in feature["geometry"]["coordinates"]:
        nodeids = [ ]
        ptIndex = 0
        for pt in ring:
          node = ET.SubElement(osm, "node")
          nodeid = "10" + id + str(len(nodeids))
          nodeids.append( nodeid )
          node.set("id", nodeid )
          node.set("lat", str(round(ring[ptIndex][1],6)))
          node.set("lon", str(round(ring[ptIndex][0],6)))
          node.set("user", "mapmeld")
          node.set("uid", "0")
          node.set("visible", "true")
          node.set("version", "1")
          node.set("changeset", "1")
          node.set("timestamp", "2008-09-21T00:00:00Z")
          ptIndex = ptIndex + 1
        nodeids.append( nodeids[0] )
        
        way = ET.SubElement(osm, "way")
        wayid = "20" + id + str(len(wayids))
        wayids.append( wayid )
        way.set("id", wayid )
        way.set("user", "mapmeld")
        way.set("uid", "0")
        way.set("visible", "true")
        way.set("version", "1")
        way.set("changeset", "1")
        way.set("timestamp", "2008-09-21T00:00:00Z")
        for nodeid in nodeids:
          node = ET.SubElement(way, "nd")
          node.set("ref", nodeid)

      mn = ET.SubElement(osm, "relation")
      mn.set("id", id )
      mn.set("user", "mapmeld")
      mn.set("uid", "0")
      mn.set("visible", "true")
      mn.set("version", "1")
      mn.set("changeset", "1")
      mn.set("timestamp", "2008-09-21T00:00:00Z")
      for wayid in wayids:
        member = ET.SubElement(mn, "member")
        member.set("type", "way")
        member.set("ref", wayid)
          
  featureCount = featureCount + 1
                
# save and commit xml
tree = ET.ElementTree(osm)
tree.write('gjoutput.osm')
os.system('geogit osm import gjoutput.osm')
os.system('geogit add')
os.system('geogit commit -m "' + message + '"')

"""
# make export files
os.system('mkdir /root/geogit-viz/public/' + repo.split('/')[0] + ' ; mkdir /root/geogit-viz/public/' + repo + ' ; mkdir /root/geogit-viz/public/' + repo + '/shp ; mkdir /root/geogit-viz/public/' + repo + '/pg ; mkdir /root/geogit-viz/public/' + repo + '/sl')

os.system('geogit shp export HEAD:node /root/geogit-viz/public/' + repo + '/shp/node.shp --alter -o')
os.system('geogit shp export HEAD:way /root/geogit-viz/public/' + repo + '/shp/way.shp --alter -o')
os.system('geogit shp export HEAD:relation /root/geogit-viz/public/' + repo + '/shp/relation.shp --alter -o')
os.system('zip /root/geogit-viz/public/' + repo + '/shp.zip /root/geogit-viz/public/' + repo + '/shp/node.* /root/geogit-viz/public/' + repo + '/shp/way.* /root/geogit-viz/public/' + repo + '/shp/relation.*')

# OSM file
os.system('cp gjoutput.osm /root/geogit-viz/public/' + repo + '/osm.osm')

# GeoJSON file
gjoutput = open('/root/geogit-viz/public/' + repo + '/current.geojson', 'w')
gjcombined = { "type": "FeatureCollection", "features": allfeatures }
gjoutput.write( json.dumps( gjcombined ) )
gjoutput.close()

os.system('geogit pg export HEAD:node /root/geogit-viz/public/' + repo + '/pg/node.pg --alter -o')
os.system('geogit pg export HEAD:way /root/geogit-viz/public/' + repo + '/pg/way.pg --alter -o')
os.system('geogit pg export HEAD:relation /root/geogit-viz/public/' + repo + '/pg/relation.pg --alter -o')
os.system('zip /root/geogit-viz/public/' + repo + '/pg.zip /root/geogit-viz/public/' + repo + '/pg/node.* /root/geogit-viz/public/' + repo + '/pg/way.* /root/geogit-viz/public/' + repo + '/pg/relation.*')

os.system('geogit sl export HEAD:node /root/geogit-viz/public/' + repo + '/sl/node.sl --alter -o')
os.system('geogit sl export HEAD:way /root/geogit-viz/public/' + repo + '/sl/way.sl --alter -o')
os.system('geogit sl export HEAD:relation /root/geogit-viz/public/' + repo + '/sl/relation.sl --alter -o')
os.system('zip /root/geogit-viz/public/' + repo + '/sl.zip /root/geogit-viz/public/' + repo + '/sl/node.* /root/geogit-viz/public/' + repo + '/sl/way.* /root/geogit-viz/public/' + repo + '/sl/relation.*')
"""