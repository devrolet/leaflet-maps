$('#map').height(window.innerHeight);
	$('#slide-in').height(window.innerHeight);

	$(document).on('click', "#advanced", function() {
		if($('#slide-in').hasClass('in')) {
			$('#slide-in').removeClass('in');
		} else {
			$('#slide-in').addClass('in');
		}
	})

	const map = L.map('map', { zoomControl: false }).setView([37.0902, -95.7129], 4);

	const tiles = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 20,
			attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
		}).addTo(map);

	var blackIcon = L.icon({
		iconUrl: 'svg/map-pin-marker.svg', 
		iconSize: [32, 32], // size of the icon
		iconAnchor: [16, 37], // point of the icon which will correspond to marker's location
		popupAnchor: [0, -30]  // point from which the popup should open relative to the iconAnchor
	});

	var greenIcon = L.icon({
		iconUrl: 'svg/map-pin-marker-green.svg', 
		iconSize: [32, 32], // size of the icon
		iconAnchor: [16, 37], // point of the icon which will correspond to marker's location
		popupAnchor: [0, -30]  // point from which the popup should open relative to the iconAnchor
	});

	var countriesGeoJSON = false;
	var earthquakeGeoJSON = false;
	var earthquakePointsArray = [];
  var filters = {
    text: '',
    range: []
  }

	fetch('json/countries.geo.json', {
		method: 'GET'
	})
	.then(response => response.json())
	.then(json => {
		// loop to get country list
		var htmlToAdd = [];
		json.features.forEach(function(feature) {
			$('#country-select').append(`<option value"${feature.properties.name}">${feature.properties.name}</option>`);
		});

		countriesGeoJSON = L.geoJSON(json, {
			style: function(feature) {
				return {
					fillOpacity: 0,
					weight: 0.3
				};
			},
			onEachFeature: function(feature, layer) {
				layer.on('mouseover', function() {
					layer.setStyle({fillOpacity: 0.3});
					$('#country-select').val('');

					var points = turf.points(earthquakePointsArray);
					var totalPoints = 0;
					if(layer.feature.geometry.coordinates[0].length===1) {
						layer.feature.geometry.coordinates.forEach(coords => {
							var searchWithin = turf.polygon(coords);
							var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
							totalPoints += ptsWithin.features.length;
						});
					} else {
							var searchWithin = turf.polygon(layer.feature.geometry.coordinates);
							var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
							totalPoints += ptsWithin.features.length;
					}
					
					$('#country-information').html(`${layer.feature.properties.name}(${layer.feature.id}): ${totalPoints.toString()}`);
				}),
				layer.on('mouseout', function() {
					layer.setStyle({fillOpacity: 0})
					$('#country-information').html('');
				})
			}
		}).addTo(map);
	})
	.catch(error => console.log(error.message));
	
	fetch('json/earthquake-data.geojson', {
		method: 'GET'
	})
	.then(response => response.json())
	.then(json => {
		json.features.forEach(function(feature) {
			earthquakePointsArray.push(feature.geometry.coordinates)
		});
    var min = 0;
    var max = 0;
		var markers = L.markerClusterGroup({
			iconCreateFunction: function(cluster) {
				// var width = cluster.getChildCount()*2;
				return L.divIcon({ html: `<div class="clusterdiv"><strong>${cluster.getChildCount()}</strong></div>`});
			},
			polygonOptions: {
				weight: 0.5,
				color: 'black'
			}
		});
		// var heatMapPoints = [];
		json.features.forEach(function(feature) {
			markers.addLayer(L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]));
		})
		map.addLayer(markers);
		// 	heatMapPoints.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0], (feature.properties.mag / 6.2)]);
		// 		if(feature.properties.mag<min || min === 0) {
		// 				min = feature.properties.mag;
		// 			}
		// 		if(feature.properties.mag>max) {
		// 				max = feature.properties.mag;
		// 		}
		// })
		// var heat = L.heatLayer(heatMapPoints, {
		// 	radius: 25,
		// 	minOpacity: 0.4,
		// 	gradient: {
		// 		'0.00': 'rgb(255,0,255)',
		// 		'0.25': 'rgb(0,0,255)',
		// 		'0.50': 'rgb(0,255,0)',
		// 		'0.75': 'rgb(255,255,0)',
		// 		'1.00': 'rgb(255,0,0)'
		// 	}
		// }).addTo(map);

		// Keep this for future reference

		// earthquakeGeoJSON = L.geoJSON(json, {
		// 	style: function(feature) {
		// 		return {
		// 			fillOpacity: 0.1,
		// 			fillColor: '#333',
		// 			color: '#333',
		// 			opacity: 0.3
		// 		};
		// 	},
		// 	pointToLayer: function(geoJsonPoint, latlng) {
    //     // get min/max

    //     if(geoJsonPoint.properties.mag<min || min === 0) {
    //       min = geoJsonPoint.properties.mag;
    //     }
    //     if(geoJsonPoint.properties.mag>max) {
    //       max = geoJsonPoint.properties.mag;
    //     }

    //     // add popup html
    //     var html = '';
    //     var arrayOfProps = ['title', 'type', 'mag', 'place', 'time', 'url']
    //     arrayOfProps.forEach(function(prop) {
    //       html += `<strong>${prop}</strong>: ${geoJsonPoint.properties[prop]} <br />`
    //     })
		// 		return L.circle(latlng, 10000*(geoJsonPoint.properties.mag)).bindPopup(html);
		// 	}
		// }).addTo(map);
		// earthquakeGeoJSON.bringToFront();
		// map.fitBounds(countriesGeoJSON.getBounds());

		// End Keep This for future reference

    filters.range = [min, max];
    var slider = document.getElementById('slider');
    noUiSlider.create(slider, {
        start: filters.range,
        tooltips: true,
        connect: true,
        range: {
            'min': min,
            'max': max
        }
    }).on('slide', function(e) {
      filters.range = [parseFloat(e[0]), parseFloat(e[1])];
      earthquakeGeoJSON.eachLayer(function(layer) {
        filterGeoJSON(layer);
      });
    });
	})
	.catch(error => console.log(error.message));

	$(document).on('keyup', function(e) {
    filters.text = e.target.value;
		earthquakeGeoJSON.eachLayer(function(layer) {
      filterGeoJSON(layer);
		});
    
	});

  $(document).on('change', '#country-select', function(e) {
		var newCountry = e.target.value;
		if(newCountry!=='') {
			countriesGeoJSON.eachLayer(function(layer) {
				if(layer.feature.properties.name===e.target.value) {
					$('#country-information').html(`${layer.feature.properties.name}: ${layer.feature.id}`);
					map.fitBounds(layer.getBounds());
				}
				
			});
		} else {
			$('#country-information').html('');
		}
	});

  function filterGeoJSON(layer) {
    var numberOfTrue = 0;
    if(layer.feature.properties.title.toLowerCase().indexOf(filters.text.toLowerCase())>-1) {
      numberOfTrue += 1;
    }
    if(layer.feature.properties.mag>=filters.range[0]&&layer.feature.properties.mag<=filters.range[1]) {
      numberOfTrue += 1;
    }
    if(numberOfTrue===2) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  }

	map.on('moveend', function(e) {
		$('#current_center').val(map.getCenter().lat+ ',' +map.getCenter().lng)
	});

// Geolocation
// setInterval(function() { // For evil doing lol
	if("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(function(position) {
			console.log(position.coords.latitude, position.coords.longitude);
			L.circle([position.coords.latitude, position.coords.longitude], {
				radius: 1000,
				opacity: 1,
				color: 'white',
				weight: 1,
				fillOpacity: 0.7,
				fillColor: 'blue'
			}).addTo(map);
		});
	}else {
			console.log("Geolocation is unavailable...")
	}
// }, 1000);