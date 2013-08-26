# UpdateFromGitHub.py
import json, os, time
from urllib import request as urllib
from datetime import datetime
import xml.etree.ElementTree as ET

# avoid rate limiting - add your GitHub OAuth client_id and client_secret, but keep them secret
useOAuth = False
#useOAuth = True
#client_id = "x"
#client_secret = "x"

path = os.path.abspath('').split('/')
repo = path[len(path)-2] + "/" + path[len(path)-1]

commitURL = "https://api.github.com/repos/" + repo + "/commits"
if(useOAuth):
  commitURL = commitURL + "?client_id=" + client_id + "&client_secret=" + client_secret
commits = json.loads( urllib.urlopen( commitURL ).readall().decode('utf-8') )

commitIndex = len( commits ) - 1

while commitIndex >= 0:

  # skip ahead to new commits
  commitTime = datetime.strptime( commits[ commitIndex ]["commit"]["committer"]["date"], "%Y-%m-%dT%H:%M:%SZ" )
  commitTime = time.mktime( commitTime.timetuple() )
  filedTime = os.path.getmtime( 'gjoutput.osm' )
  if(filedTime > commitTime):
    commitIndex = commitIndex - 1
    print("old commit")
    continue

  detailURL = commits[ commitIndex ]["url"] 
  if(useOAuth):
    detailURL = detailURL + "?client_id=" + client_id + "&client_secret=" + client_secret
  details = json.loads( urllib.urlopen( detailURL ).readall().decode('utf-8') )
  
  if( "message" in commits[ commitIndex ]["commit"] ):
    print(commits[ commitIndex ]["commit"]["message"])
  else:
    print("No message")
  
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
        fileoutput = urllib.urlopen( gjURL ).readall().decode('utf-8')
        fileoutput = fileoutput.replace('\r','\\r').replace('\n','\\n')
        gj = json.loads( fileoutput )
      except:
        print("not valid JSON!")
        continue

      if gj["type"] == "FeatureCollection":
        # convert these features to OSM XML
        featureCount = 1
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
    if( "message" in commits[ commitIndex ]["commit"] ):
      message = commits[ commitIndex ]["commit"]["message"].replace('"', '\'')
    commitTime = datetime.strptime( commits[ commitIndex ]["commit"]["committer"]["date"], "%Y-%m-%dT%H:%M:%SZ" )
    timeprint = str( time.mktime( commitTime.timetuple() ) )
    if(timeprint.find('.') > -1):
      timeprint = timeprint[ 0 : timeprint.find('.') ]
    
    os.system('geogit commit -m "' + message + '" -t ' + timeprint + '000')
  
  # load next one
  commitIndex = commitIndex - 1
