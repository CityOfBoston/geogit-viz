# GeoGit-Viz

Map the changes to a <a href="http://geogit.org">GeoGit</a> repo, commit by commit.

Sample diff:

<img src="https://raw.github.com/mapmeld/geogit-viz/master/screenshot.png"/>

Real data diff using Boston's Permits service

<img src="https://raw.github.com/mapmeld/geogit-viz/master/permitdiff.png"/>

Dial-a-Diff: compare any commits in the GeoGit repo history

<img src="https://raw.github.com/mapmeld/geogit-viz/master/dialadiff.png"/>


## Goal

* GeoGit script keeps track of changes to the city's data via ArcGIS REST API

* Map visualization of changes

### Keeping in sync

* User exports data in preferred format

* User notes either the day or commit ID of their data

* User can see all changes since their download by sending their commit ID to the JSON API

### More complex ideas

* User could clone a GeoGit repo and use it to apply changes to shapefiles used in a TileMill map

* User could subscribe to receive updates, JSON diffs