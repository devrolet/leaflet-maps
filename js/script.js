$('#map').height(window.innerHeight);
	$('#slide-in').height(window.innerHeight);

	$(document).on('click', "#advanced", function() {
		if($('#slide-in').hasClass('in')) {
			$('#slide-in').removeClass('in');
		} else {
			$('#slide-in').addClass('in');
		}
	})

	const map = L.map('map', { zoomControl: false }).setView([33.855348810045356, -84.01982156957057], 12);

	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

	fetch('json/countries.geo.json', {
		method: 'GET'
	})
	.then(response => response.json())
	.then(json => {
		countriesGeoJSON = L.geoJSON(json, {
			style: function(feature) {
				return {
					fillOpacity: 0,
					weight: 0.3
				};
			},
			onEachFeature: function(feature, layer) {
				layer.on('mouseover', function() {
					layer.setStyle({fillOpacity: 0.3})
				}),
				layer.on('mouseout', function() {
					layer.setStyle({fillOpacity: 0})
				})
			}
		}).addTo(map);
	})
	.catch(error => console.log(error.message));

	// map.fitBounds(countriesGeoJSON.getBounds());


	
	fetch('json/earthquake-day.geojson', {
		method: 'GET'
	})
	.then(response => response.json())
	.then(json => {
		earthquakeGeoJSON = L.geoJSON(json, {
			style: function(feature) {
				return {
					fillOpacity: 0.1,
					fillColor: '#333',
					color: '#333',
					opacity: 0.3
				};
			},
			pointToLayer: function(geoJsonPoint, latlng) {
        var html = '';
        var arrayOfProps = ['title', 'type', 'mag', 'place', 'time', 'url']
        arrayOfProps.forEach(function(prop) {
          html += `<strong>${prop}</strong>: ${geoJsonPoint.properties[prop]} <br />`
        })
				return L.circle(latlng, 10000*(geoJsonPoint.properties.mag)).bindPopup(html);
			}
		}).addTo(map);
		earthquakeGeoJSON.bringToFront();
		// map.fitBounds(countriesGeoJSON.getBounds());
	})
	.catch(error => console.log(error.message));

	$(document).on('keyup', function(e) {
		var userInput = e.target.value;
		earthquakeGeoJSON.eachLayer(function(layer) {
      if(layer.feature.properties.title.toLowerCase().indexOf(userInput.toLowerCase())>-1) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
      }
			console.log(layer);
		})
	})


	// Use default marker icon
	// L.marker([33.855348810045356, -84.01982156957057]).addTo(map).bindPopup('Snellville, GA');

	// Use custom marker icon
	// L.marker([33.9562, -83.9880], {icon: blackIcon}).addTo(map).bindPopup('Lawrenceville, GA');

	// let popup = L.popup({ maxWidth: 400 })
	// 	.setLatLng([33.7488, -84.3877])
	// 	.setContent('We be in the city')
	// 	.openOn(map);

	let geojson = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": {"coordinates": [ -84.1413499866286, 33.80879513146975 ],"type": "Point"}},{"type": "Feature", "properties": {}, "geometry": {"coordinates": [ -83.98638644188586, 33.95633534887867 ],"type": "Point"}},{"type": "Feature", "properties": {}, "geometry": {"coordinates": [ [[-84.26272022610178, 33.854703784090006 ],[-84.18036197854634, 33.743039652769866 ],[-83.96146242583328, 33.86730186936647 ],[-84.26272022610178, 33.854703784090006 ]]],"type": "Polygon"}}]}

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

	map.fitBounds(featureGroup.getBounds(), {
		padding: [20, 20]
	});

	var options = {units: 'miles'};

	map.on('mousemove', e => {
		// console.log(e);
		var from = turf.point([e.latlng.lat, e.latlng.lng]);
		markers.forEach(marker => {
			var to = turf.point([marker.getLatLng().lat, marker.getLatLng().lng]);
			var distance = turf.distance(from, to, options);
			if(distance<10) {
				marker.setIcon(greenIcon);
			} else {
				marker.setIcon(blackIcon);
			}
		});

		
	});

	map.on('moveend', function(e) {
		console.log(map.getCenter());
		$('#current_center').val(map.getCenter().lat+ ',' +map.getCenter().lng)
	});

	// $(document).on('click', '#toggleLayer', function() {
	// 	if(map.hasLayer(featureGroup)) {
	// 		map.removeLayer(featureGroup)
	// 	} else {
	// 		featureGroup.addTo(map);
	// 	}
	// });