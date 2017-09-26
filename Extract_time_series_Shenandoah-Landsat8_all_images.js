////////////////////////////////////
//Extract_time_series_Shenandoah.js
//
//Written by: Val Thomas.
//July 14, 2017
//This is a JavaScript program meant to be run in the GEE API.
//Purpose: Grenerate NDVI, NDMI, and burn ratio trajectories from 
//burned and unburned points in Shenandoah.
// Where NDVI = (NIR-Red)/(NIR+Red) = (B5-B4)/(B5+B4)
//NDMI = (B5-B6)/(B5+B6)
//NBR = (B5-B7)/(B5+B7)
//This works for Landsat 8
///////////////////////////////////////////////////////////////////

// Import the point files into the code and set them as a Feature Collection. 
// These were first imported into assets.
// Make a list of Features.
var features = [
  (ee.Geometry.Point(-78.65833, 38.31667)),
  (ee.Geometry.Point(-78.725, 38.275)),
  (ee.Geometry.Point(-78.68185, 38.3139))
  ];

var ShanPoints = ee.FeatureCollection(features);
//var VAPoints = ee.FeatureCollection("users/thomasv/Synthesis/ABSF_LAI_Plots");
//var ALPoints = ee.FeatureCollection("users/thomas/Synthesis/TWC_22LAI_Plots_UseLoc")

print(features)
print(ShanPoints)
Map.addLayer(ShanPoints);
Map.setCenter(-78.688, 38.3, 14);


/////////////////////////////////////////////////////////////////////////////////
//Using Lansat 8 Greenest Pixel
///LANDSAT/LE7_L1T_ANNUAL_GREENEST_TOA
// Load a greenest pixel for a single path-row.

//NDMI
var NDMI = ee.ImageCollection('LC8_L1T_ANNUAL_GREENEST_TOA')
var addNDMIgreen = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B6']).rename('NDMI'));
};
var collection9b=NDMI.map(addNDMIgreen);

var collection = NDMI
    .filter(ee.Filter.eq('WRS_PATH', 16))
    .filter(ee.Filter.eq('WRS_ROW', 34))
    .filterDate('2000-01-01', '2017-09-09');
print('NDMI', collection);
print('collection9b', collection9b)

var VA_NDMI = ui.Chart.image.seriesByRegion({
  imageCollection:collection9b, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  scale: 30,
  band:'NDMI'
});

print(VA_NDMI); //You can go into the graph itself and download the values to a csv file.  It generates an ID code.

//////Now try ndvi
var NDVI = ee.ImageCollection('LE7_L1T_ANNUAL_GREENEST_TOA')
var addNDVIgreen = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B4']).rename('NDVI'));
};
var collection9b=NDVI.map(addNDVIgreen);

var VA_NDVI = ui.Chart.image.seriesByRegion({
  imageCollection:collection9b, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  scale: 30,
  band:'NDVI'
});


///Now try burn
var NBR = ee.ImageCollection('LE7_L1T_ANNUAL_GREENEST_TOA')
var addNBRgreen = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B7']).rename('NBR'));
};
var collection9b=NBR.map(addNBRgreen);

var VA_NBR = ui.Chart.image.seriesByRegion({
  imageCollection:collection9b, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  scale: 30,
  band:'NBR'
});

print('collection9b', collection9b);
print(VA_NDVI);
print(VA_NBR);
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//Shifting to all images in Landsat 8

//Add Landsat 5 Surface Reflectance
//var landsat5SR = ee.ImageCollection('LANDSAT/LT5_SR')
//.set('SENSOR_ID', 'TM');

//Add Landsat 7 Surface Reflectance
//var landsat7SR = ee.ImageCollection('LANDSAT/LE7_SR')
//.set('SENSOR_ID', 'TM');

//Add Landsat 8 Surface Reflectance
var landsat8SR = ee.ImageCollection('LANDSAT/LC8_SR')
.set('SENSOR_ID', 'OLI_TIRS');

//mask clouds and stuff
var maskClouds = function(image) {return image.updateMask(image.select(['cfmask']).lt(0.9));};
//var landsat5SRb=landsat5SR.map(maskClouds);
//var landsat7SRb=landsat7SR.map(maskClouds);
var landsat8SRb=landsat8SR.map(maskClouds);

landsat8SR = landsat8SR.select('B[4-7]');

///
//Make a graph of the cloudy pixels, just as a gut check
var TS_cloudy = ui.Chart.image.seriesByRegion({
  imageCollection:landsat8SR, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  band:'B5'
});

//Make a graph of the cloud masked pixels, just as a gut check.
var TS_cloudmasked_b5 = ui.Chart.image.seriesByRegion({
  imageCollection:landsat8SRb, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  band:'B5'
});


//print(TS_cloudy); //You can go into the graph itself and download the values to a csv file.  It generates an ID code.
print(TS_cloudmasked_b5);


//NDVI
var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B4']).rename('NDVI'));
};

//var addSR8 = function(image) {return image.addBands(image.select('B5').divide(image.select('B4')));};
var L8_SR=landsat8SRb.map(addNDVI);

//print(L8_SR);
//Make a graph of the NDVI, just as a gut check.  - Print this collectin to figure out what band it is in.
var SR_cloudmasked_L8_NDVI = ui.Chart.image.seriesByRegion({
  imageCollection:L8_SR, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  band:'NDVI'
});

//Thre is probably a way to read the "ID" column as a string, and then specify that for the Y axis in the chart
//But I don't know how to do that yet.
print(SR_cloudmasked_L8_NDVI);
//Export.table.toDrive(VAPoints); //This exports the plot table, but with google's generated ID Code

//NDMI
var addNDMI = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B6']).rename('NDMI'));
};

var L8_SR=landsat8SRb.map(addNDMI);

//Make a graph of the NDMI, just as a gut check.  - Print this collectin to figure out what band it is in.
var SR_cloudmasked_L8_NDMI = ui.Chart.image.seriesByRegion({
  imageCollection:L8_SR, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  band:'NDMI'
});


print(SR_cloudmasked_L8_NDMI);



//NBR
var addNBR = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B7']).rename('NBR'));
};

var L8_SR=landsat8SRb.map(addNBR);


//Make a graph of the NBR, just as a gut check.  - Print this collectin to figure out what band it is in.
var SR_cloudmasked_L8_NBR = ui.Chart.image.seriesByRegion({
  imageCollection:L8_SR, 
  regions:ShanPoints, 
  reducer:ee.Reducer.mean(), 
  band:'NBR'
});


print(SR_cloudmasked_L8_NBR);


/////////////////

var filtered_time = landsat8SR
    .filter(ee.Filter.eq('WRS_PATH', 16))
    .filter(ee.Filter.eq('WRS_ROW', 34))
    .filterDate('2016-07-01', '2016-07-30');  //July seems to wrok the best
print('filtered_time', filtered_time);

//var scene = ee.Image(filtered_time.first());

var visParams = {bands: ['B6', 'B5', 'B4']}; //need to set a stretch that works
//Map.addLayer(filtered_time, visParams, 'L8_SR collection');

// Create a geometry representing an export region.
var geometry = ee.Geometry.Rectangle([-78.76322, 38.34256,-78.60426, 38.25014]);

// Get the first (least cloudy) image.
var scene = ee.Image(filtered_time.first());
Map.addLayer(scene, visParams);

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: scene,
  description: 'July2017fire',
  scale: 30,
  region: geometry
});

//Map.setCenter(-121, 39.4, 6);

Map.addLayer(ShanPoints);

////////////////////////////////////////////////////////////////////


