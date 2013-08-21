# GenerateFromGitHub.py
import urllib, json, os, time
from datetime import datetime
import xml.etree.ElementTree as ET

# avoid rate limiting - add your GitHub OAuth client_id and client_secret, but keep them secret
useOAuth = False
#useOAuth = True
#client_id = "x"
#client_secret = "x"

repo = "benbalter/dc-wifi-social"

commitURL = "https://api.github.com/repos/" + repo + "/commits"
if(useOAuth):
  commitURL = commitURL + "?client_id=" + client_id + "&client_secret=" + client_secret
commits = json.loads( urllib.urlopen( commitURL ).read() )

commitIndex = len( commits ) - 1

os.system('geogit init')

while commitIndex >= 0:


  detailURL = commits[ commitIndex ]["url"] 
  if(useOAuth):
    detailURL = detailURL + "?client_id=" + client_id + "&client_secret=" + client_secret
  details = json.loads( urllib.urlopen( detailURL ).read() )
  
  if( commits[ commitIndex ]["commit"].has_key( "message" ) ):
    print commits[ commitIndex ]["commit"]["message"]
  else:
    print "No message"
  
  osm = ET.Element('osm')
  osm.set('version', '0.6')
  osm.set('generator', 'geogit-viz-geojson')

  
  fileList = details["files"]
  foundGeoJSON = False
  for file in fileList:
    if(file["filename"].lower().find('.geojson') > -1):
      foundGeoJSON = True
      # geojson file
      gjURL = file["raw_url"]
      try:
        fileoutput = urllib.urlopen( gjURL ).read()
        fileoutput = fileoutput.replace('\r','\\r').replace('\n','\\n')
        gj = json.loads( fileoutput )
      except:
        print "not valid JSON!"
        continue

      if gj["type"] == "FeatureCollection":
        # convert these features to OSM XML
        featureCount = 1
        for feature in gj["features"]:
          id = str(featureCount)
          if(feature.has_key("id")):
            id = feature["id"]
          elif(feature.has_key("ID")):
            id = feature["ID"]
          elif(feature["properties"].has_key("id")):
            id = feature["properties"]["id"]
          elif(feature["properties"].has_key("ID")):
            id = feature["properties"]["ID"]
          elif(feature["properties"].has_key("objectid")):
            id = feature["properties"]["objectid"]
          elif(feature["properties"].has_key("OBJECTID")):
            id = feature["properties"]["OBJECTID"]
        
          if(feature["geometry"]["type"] == "Point"):
            # Node
            mn = ET.SubElement(osm, "node")
            mn.set("id", id)
            mn.set("lat", str(feature["geometry"]["coordinates"][1]))
            mn.set("lon", str(feature["geometry"]["coordinates"][0]))
            mn.set("user", "mapmeld")
            mn.set("uid", "0")
            mn.set("visible", "true")
            mn.set("version", "1")
            mn.set("changeset", "1")
            mn.set("timestamp", "2008-09-21T00:00:00Z")            
            
          elif(feature["geometry"]["type"] == "MultiPolygon"):
            # Relation
            r = 1
            
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
                node.set("lat", str(feature["geometry"]["coordinates"][ptIndex][1]))
                node.set("lon", str(feature["geometry"]["coordinates"][ptIndex][0]))
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
                  node.set("lat", str(ring[ptIndex][1]))
                  node.set("lon", str(ring[ptIndex][0]))
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
        
          for key in feature["properties"]:
            tag = ET.SubElement(mn, "tag")
            tag.set("k", key)
            tag.set("v", str(feature["properties"][key]))
          
          featureCount = featureCount + 1
                
  # save and commit xml
  if(foundGeoJSON == True):
    tree = ET.ElementTree(osm)
    tree.write('gjoutput.osm')
    os.system('geogit osm import gjoutput.osm')
    os.system('geogit add')
    message = 'GitHub commit ' + commits[ commitIndex ]["sha"]
    if( commits[ commitIndex ]["commit"].has_key( "message" ) ):
      message = commits[ commitIndex ]["commit"]["message"].replace('"', '\'')
    commitTime = datetime.strptime( commits[ commitIndex ]["commit"]["committer"]["date"], "%Y-%m-%dT%H:%M:%SZ" )
    timeprint = str( time.mktime( commitTime.timetuple() ) )
    if(timeprint.find('.') > -1):
      timeprint = timeprint[ 0 : timeprint.find('.') ]
    
    os.system('geogit commit -m "' + message + '" -t ' + timeprint + '000')
  
  # load next one
  commitIndex = commitIndex - 1
