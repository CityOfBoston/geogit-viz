# GeoGit-Viz

Map the changes to a <a href="http://geogit.org">GeoGit</a> repo, commit by commit.

Sample diff:

<img src="https://raw.github.com/mapmeld/geogit-viz/master/screenshot.png"/>

Real data diff using Boston's Permits service

<img src="https://raw.github.com/mapmeld/geogit-viz/master/permitdiff.png"/>

Dial-a-Diff: compare any commits in the GeoGit repo history

<img src="https://raw.github.com/mapmeld/geogit-viz/master/dialadiff.png"/>

## Setup (tested on Ubuntu 12 or Mac OSX)

### Download and build GeoGit

* Install git

* Download GeoGit from my GitHub - the stable download does not include the web API, and OpenGeo does not yet support time-enabled commits.

        git clone https://github.com/opengeo/GeoGit.git ~/GeoGit

* Install geogit's prerequisites (Java JDK, Maven, Jetty)

* Build GeoGit / run all tests with

        cd ~/GeoGit/src/parent
        mvn clean install

### Set up your GeoGit repo and API

* Set geogit user and e-mail. If you have issues see https://github.com/opengeo/GeoGit/issues/342

        geogit config --global user.name "Your Name"
        geogit config --global user.email "name@example.com"

* Create a geogit repo somewhere. If you have issues see https://github.com/opengeo/GeoGit/issues/342

        mkdir ~/mygeodata
        cd ~/mygeodata
        geogit init

* **If you already have your data source**, make your initial commit now

        geogit shp import using_a_shapefile.shp
        geogit add
        geogit commit -m "initial commit"

* Start geogit's built-in API server

        cd ~/GeoGit/src/parent
        mvn jetty:run -pl ../web/app -f pom.xml -Dorg.geogit.web.repository=/path/to/mygeodata/ -Djetty.port=8080

* Test that API server is running by going to http://localhost:8080

### Download and build this repo (geogit-viz)

* Download geogit-viz from GitHub

        git clone https://github.com/mapmeld/geogit-viz.git ~/geogit-viz

* Install Node.js and (if not included) NPM

* Install dependencies and start server

        cd ~/geogit-viz
        npm install
        node app.js

* View the map at http://localhost - note that no data will be visible in your initial commit

### Add more repos

* After creating a GeoGit repo in another directory, start an API server on another port with:

        cd ~/GeoGit/src/parent
        mvn jetty:run -pl ../web/app -f pom.xml -Dorg.geogit.web.repository=/path/to/another-repo/ -Djetty.port=8081

### Update data

* If you already have a shapefile, OSM XML, Spatialite, or PostGIS database, you can use geogit to continue importing, adding, and commiting that data. You're all set!

* geogit-viz has two example updaters which save ArcGIS REST API service data as OSM-format XML files (/update\_from\_gis and /update\_dev\_projects)

* Stop your GeoGit web API processes before importing data

* Import and commit data to your GeoGit repo. The response after 'geogit commit' will let you know if any points were added, modified, or removed.

        cd ~/mygeodata
        geogit osm import ../geogit-viz/osmoutput.osm
        geogit add
        geogit commit -m "updated geodata from server"

* Restart API processes.

* You won't see changes on the map until your second commit. Until then, you can verify the API is working at http://localhost:8080 and http://localhost:8080/geogit/log 

### Import a repo from GitHub

Are you already sharing maps on GitHub?  GeoGit can import your GeoJSON files into a GeoGit commit history.

* Enable OAuth and add your keys to the generatefromgit.py script:

        #useOAuth = False
        useOAuth = True
        client_id = "x"
        client_secret = "x"

* Edit the repo in the generatefromgit.py script:

        repo = "USERNAME/REPONAME"

* Create and populate the repo using this script

        python generatefromgit.py

## Goal

* GeoGit script keeps track of changes to the city's data via ArcGIS REST API

* Map visualization of changes

### Keeping in sync [TODO]

* User exports data in preferred format

* User notes either the day or commit ID of their data

* User can see all changes since their download by sending their commit ID to the JSON API

### More complex ideas [TODO]

* User could clone a GeoGit repo and use it to apply changes to shapefiles used in a TileMill map

* User could subscribe to receive updates, JSON diffs