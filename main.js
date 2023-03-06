import './style.css';
import {Map, View} from 'ol';
import Geolocation from "ol/Geolocation.js";
import Feature from 'ol/Feature.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {OSM, Vector as VectorSource,XYZ} from 'ol/source.js';
import { fromLonLat, transform } from 'ol/proj';
import {getBottomLeft,getBottomRight,getTopLeft,getTopRight} from 'ol/extent';
import { Point } from 'ol/geom';
import {getVectorContext} from 'ol/render.js';
import {easeOut} from 'ol/easing.js';
import {unByKey} from 'ol/Observable.js';
import {Circle as CircleStyle, Stroke, Style} from 'ol/style.js';


const button =document.getElementById("botoncito");
const mapita = document.getElementById("map");
button.addEventListener("click",function (){
  const lonText = document.getElementById("lon");
  const latText = document.getElementById("lat");
  console.log("hola we");
  mapita.style.zIndex=5;


  const source = 'EPSG:4326';
  const tempFeature = new Feature( new Point([lonText.value,latText.value]));
  tempFeature.getGeometry().transform(source, map.getView().getProjection());
  const newCords=tempFeature.getGeometry().getCoordinates();
  
  console.log(newCords);
  var isIn= coordValidation(newCords);
  if(isIn){
  onRequestHandler(newCords);

}else{
  mapita.style.zIndex=-5;
  alert("Las coordenadas ingresadas se encuentran fuera del limite");
}
})
// variable de async
var positionLocal = false;
var limits = [0.0,0.0,0.0,0.0];
///
const view = new View({
  center: [0,0],
  zoom:13,
  minZoom: 13,
})
const source = new VectorSource({

});
const vector = new VectorLayer({
  source: source,
});
const layer = new TileLayer({
  source: new  XYZ({
               url:"http://www.google.cn/maps/vt?lyrs=s@1139&gl=cn&x={x}&y={y}&z={z}"
    })
});
var map = new Map({
  target: 'map',
  layers: [ layer
    ,vector
  ],
  view: view,
 
});


const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: { enableHighAccuracy: true,},
  tracking: true,
  projection: view.getProjection(),

});

geolocation.on("change:position", function () {
  const position = geolocation.getPosition();
  map.setView(
    new View(
      {center: position,
        minZoom:13,
      zoom: 13,}
    )
  )
  console.log(map.getView().getZoom());
  const projection = map.getView().getProjection();
  // Calculate Edges
  const extent = map.getView().calculateExtent(map.getSize());

        console.log(extent);
const bottomLeft = (getBottomLeft(extent, projection));
const bottomRight = (getBottomRight(extent, projection));
const topLeft = (getTopLeft(extent, projection));
const topRight = (getTopRight(extent, projection));
console.log(position)

  //Add the local feature
  onRequestHandler(position);
  onRequestHandler(bottomLeft);
  onRequestHandler(bottomRight);
  onRequestHandler(topLeft);
  onRequestHandler(topRight);
    limits=[
      topLeft[0],
      topLeft[1],
      bottomRight[0],
      bottomRight[1]
    ] 
    console.log((limits));
});

 function coordValidation(coordinate) {
  if (coordinate[0] >= limits[0] &&  // Check if longitude is within bounds
    coordinate[0] <= limits[2] &&
    coordinate[1] <= limits[1] &&  // Check if latitude is within bounds
    coordinate[1] >= limits[3]) {
  console.log("Coordinate is inside the limits");
  return true;
} else {
  console.log(coordinate[0] >= limits[0] ) // Check if longitude is within bounds
    console.log(coordinate[0] <= limits[2] )
    console.log(coordinate[1] >= limits[1]  )// Check if latitude is within bounds
    console.log(coordinate[1] <= limits[3])
  console.log("Coordinate is outside the limits");
  return false;
}
}
//set the flashing point
function addCityFeature(position) {
  addFromLonLarFeature(position);
  window.setInterval(addFromLonLarFeature(position), 5000);
}
function addFromLonLarFeature(position) {
  const geom = new Point(position);
  const feature = new Feature(geom);
  source.addFeature(feature);
  
}

//async 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function onRequestHandler(cordinates){
  console.log(cordinates);
  await sleep(
    
  );
  positionLocal = true;
    while(positionLocal){
      console.log('calling json map');  
      addCityFeature(cordinates);
      await sleep(4000);
    }
  
}
///Flashing
const duration = 3000;
function flash(feature) {
  const start = Date.now();
  const flashGeom = feature.getGeometry().clone();
  const listenerKey = layer.on('postrender', animate);

  function animate(event) {
    const frameState = event.frameState;
    const elapsed = frameState.time - start;
    if (elapsed >= duration) {
      unByKey(listenerKey);
      return;
    }
    const vectorContext = getVectorContext(event);
    const elapsedRatio = elapsed / duration;
    // radius will be 5 at start and 30 at end.
    const radius = easeOut(elapsedRatio) * 25 + 5;
    const opacity = easeOut(1 - elapsedRatio);
    const style = new Style({
      image: new CircleStyle({
        radius: radius,
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, ' + opacity + ')',
          width: 0.25 + opacity,
        }),
      }),
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
    // tell OpenLayers to continue postrender animation
    map.render();
  }
}
source.on('addfeature', function (e) {
  console.log("added");
  flash(e.feature);
});