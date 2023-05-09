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

	// map.fitBounds(countriesGeoJSON.getBounds());


	
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
		var heatMapPoints = [];
		json.features.forEach(function(feature) {
			heatMapPoints.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0], (feature.properties.mag / 6.2)]);
				if(feature.properties.mag<min || min === 0) {
						min = feature.properties.mag;
					}
				if(feature.properties.mag>max) {
						max = feature.properties.mag;
				}
		})
		var heat = L.heatLayer(heatMapPoints, {
			radius: 25,
			minOpacity: 0.4,
			gradient: {
				'0.00': 'rgb(255,0,255)',
				'0.25': 'rgb(0,0,255)',
				'0.50': 'rgb(0,255,0)',
				'0.75': 'rgb(255,255,0)',
				'1.00': 'rgb(255,0,0)'
			}
		}).addTo(map);
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


	// Use default marker icon
	// L.marker([33.855348810045356, -84.01982156957057]).addTo(map).bindPopup('Snellville, GA');

	// Use custom marker icon
	// L.marker([33.9562, -83.9880], {icon: blackIcon}).addTo(map).bindPopup('Lawrenceville, GA');

	// let popup = L.popup({ maxWidth: 400 })
	// 	.setLatLng([33.7488, -84.3877])
	// 	.setContent('We be in the city')
	// 	.openOn(map);

	// let geojson = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": {"coordinates": [ -84.1413499866286, 33.80879513146975 ],"type": "Point"}},{"type": "Feature", "properties": {}, "geometry": {"coordinates": [ -83.98638644188586, 33.95633534887867 ],"type": "Point"}},{"type": "Feature", "properties": {}, "geometry": {"coordinates": [ [[-84.26272022610178, 33.854703784090006 ],[-84.18036197854634, 33.743039652769866 ],[-83.96146242583328, 33.86730186936647 ],[-84.26272022610178, 33.854703784090006 ]]],"type": "Polygon"}}]}

	// Add GeoJSON options
	// let addedGeoJSON = L.geoJSON(geojson, {
	// 	style: function(feature) {
	// 		return {
	// 			color: '#000'
	// 		}
	// 	},
	// 	pointToLayer: function(geoJsonPoint, latlng) {
	// 		return L.marker(latlng, {
	// 				icon: blackIcon
	// 			});
	// 	},
	// 	onEachFeature: function(feature, layer) {
	// 		if(feature.geometry.type === 'Point') {
	// 			layer.bindPopup('Welcome to Atlanta');
	// 			// The line below displays the lat/lng of the point.
	// 			// layer.bindPopup(feature.geometry.coordinates.join(','));
	// 		}
	// 	}
		
	// }).addTo(map);

	// let markers = [];

	// var coordinates = [
	// 	[33.9304, -84.3733],
	// 	[33.6534, -84.4494],
	// 	[33.7748, -84.2963]
	// ]

	// coordinates.forEach(coords => {
	// 	let marker = L.marker(coords, {
	// 		icon: blackIcon
	// 	}).on('mousemove', function(e) {
	// 		e.target.setIcon(greenIcon);
	// 	}).on('mouseout', function(e) {
	// 		e.target.setIcon(blackIcon);
	// 	});
	// 	markers.push(marker)
	// })

	// let featureGroup = L.featureGroup(markers).addTo(map);

	// Bounds, add 20px padding
	// map.fitBounds(addedGeoJSON.getBounds(), {
	// 	padding: [20, 20]
	// });

	// map.fitBounds(featureGroup.getBounds(), {
	// 	padding: [20, 20]
	// });

	// var options = {units: 'miles'};

	// map.on('mousemove', e => {
	// 	// console.log(e);
	// 	var from = turf.point([e.latlng.lat, e.latlng.lng]);
	// 	markers.forEach(marker => {
	// 		var to = turf.point([marker.getLatLng().lat, marker.getLatLng().lng]);
	// 		var distance = turf.distance(from, to, options);
	// 		if(distance<10) {
	// 			marker.setIcon(greenIcon);
	// 		} else {
	// 			marker.setIcon(blackIcon);
	// 		}
	// 	});

		
	// });

	map.on('moveend', function(e) {
		$('#current_center').val(map.getCenter().lat+ ',' +map.getCenter().lng)
	});

	// $(document).on('click', '#toggleLayer', function() {
	// 	if(map.hasLayer(featureGroup)) {
	// 		map.removeLayer(featureGroup)
	// 	} else {
	// 		featureGroup.addTo(map);
	// 	}
	// });

