# UpdateBikesFromGitHub.py
import urllib, json, os, hashlib, time
from datetime import datetime
import xml.etree.ElementTree as ET

# avoid rate limiting - add your GitHub OAuth client_id and client_secret, but keep them secret
useOAuth = False
#useOAuth = True
#client_id = "x"
#client_secret = "x"

repo = "stevevance/divvy-statuses"

commitURL = "https://api.github.com/repos/" + repo + "/commits"
if(useOAuth):
  commitURL = commitURL + "?client_id=" + client_id + "&client_secret=" + client_secret
commits = json.loads( urllib.urlopen( commitURL ).read() )

commitIndex = len( commits ) - 1

while commitIndex >= 0:

  # skip ahead to new commits
  commitTime = datetime.strptime( commits[ commitIndex ]["commit"]["committer"]["date"], "%Y-%m-%dT%H:%M:%SZ" )
  commitTime = time.mktime( commitTime.timetuple() )
  filedTime = os.path.getmtime( 'gjoutput.osm' )
  if(filedTime > commitTime):
    commitIndex = commitIndex - 1
    print "old commit"
    continue

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
    if(file["filename"].lower().find('.json') > -1):
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

      # convert these features to OSM XML
      for feature in gj["stationBeanList"]:
        id = str(feature["id"])
        
        # Node
        mn = ET.SubElement(osm, "node")
        mn.set("id", id)
        mn.set("lat", str(round(feature["latitude"],6)))
        mn.set("lon", str(round(feature["longitude"],6)))
        mn.set("user", "mapmeld")
        mn.set("uid", "0")
        mn.set("visible", "true")
        mn.set("version", "1")
        mn.set("changeset", "1")
        mn.set("timestamp", "2008-09-21T00:00:00Z")
        
        for key in feature:
          # tag info
          if(key == "id" or key == "latitude" or key == "longitude"):
            continue
          tag = ET.SubElement(mn, "tag")
          tag.set("k", key)
          tag.set("v", str(feature[key]))
                
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
