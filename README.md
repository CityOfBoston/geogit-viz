# Boston-Police-Districts

A simple, mobile-responsive map to find which police district serves your address or your current location.

# Technology

## ArcGIS JavaScript API

The interactive map on the site uses ArcGIS's client-side JavaScript API and the included Dojo framework

## ArcGIS Server

Police stations and district boundaries are returned from the City of Boston's ArcGIS Server, and will update as the City updates its database.

No database is included in the app.

## Node-SOAP

This site uses a server to look up addresses from the City of Boston's SAM database, which uses a SOAP interface.

Node module 'soap' and 'easysoap' allow the app to make requests through SOAP without revealing authentication details.

## Node.js Express MVR Template 

Based on a Node.js / Express / MongoDB template by [Ben Edmunds](http://benedmunds.com)