var socket = io.connect();



/*

	Persistent config

*/

var appConfig = {};
var currentVersion = 0.2;


function loadAppConfig() {


	// Get current user
	appConfig = store.get('app-config');	

	// Doesn't exist? set defaults
	var exists = (appConfig == null) ? false : true;

	var oldVersion = false;
	if (exists) {
		oldVersion = (appConfig.version < currentVersion) ? true : false;
	}

	var defaultConfig = { 
		version: currentVersion,
		locked: true,
		playing: false,
		showUI: false,
		speed: 1,
		headerFrequency: 20,
		forcedReload: false,
		showIndicators: true
	};

	var reset = (!exists || oldVersion) ? true : false;

	if (reset) {
		console.log('Reset local storage config!');
		store.set('app-config', defaultConfig);
		appConfig = store.get('app-config');
	} 

	return appConfig;

}

loadAppConfig();

function saveAppConfig() {
	store.set('app-config', appConfig);
}



$(function(){

		// console.log(appConfig.x);

		$.extend(verge);

		var useOptimizedImages = true;
		var env = "DEV";		
		var imagesFolder = "photos/";
		var screenWidth = 1920;
		var screenHeight = 1080;



		var fillSettings = {

			portrait: {
				width: 94	
				, height: 94
			},
			landscape: {
				width: 85
				, height: 85
			}

		};

		var fillWidth = 50;
		var fillHeight = 50;
		var imageManifest = [];
		var imageManifestShuffled = [];
		var imageLayout = [];
		var container = $('#container');
		var containerEl = $('#container')[0];

		var containerWidth = container.width();
		var containerHeight = container.height();

		var deleteElementOnTap = false;
		var commentElementOnTap = false;

		var headerSlideFrequency = 20;


		function isRetinaDisplay() {
			if (window.matchMedia) {
			    var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
			    return (mq && mq.matches || (window.devicePixelRatio > 1)); 
			}
		}			

		var isRetina = isRetinaDisplay();


		/*

			Window Resize Function

		*/

		function updateWindowSize() {

			screenWidth = $.viewportW();
			screenHeight = $.viewportH();

			if (screenHeight > screenWidth) {
				$('#container').removeClass('landscape').addClass('portrait');
			} else {
				$('#container').removeClass('portrait').addClass('landscape');
			}

			// If there's active photo containers, also update their sizes to the new width/height
			for (var i = 0; i<imageManifest.length; i++) {

				var image = imageManifest[i];

				var el = document.getElementById(image.id);

				if (el == null) {} else {

					updateItemInScene(el, image);

					var dimensions = fitImageToScreen(image);
					var center = centerImageToScreen(dimensions);

					el.style.width = dimensions.width + 'px';
					el.style.height = dimensions.height + 'px';

					var center = centerImageToScreen(dimensions);
					
					el.style.top = center.y + 'px';
					el.style.left = center.x + 'px';		 


					
				}

			}

			if(!appConfig.playing) { updateIndicators(); }

			
		};

		$(window).resize(updateWindowSize);
		updateWindowSize();

		/*

			App Config
			

		*/	

		/*
			UI Visibility
		*/

		var $controlsMenu = $('#controls-menu');
		var $lockButton= $('#lock-button');
		var $addButton = $('#add-button');
		var $removeButton = $('#remove-button');
		var $commentButton = $('#comment-button');


		if (appConfig.showUI) {
			showUI(true);
		} else {
			showUI(false);
		}

		/*
			Start location
			Defaults to center if no pre-location found in config
		*/

		function getContainerCenter() {
			return ({x: (container.width() / -2) , y: (container.height() / -2)});
		}

		var containerCenter = getContainerCenter();
		var destination = containerCenter;

		if (appConfig.x && appConfig.y) {
			destination = viewportRelativeToTransform({x: appConfig.x, y: appConfig.y});
		}			

		container.velocity({
			translateX: destination.x + 'px',
			translateY: destination.y + 'px'
		},0).attr({
			'data-x': destination.x
			, 'data-y': destination.y
		});

		/* 

			Lock+Play settings

		*/

		if (appConfig.playing) {
			appConfig.playing = false;
			saveAppConfig();
		}
	


		/*

			Socket.io
			Update image position 
			Send to server

		*/

		socket.on('connect', function () {
			console.log('Connected to ws server.');
			socket.emit('requestManifest');
		});

		var updated = false;
		socket.on('manifest', function(data) {
			console.log('Got manifest update!');
			imageManifest = data;		
			imageManifestUpdated = true;
			updateLayout();		
		});

		// Callback in case web socket transfer fails
		setTimeout(function() {

			if (imageManifest.length > 0) { return };

			console.log('Failed to retrieve manifest from websocket... reverting to ajax!');

			// Retrieve images manifest from server
			$.ajax({
			    url : 'manifest.json',
			    success: function(data) {

			    	console.log('Got AJAX manifest update!');

					imageManifest = data;
					imageManifestUpdated = true;
					updateLayout();		

			    }
			});

		}, 2000);

		socket.on('updateItemClient', function(data) {

			console.log('received update from server');

			var id = data.id;

			var found = false;

			// Load the layout json initially
			// API.TOOLS.loadManifest();

			// Try and find this image in the manifest
			for(var i = 0; i < imageManifest.length; i++) {

				var image = imageManifest[i];

				if (image.id == id) {

					found = true;

					for (var key in data) {
						image[key] = data[key];					      
					}

					break;

				}
			}

			if (!found) { return false; };


			var el = document.getElementById(data.id);

			if (el === null) {		
				addImageToScene(data);
			} else {
				updateItemInScene(el, data.props);
			}
		});

		// socket.on('updateItemIndex', function(data) {

		// 	var el = document.getElementById(data.id);

		// 	if (el === null) {		
		// 		addImageToScene(data);
		// 	} else {
		// 		updateImageInScene(el, data);
		// 	}
		// });



		socket.on('disconnect', function () {
			console.log('Disconnected from ws server.');
		});

		socket.on('reconnect', function () {
			console.log('Reconnected with ws server.');
		});

		socket.on('reconnect_error', function () {
			console.log('Attempting to reconnect with ws server.');
		});	

		socket.on('log', function (data) {
			console.log(data);
		});


		/*

			Interact.js
			Draggable containers + photos

		*/

		var isDragging = false;

		// $('#container .photo').hammer().on('tap', function(e) {
		// 	console.log('trying to push!');
		// 	pushImageToFront($(this)[0]);			
		// });

		interact('.tap-comment')
		  .on('tap press', function(event) {

			if (appConfig.locked) { event.preventDefault(); return; };

			var target = event.currentTarget;
			var currentComment = target.innerHTML;
			var newComment = prompt("Enter your comment", currentComment);

			var comment = (newComment == null) ? '' : newComment;
	
	  	 	target.innerHTML = newComment;

	  	 	console.log(target.parentElement.getAttribute('id'));

	  	 	socket.emit('updateItem', {

				id: target.parentElement.getAttribute('id')
				,	props: {
					comment: comment
				}

			});
		  

		  });


		interact('.tap-index')
		  .on('tap press', function (event) {		  

		  	if (deleteElementOnTap) {

		  
		  		var result = confirm("Remove this image?");
		  		if (result) {

		  			deleteElementOnTap = false;

			  		socket.emit('removeImage', {
			  			id: event.currentTarget.getAttribute('id')
			  		});		  		

			  		setRemoving(false);
			  	}

		  		return;
		  	}

		  	if (commentElementOnTap) {

		  		var target = event.currentTarget;
		  		var targetComment = $(target).find('span.comment');
				var currentComment = targetComment.html();
				var newComment = prompt("Enter your comment", currentComment);

				var comment = (newComment == null) ? '' : newComment;
		
		  	 	targetComment.html(newComment);

		  	 	socket.emit('updateItem', {

					id: target.getAttribute('id')
					,	props: {
						comment: comment
					}

				});

		  	 	commentElementOnTap = false;
				setCommenting(false);

				return;
		  	}

			pushImageToFront(event.currentTarget);		
		    event.preventDefault();	    


		  });


		 interact('.drag')
		.draggable({
			// enable inertial throwing
			inertia: true,
			// keep the element within the area of it's parent
			// restrict: {
			// 	restriction: "parent",
			// 	endOnly: true,
			// 	elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
			// },
			// enable autoScroll
			autoScroll: false,
			onstart: function(event) {

				// clearOtherDragEvents();

				// if (appConfig.showUI) {
				// 	showUI(false);
				// }

				isDragging = true;
			},
			// call this function on every dragmove event
			onmove: dragMoveListener,
			// call this function on every dragend event
			onend: onDragEnd
		});

		// target elements with the "draggable" class
		interact('.drag-rotate')
		.draggable({
			// enable inertial throwing
			inertia: false,
			// keep the element within the area of it's parent
			// restrict: {
			// 	restriction: "parent",
			// 	endOnly: true,
			// 	elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
			// },
			// enable autoScroll
			autoScroll: false,
			onstart: function(event) {				
				var target = event.target;
				target.classList.add('dragging');
				isDragging = true;
			},
			// call this function on every dragmove event
			onmove: dragMoveListener,
			// call this function on every dragend event
			onend: onDragEnd
		})		
		.gesturable({
			onstart: function(event) {
				isDragging = true;
			},
			onmove: dragRotateListener,
			onend: function(event) {
				isDragging = false;
			}
		});

		// function clearOtherDragEvents() {

		// 		interact('.drag-rotate')
		// 			.draggable(false);

		// 		interact('.drag')
		// 			.draggable(false);

		// 		interact('.drag')
		// 			.draggable(true);

		// 		interact('.drag-rotate')
		// 			.draggable(true);

		// };

		function onDragStart(event) {

			// e
			var target = event.target,
			isDragging = true;			
		
		}
		
		function onDragEnd(event) {

			// e
			var target = event.target,

			isDragging = false;	

			// Force update positions incase one of our images has moved transform
			updateIndicatorPositions();
			
		
			if (!target.getAttribute('data-master')) {
				target.classList.remove('dragging');
				return;
			}		

			setContainerTransformVelocityFix(target);	

			// updateContainerConfigLocation();
		}

		var d = new Date();
		var lastContainerLocationUpdate = d.getTime();
		var maxContainerLocationUpdate = 100;

		function updateContainerConfigLocation(force) {

			var force = force || false;

			d = new Date();
			var currentTime = d.getTime();
			if (currentTime - lastContainerLocationUpdate < maxContainerLocationUpdate && !force) {
				return;
			}

			lastContainerLocationUpdate = currentTime;

			x = parseFloat(container[0].getAttribute('data-x'));
			y = parseFloat(container[0].getAttribute('data-y'));

			var viewportTransform = transformToViewportRelative({x : x, y: y});

			appConfig.x = viewportTransform.x;
			appConfig.y = viewportTransform.y;

			// console.log('Saving location: ' + appConfig.x + ' ' + appConfig.y);

			saveAppConfig();
		}

		function dragRotateListener (event) {

			var target = event.target,

			x = parseFloat(target.getAttribute('data-x'));
			y = parseFloat(target.getAttribute('data-y'));
			rotation = (parseFloat(target.getAttribute('data-rotation')) || 0);		

			if (!target.getAttribute('data-master')) {
				rotation += event.da;
			}

			// translate the element
			target.style.webkitTransform =
			target.style.transform =
			'translateX(' + x + 'px) translateY( ' + y + 'px) rotate(' + rotation + 'deg)';
			
			target.setAttribute('data-rotation', rotation);

			sendImageLocation(event.target);

		}

		

		var loopIsActive = false;

		// function cullImagesLoop(frequency) {

		// 	var frequency = frequency || 1000;

		// 	cullImages();
		// 	console.log('running image culling');
		// 	setTimeout(cullImagesLoop(frequency), frequency);
		// }

		// cullImagesLoop(1000);

		function transformStringToFloat(string) {

			var transXRegex = /\.*translateX\((.*)px\)/i;
			var transYRegex = /\.*translateY\((.*)px\)/i;
			var transZRegex = /\.*translateZ\((.*)px\)/i;
			var rotateRegex = /\.*rotate\((.*)deg\)/i;

			var x = transXRegex.exec(string) || [0,0];
			var y = transYRegex.exec(string) || [0,0];
			var z = transZRegex.exec(string) || [0,0];
			var r = rotateRegex.exec(string) || [0,0];


		

			return {
				x: parseFloat( x[1] ), 
				y: parseFloat( y[1] ), 
				z: parseFloat( z[1] ), 
				r: parseFloat( r[1] ) 
			};
		}

		var d = new Date();
		var lastCullCheck = d.getTime();
		var maxCullChecks = 250;
		var cullDistance = 1.25;		


		function cullImages() {
				
			d = new Date();
			currentTime = d.getTime();
			if (currentTime - lastCullCheck < maxCullChecks) {
				return
			}
			lastCullCheck = currentTime;

			var photos = document.getElementsByClassName("photo");

			var totalShown = 0;

			var screenCenter = getCurrentTransformFromContainerCenter();
			var screenDimensions = {width: screenWidth, height: screenHeight };

			var totalHidden = 0;

			for(var i = 0; i < photos.length; i++)
			{

				var element = photos[i];
				if (element == null) { continue; };

				var targetTransform = {
					x: element.getAttribute('data-x') || 0
					, y: element.getAttribute('data-y') || 0
				}				

				var trueTransform = {x: targetTransform.x - screenCenter.x, y: targetTransform.y - screenCenter.y };	
				var relativeTransform = transformToViewportRelative(trueTransform);			

				var distance = distanceBetweenPoints({x:0 , y: 0}, relativeTransform);

				var isVisible = (distance < cullDistance) ? true : false;

				var isHidden = element.classList.contains('hidden');

				if (isVisible && isHidden) {
					element.classList.remove('hidden');
				} else if (!isVisible && !isHidden) {
					element.classList.add('hidden');					
				}

				if (element.classList.contains('hidden')) { totalHidden++; };
			}

			console.log('Hidden images: ' + totalHidden + ' Visible images: ' + (photos.length-totalHidden));

		}


		// var hide = false;

		// $('body').click(function(e){

		// 	cullImages();

		// 	// e.preventDefault();
		// 	// var ind = addIndicator('test', 0, 0);
		// });

		var activeIndicators = [];

		function addHeaderIndicator() {

			var headerIndicator = addIndicator('header');
			if (headerIndicator != null) {
				headerIndicator.classList.add('home');
			}

		}

		addHeaderIndicator();

		function addIndicator(target) {

			var found = false;

			if (activeIndicators == null) { return };

			for (var i = 0; i<activeIndicators.length; i++) {

				var indicator = activeIndicators[i].element;
				var indicatorTarget = activeIndicators[i].target;
				if (indicatorTarget == target) {
					found = true;
					break;
				}
			}

			if (found) { return null; };

			var indicator = document.createElement('div');
			indicator.classList.add('indicator');
			indicator.setAttribute('id', target + '-indicator');
			var body = document.body;
			body.appendChild(indicator);

			activeIndicators.push({
				element: indicator, 
				target: target, 
				transform: {x:0, y:0}
			});

			updateIndicatorPositions();

			return indicator;
		}

		function removeIndicator(indicator) {
			if (indicator == null) { return false; };
			if (indicator.parentNode == null) { return false; };
			indicator.parentNode.removeChild(indicator);		
			return true;	
		}

		function clearAllIndicators() {

			for (var i = 0; i<activeIndicators.length; i++) {
				removeIndicator(activeIndicators[i].element);
			}

			activeIndicators = [];
		}

		var d = new Date();
		var lastIndicatorUpdate = d.getTime();
		var maxIndicatorUpdates = 100;

		function updateIndicatorPositions() {

			for (var i = 0; i<activeIndicators.length; i++) 
			{	
				var indicatorElement = activeIndicators[i].element;

				var target = activeIndicators[i].target;
				var targetElement = document.getElementById(target);

				// Target exists, let's create a math headache!
				var transformX = targetElement.getAttribute('data-x') || 0;
				var transformY = targetElement.getAttribute('data-y') || 0;
				var targetTransform = {x: transformX, y: transformY };

				// Store the transform for retrieval
				indicatorElement.transform = targetTransform;
			}

		}


		var maxActiveIndicators = 15;
		var indicatorThreshold = 5000;

		function updateIndicators(force) {

			d = new Date();
			var currentTime = d.getTime();
			if (currentTime - lastIndicatorUpdate < maxIndicatorUpdates && !force) {
				return;
			} else {
				lastIndicatorUpdate = currentTime;
			}

			var screenCenter = getCurrentTransformFromContainerCenter();
			var screenDimensions = {width: screenWidth, height: screenHeight };

			var hidden = 0;

			for (var i = 0; i<imageManifest.length; i++) 
			{

				var image = imageManifest[i];
				var id = image.id;

				var imageElement = document.getElementById(id);

				// Try and fine the associated indicator with this image
				var indicatorElement = document.getElementById(id + '-indicator');

				// // If it doesn't exist, create it
				if (indicatorElement == null) { 

					addIndicator(id); 

				}	

			}

			if (activeIndicators == null) { 
				activeIndicators = [];
			}			
			
			var currentIndicators = 0;

			for (var i = 0; i<activeIndicators.length; i++) {

				var indicatorElement = activeIndicators[i].element;

				var target = activeIndicators[i].target;

				var targetElement = document.getElementById(target);

				// Remove indicators with no valid target
				if (targetElement == null) {
					if (removeIndicator(indicatorElement)) {
						activeIndicators.splice( activeIndicators[i], 1);
					}
				} else {
				
					// Target exists, let's create a math headache!
					var targetTransform = indicatorElement.transform;
					var trueTransform = {x: targetTransform.x - screenCenter.x, y: targetTransform.y - screenCenter.y };					
					var slope = (trueTransform.y) / (trueTransform.x);			
					var relativeTransform = transformToViewportRelative(trueTransform);				
					var viewportCenter = {x: screenWidth/2, y: screenHeight /2};
					var targetPosition = {x: viewportCenter.x + (relativeTransform.x * (screenWidth)), y: viewportCenter.y + (relativeTransform.y * screenHeight) };
					var distance = distanceBetweenPoints({x:0 , y: 0}, targetPosition);

					// Force hide of it's outside minimum distance
					if (distance > indicatorThreshold || currentIndicators > maxActiveIndicators) {
						if (indicatorElement.classList.contains('show')) {
			        		indicatorElement.classList.remove('show');
			        	}	

					} else {

						currentIndicators++;

						if (!indicatorElement.classList.contains('show')) { 
				        	indicatorElement.classList.add('show');
				        }

						var slope = (screenHeight /screenWidth);	

						var indicatorPosition = {x: indicatorElement.left, y: indicatorElement.top,};

						var offY = false;
						var offX = false;
						var offRight = false;
						var offBottom = false;

						if(targetPosition.y<0){// Top

							offY = true;

				            indicatorPosition = {
				            	x:(targetPosition.x/2)/slope,
				            	y:0
				            }

				        }else if (targetPosition.y>screenHeight) { // Bottom

				        	offY = true;
				        	offBottom = true;

				            indicatorPosition = {
				            	x:targetPosition.x/slope,
				                y:screenHeight
				            }

				        }

				        if(targetPosition.x<0){ // Left

				        	offX = true;

				            indicatorPosition = {
				            	x: 0,
				                y: targetPosition.y * slope * 2
				            }

				        }else if (targetPosition.x>screenWidth) {// Right

				        	offX = true;
				        	offRight = true;

				            indicatorPosition = {
				            	x:screenWidth,
				                y: targetPosition.y * slope * 2
				            }
				        }


				        indicatorPosition = {
				        	x: Math.clamp(indicatorPosition.x, 0, screenWidth), 
				        	y: Math.clamp(indicatorPosition.y, 0, screenHeight) 
				        };

				        // If it's inside the screen bounds, show it, otherwise hide
				        if (!offX && !offY) {
				        	indicatorPosition.x = -1000;
				        	indicatorPosition.y = -1000;
				        	indicatorElement.style.top  = indicatorPosition.y + 'px';
							indicatorElement.style.left  = indicatorPosition.x + 'px';

				        } else {

				        	indicatorElement.style.top  = indicatorPosition.y + 'px';
							indicatorElement.style.left  = indicatorPosition.x + 'px';

					        if (offRight) {
					        	indicatorElement.classList.add('offRight');
					        } else {
					        	indicatorElement.classList.remove('offRight');
					        }

					        if (offBottom) {
					        	indicatorElement.classList.add('offBottom');
					        } else {
					        	indicatorElement.classList.remove('offBottom');
					        }		
						
							var scale = lerp(1, 0.5, distance/10000);
							var opacity = (!offX && !offY) ? 0 : lerp(0.8, 0.25, distance/10000);

							indicatorElement.style.opacity = opacity;
							indicatorElement.style.transform  = 'scale(' + scale + ')';
							

						}

					}

				}

				console.log('Hidden indicators: ' + (activeIndicators.length - currentIndicators) + ' visible indicators: ' + currentIndicators);

			};

			

		}
	
		function dragMoveListener (event) {

			var target = event.target,
			// keep the dragged position in the data-x/data-y attributes
			x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
			y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
			rotation = (parseFloat(target.getAttribute('data-rotation')) || 0);

			// Container bounds check
			if (target.getAttribute('data-master')) {		
					
			
				// Left buffer
				if (x > screenWidth/-2) {
					var deltaX = x - (screenWidth/-2);
					x-= deltaX /3;
				}

				// Right buffer
				if (x < (-containerWidth)+screenWidth) {
					var deltaX = ((-containerWidth)+screenWidth) - x;
					x+= deltaX /3;
					console.log('right!');
				}


				// Top buffer
				if (y > screenHeight/-2) {
					var deltaY = y - (screenHeight/-2);
					console.log(screenHeight/-2 + 'top!');
					y-= deltaY /3;
				}

				// Bottom buffer
				if (y < (-containerHeight)+screenHeight) {
					var deltaY = ((-containerHeight)+screenHeight) - x;
					y-= deltaY /3;
				}

			}		



			// translate the element
			target.style.webkitTransform =
			target.style.transform =
			'translateX(' + x + 'px) translateY( ' + y + 'px) rotate(' + rotation + 'deg)';

			// update the posiion attributes
			target.setAttribute('data-x', x);
			target.setAttribute('data-y', y);

			cullImages();

			if (!appConfig.locked) {
				sendImageLocation(event.target);
			}

			if (!appConfig.playing) {
				updateIndicators();
			}

			if (!target.getAttribute('data-master')) {		
				return;
			}		








			updateContainerConfigLocation();

		}

		function transformToViewportRelative(transform) {

			var screen = {width: screenWidth, height: screenHeight};

			return {
				x: transform.x/screen.width,
				y: transform.y/screen.height
			};
		}

		function viewportRelativeToTransform(viewport) {

			var screen = {width: screenWidth, height: screenHeight};

			return {
				x: screen.width * viewport.x,
				y: screen.height * viewport.y
			};
		}


		function sendImageLocation(target) {	

			if (!target.getAttribute('data-update')) { return };

			var id = target.getAttribute('id') || 'null';

			if (id == 'null') {
				console.log('Error updating — no image id attribute reference.');
				return
			}

			var newX = parseFloat(target.getAttribute('data-x'));
			var newY = parseFloat(target.getAttribute('data-y'));	
			var newRotation = (parseFloat(target.getAttribute('data-rotation')) || 0);		

			
			var viewport = transformToViewportRelative({x: newX, y: newY });


			socket.emit('updateItem', {

				id: id,
				props: {
					x: viewport.x,
					y: viewport.y,
					rotation: newRotation
				}

			});

		}

		function setContainerTransformVelocityFix(target) {

			x = parseFloat(target.getAttribute('data-x'));
			y = parseFloat(target.getAttribute('data-y'));
			rotation = (parseFloat(target.getAttribute('data-rotation')) || 0);					

			$('#container').velocity({
				translateX: x + 'px',
				translateY: y + 'px'
			},0).attr({
				'data-x': x
				, 'data-y': y
			});

		}	

		function getIndex(target) {
		  	var z = document.defaultView.getComputedStyle(target).getPropertyValue('z-index');
		    if (isNaN(z)) return getZIndex(target.parentNode);
		    else return z; 
		};

		function pushImageToFront(target) {

			var id = target.getAttribute('id');
			var highest = 0;

			for (var i = 0; i<imageManifest.length; i++) {

				var image = imageManifest[i];

				if (
					image.id != id &&
					// image.loaded && 
					image.index > highest
				) {
					highest = image.index;
				}
			}

			

			var newIndex = highest + 1;
			
			console.log('New highest: ' + newIndex);

			// target.style.zIndex = newIndex;

			socket.emit('updateItem', {
				id: target.getAttribute('id'),
				props: {
					index: newIndex
				}
			});		

		}

		function showUI(state) {

			appConfig.showUI = state;
		
	  		if (state) {	  			
				$controlsMenu.removeClass('hide');	
	  		} else {
	  			$controlsMenu.removeClass('hide').addClass('hide');		
	  		}	

	  		saveAppConfig();

		}


		function setLocked(state) {

			appConfig.locked = state;	
	  			  		
	  		if (appConfig.locked) {

	  			container.find('.drag-rotate').removeClass('drag-rotate'); 		
	  			$lockButton.removeClass('active');

	  			$('.unlocked-only').addClass('hide');

	  		} else {
				
				container.find('.photo').addClass('drag-rotate');				
	  			$lockButton.addClass('active');	

	  			$('.unlocked-only').removeClass('hide');
	  		}	

	  		saveAppConfig();

		}
	
		var imageManifestShuffled = [];

		function distanceBetweenPoints(p1, p2) {
			var a = p1.x - p2.x;
			var b = p1.y - p2.y;
			return (Math.sqrt( a*a + b*b ));
		}

		/**
		 * Randomize array element order in-place.
		 * Using Durstenfeld shuffle algorithm.
		 */
		function shuffleArray(array) {
		    for (var i = array.length - 1; i > 0; i--) {
		        var j = Math.floor(Math.random() * (i + 1));
		        var temp = array[i];
		        array[i] = array[j];
		        array[j] = temp;
		    }
		    return array;
		}

		function getShuffledManifest() {

			if (imageManifestShuffled.length < 1 || imageManifestUpdated) {
				imageManifestUpdated = false;
				console.log('Updated shuffled manifest!');
				return shuffleArray( imageManifest.slice(0) );				
			}

			return imageManifestShuffled;
		}

		var lastImageID = '';

		function getRandomClosestImageNoRepeat(position, distance, loopcount) {			

			imageManifestShuffled = getShuffledManifest();	

			var maxDistance = distance || 2000;
			var minDistance = 100;
			var count = loopcount || 0;

			var closest;
			var closestIndex = -1;		

			var nearbyImages = [];

			for (var i = 0; i < imageManifestShuffled.length; i++) {

				var image = imageManifestShuffled[i];

				var relative = viewportRelativeToTransform({x: image.x, y: image.y});

				var distance = distanceBetweenPoints(position, relative);

				if (distance < maxDistance && distance > minDistance && image.id != lastImageID) {

					nearbyImages.push({ image: image, index: i, distance: distance });

					// dist = distance;
					// closest = image;
					// closestIndex = i;
				}

			};

			if (count > 10) {
				return null;
			}

			if (nearbyImages.length == 0) {
				count = count + 1;
				var newDistance = maxDistance + 500;
				var res = getRandomClosestImageNoRepeat(position, newDistance, count);
				if (res == null) { return null; }
				lastImageID = res.id;
				return res;
			}

			var rand = Math.round( Math.random() * (nearbyImages.length - 1) );
			var selected = nearbyImages[rand];
			var selectedImage = selected.image;
			var selectedIndex = selected.index;			
			lastImageID = selected.id;

			imageManifestShuffled.splice(selectedIndex, 1);					

			return {image: selectedImage, distance: selected.distance };
		}

		function lerp (value1, value2, amount) {
	        amount = amount < 0 ? 0 : amount;
	        amount = amount > 1 ? 1 : amount;
	        return value1 + (value2 - value1) * amount;
    	}

    	var slideCount = 0;

    	function killSlideSequence() {
			$(".velocity-animating").velocity("stop", true);
    	}

		function playSlideSequence() {

			if (!appConfig.playing) {
				return;
			}

			slideCount++;

			var centerTransform = getContainerCenter();
			centerTransform = {x: centerTransform.x, y: centerTransform.y };

			relativeTransform = getCurrentTransformFromContainerCenter();

			var closest = getRandomClosestImageNoRepeat(relativeTransform);

			var image = (closest == null) ? null : closest.image;
			var distance = (closest == null) ? 1000 : closest.distance;	
			var transitionDelay =  lerp(500, 15000, distance / 1000);

			// console.log('Got transition delay: ' + transitionDelay + ' slideCount: ' + slideCount);

			var holdDelay = (image == null || closest == null || image.delay == null) ? 6000 : image.delay;
			var relative = (image == null) ? ({x: 0, y: 0}) : viewportRelativeToTransform({x: image.x, y: image.y});
			var newTransform = (image == null) ? centerTransform : ({ x: centerTransform.x - relative.x, y:  centerTransform.y - relative.y});
			var slideSequence = [];

			if (image == null || slideCount >= headerSlideFrequency) {

				if (slideCount >=  headerSlideFrequency) {
					slideCount = 0;
				}	

				console.log('Returning to center!');

				slideSequence.push( 
					{ 
						e: container, 
						p: { 
							translateX: centerTransform.x + 'px'
							, translateY: centerTransform.y + 'px'
						}, 
						o: {
							duration: (10000 / appConfig.speed)
						} 
					}
				);

				slideSequence.push( 
					{ 
						e: container, 
						p: { 
							scale: 1.02
						}, 
						o: {
							duration: (6000 / appConfig.speed)
							,   progress: function() {
								cullImages()
							}
							,   complete:function() {

								sequenceActive = false;
								updateContainerConfigLocation(true);
								playSlideSequence();

								container.attr({
									'data-x': newTransform.x
									, 'data-y': newTransform.y
								});
							}
						} 
					}
				);

				slideSequence.push( 
					{ 
						e:container, 
						p: { 			
							scale: 1
						}, 
						o: {
							duration: (6000 / appConfig.speed)
							, sequenceQueue: false
						} 
					}
				);



				$.Velocity.RunSequence(slideSequence);

			} else {		

				slideSequence.push( 
					{ 
						e: container, 
						p: { 
							translateX: newTransform.x + 'px'
							, translateY: newTransform.y + 'px'
						}, 
						o: {
							duration: (transitionDelay / appConfig.speed)
							,   progress: function() {
								cullImages()
							}
							,   complete:function() {
								container.attr({
									'data-x': newTransform.x
									, 'data-y': newTransform.y
								});
							}
						} 
					}
				);

				var el = document.getElementById(image.id);
				var elImg = $(el).find('img');
				slideSequence.push( 
					{ 
						e: elImg, 
						p: { 			
							scale: 1.05
						}, 
						o: {
							duration: (holdDelay / appConfig.speed)
							, complete:function() {
								sequenceActive = false;
								updateContainerConfigLocation(true);
								playSlideSequence();
							}
						} 
					}
				);

				slideSequence.push( 
					{ 
						e:elImg, 
						p: { 			
							scale: 1
						}, 
						o: {
							duration: (holdDelay / appConfig.speed)
							, sequenceQueue: false
						} 
					}
				);

				// console.log(imageSequence);
				// Run this sequenc e
				$.Velocity.RunSequence(slideSequence);

			}



			// $('#container').velocity({
			// 	translateX: newTransform.x + 'px'
			// 	, translateY: newTransform.y + 'px'
			// }, 1000).attr({
			// 	'data-x': newTransform.x,
			// 	'data-y': newTransform.y
			// });
		}

		var previousLockState;
		var previousUIHideState;


		function setCommenting(state) {

			if (state) {

				container.addClass('commenting');
				$commentButton.addClass('active');

			} else {

				container.removeClass('commenting');
				$commentButton.removeClass('active');
			}
		}


		function setRemoving(state) {

			if (state) {

				container.addClass('removing');
				$removeButton.addClass('active');

			} else {

				container.removeClass('removing');
				$removeButton.removeClass('active');
			}
		}


		function setPlaying(state) {

			appConfig.playing = state;

			if (state) {

				clearAllIndicators();

				$('#play-icon').removeClass('active').addClass('active');

				// previousLockState = appConfig.locked;		

				// Hide the toolbar
				if (appConfig.showUI) {
					previousUIHideState = appConfig.showUI;
					showUI(false);
				}

			
				previousLockState = appConfig.locked;
				setLocked(true);
				

				// Lock main container from being dragged
				container.removeClass('drag');

				if (container.hasClass('velocity-animating')) {
					container.velocity('resume');
				} else {
					playSlideSequence();
				};

			} else {

				addHeaderIndicator();
				updateIndicators();

				if (container.hasClass('velocity-animating')) {
					container.velocity('stop');
				}

				$('#play-icon').removeClass('active');

				// Prevent elements being dragged				
				if (previousLockState) { setLocked(previousLockState);	};

				// Restore the toolbar
				if (previousUIHideState) { showUI(previousUIHideState); };
			
				// Allow main container to be dragged
				container.addClass('drag');
			}

			saveAppConfig();

		}

		function getCurrentTransformFromContainerCenter() {

			var centerTransform = getContainerCenter();
			centerTransform = {x: centerTransform.x, y: centerTransform.y };
			var matrix = containerEl.style.transform;
			var values = matrix.match(/-?[\d\.]+/g);
			var array = (values == null) ? [0,0,0] : values;

			return {x: centerTransform.x - array[0], y: centerTransform.y - array[1]};
		}

		function getScreenCenter() {
			currentX = parseFloat( containerEl.getAttribute( 'data-x' ) || 0);
			currentY = parseFloat( containerEl.getAttribute( 'data-y' ) || 0);
			return (transformToAbsolute({x: currentX, y: currentY }));
		}

		function addRandomImageToLayout() {

			// Try and find this image in the image manifest array
			for(var i = 0; i < imageManifest.length; i++) {
				var image = imageManifest[i];		

				if (!image.loaded) {	

					addImageToScene(image);

					break;
				}
			}

		}

		function updateLayout() {

			// Try and find this image in the image manifest array
			for(var i = 0; i < imageManifest.length; i++) {
				var image = imageManifest[i];				

				var el = document.getElementById(image.id);

				if (el === null) {
					addImageToScene(image);
				} else {
					updateItemInScene(el, image);
				}
			}	

			photos  = $('#container .photo');
			$('#container .photo').each(function() {

				var el = $(this)[0];

				var id = el.getAttribute('id') || '';
				var found = false;

				// Find elements that no longer exist in manifest
				for(var i = 0; i < imageManifest.length; i++) {

					var image = imageManifest[i];	

					if (image.id == id) {
						found = true;
						break;
					}
				}

				if (!found || id == '') {					
					el.parentNode.removeChild(el);
				}

			});

			// Update play state (as new images may change things)

			// setPlaying(appConfig.playing);

			// if (appConfig.playing) { 
			// 	setLocked(true);
			// } else {
			setLocked(appConfig.locked);

			updateIndicators();
			//}

		}				

	

		function updateItemInScene(target, properties) {

			

			// console.log(image.x + ' ' + image.y + ' ' + transform);

			// var center = getScreenCenter();
			// var transformCenter = transformToAbsolute( center.x, center.y );

			// transform.x += transformCenter.x
			// transform.y += transformCenter.y

			if (properties.x && properties.y) {
				var transform = viewportRelativeToTransform({x: properties.x, y: properties.y});
				target.setAttribute('data-x', transform.x);
				target.setAttribute('data-y', transform.y);
			}	

			for (var key in properties) {

				if (key == "rotation") {
					target.setAttribute('data-rotation', properties[key] );
				}	

				if (key == "index") {
					target.style.zIndex = properties[key];
				}
			}


			var newX = target.getAttribute('data-x') || 0;
			var newY = target.getAttribute('data-y') || 0;
			var newR = target.getAttribute('data-rotation') || 0;

			target.style.transform = 'translateX(' + newX + 'px) translateY(' + newY + 'px) rotateZ(' + newR + 'deg)';			

		}

		function centerImageToScreen(dimensions) {

			var center = getScreenCenter();
			
			center = transformToAbsolute(getContainerCenter());

			// Calculate true center using image's width/height
			return {x: (center.x) - (dimensions.width/2), y: (center.y) - (dimensions.height/2) };

		}

		function addImageToScene(image) {

			// Need some sort of unique id...
			var id = image.id;

			var photoEl = document.createElement( 'div' );

			var dimensions = fitImageToScreen(image);
			var center = centerImageToScreen(dimensions);

			var commentEl = document.createElement( 'span' );
			commentEl.classList.add('comment');
			commentEl.classList.add('tap-comment');
			commentEl.innerHTML = image.comment || '';
			photoEl.appendChild( commentEl );

			photoEl.id = id;
			photoEl.style.width = dimensions.width + 'px';
			photoEl.style.height = dimensions.height + 'px';

			var lockToggle = document.createElement('a');
			lockToggle.classList.add('lock');
			photoEl.appendChild( lockToggle );


			// var imgEl = document.createElement('img');
			var imgEl = new Image();
			imgEl.target = photoEl;
			imgEl.appended = false;		


			imgEl.onload = function() {
				var appendTarget = this.target;
				appendTarget.appendChild(this);
			}
			imgEl.onerror=function() {
				console.log('Error loading image...');

				// Attempt to refresh the image by reloading the browser (only do this once to avoid infinite loop)
				if (appConfig.forcedReload) { 
					appConfig.forcedReload = false; 
					saveAppConfig();
					return 
				};				
				appConfig.forcedReload = true;
				saveAppConfig();
				location.reload();
			}
			
			imgEl.src = (useOptimizedImages) ? image.min : image.sourceUrl;			

			photoEl.style.transform = 'rotateZ(' + image.rotation + 'deg)';	

			photoEl.style.margin = 0;
			photoEl.style.position = 'absolute';

			photoEl.style.top = center.y + 'px';
			photoEl.style.left = center.x + 'px';		 

			photoEl.classList.add( 'photo' );
			photoEl.classList.add( 'drag-rotate' );
			photoEl.classList.add( 'tap-index' );
			containerEl.appendChild( photoEl );

			photoEl.setAttribute('data-update', 'true');
			photoEl.setAttribute('data-width', dimensions.width);
			photoEl.setAttribute('data-height', dimensions.height);

			updateItemInScene(photoEl, image);



		}


		Math.clamp = function(number, min, max) {
		  return Math.max(min, Math.min(number, max));
		}


		$('#container').on('mousewheel', '.drag-rotate', function(event) {

			// if (appConfig.locked) { event.preventDefault(); return; };

			event.da = event.deltaY * 1.5;
			var $target = $(event.target).closest('.drag-rotate');
			event.target = $target[0];
			dragRotateListener(event);
		});

		$('body').hammer().on('pan swipe', function(e) {

			e.preventDefault();

		});
		

		$('#controls-menu div.hitbox').hammer().on('tap', function(e) {

			e.preventDefault();

			if (!appConfig.showUI) {
				showUI(true);
			};

		});


		$('ul.controls li a:not(.null)').hammer().on('tap', function(e) {

			var el = $(this);
			var action =  el[0].getAttribute( 'data-action' )

			switch (action) {

				case "play":
				{
					setPlaying(!appConfig.playing);
					break;
				}

				case "speed":
				{
					var oldSpeed = appConfig.speed;
					var newSpeed = parseFloat(prompt("Adjust play speed [0.1-100]", oldSpeed));
					if (isNaN(newSpeed)) { return };


					appConfig.speed = Math.clamp(newSpeed, 0.1, 100);
					saveAppConfig();

					// If the value changes while we are mid-animation, abort current animation and start fresh
					if (appConfig.playing && oldSpeed != newSpeed) {
						killSlideSequence();
						playSlideSequence();
					};

					break;
				}


				case "locktoggle":
				{	

					if (appConfig.playing) { break; };
					setLocked(!appConfig.locked);		
					break;

				}
				case "add":
				{
					e.preventDefault();

					// creating input on-the-fly
			        var input = $(document.createElement("input"));
			        input.attr("id", "file-input");
			        input.attr("type", "file");
			        input.attr("multiple", "multiple");

			      	var filename = '';
			        input.on('change', function (e) {

			        	var spawnLocation = transformToViewportRelative( getCurrentTransformFromContainerCenter() );

			        	var files = $(this)[0].files;
			        	for (var i = 0; i<files.length; i++) {

			        		var file = files[i];

			    
							reader = new FileReader();

							reader.filename = file.name;
							reader.spawnLocation = spawnLocation;

							//When the file has been read...
							reader.onload = function(evt){
						
								// Emit this binary file to the server for saving						
								socket.emit('addImage', {
									filename: this.filename
									, base64: evt.target.result
									, x: this.spawnLocation.x
									, y: this.spawnLocation.y

								});

								console.log('Sent [' + this.filename + '] to the server!');
							};

							//And now, read the image and base64
							reader.readAsDataURL(file);

			        	}

			        });


			        // add onchange handler if you wish to get the file :)
			        input.trigger("click"); // opening dialog


			        // Remove after creation
			        // if (input) { input.parentNode.removeChild(input); };


					break;
				}

				case "comment":
				{
					e.preventDefault();

					if (commentElementOnTap) {
						commentElementOnTap = false;
						setCommenting(false);
					} else {
						commentElementOnTap = true;
						setCommenting(true);
					}
					break;
				}


				case "remove":
				{
					e.preventDefault();

					if (deleteElementOnTap) {
						deleteElementOnTap = false;
						setRemoving(false);
					} else {
						deleteElementOnTap = true;
						setRemoving(true);
					}
					break;

				}
				case "close":
				{
					e.preventDefault();
					showUI(false);					
					break;
				}
				case "fullscreen":
				{
					
					if (!screenfull.isFullscreen) {
						screenfull.request();
						el.removeClass('active').addClass('active');
						if (!appConfig.playing) { updateIndicators(true); }

					} else {
						// Ignore or do something else
						screenfull.exit();
						el.removeClass('active');
						updateContainerConfigLocation(true);
						if (!appConfig.playing) { updateIndicators(true); }
					}

    				break;

				}
				case "home":
				{	

					if (appConfig.playing) {
						killSlideSequence();
						setPlaying(false);
					}

					container[0].style.transform= '';

					// console.log(getTransformOrigin().x);

					container.velocity({
						translateX: getTransformOrigin().x + 'px',
						translateY:  getTransformOrigin().y  + 'px'
					}, {
						complete: function() {
							updateContainerConfigLocation(true);
							slideCount = headerSlideFrequency;
						}
					}, 1000).attr({
						'data-x':  getTransformOrigin().x
						, 'data-y':  getTransformOrigin().y
					});

					

					break;
				}

			}

		});


	
		// Converts from degrees to radians.
		Math.radians = function(degrees) {
		  return degrees * Math.PI / 180;
		};
		 
		// Converts from radians to degrees.
		Math.degrees = function(radians) {
		  return radians * 180 / Math.PI;
		};

		Math.normalize = function(degrees) {

			degrees = degrees % 360;
			if (degrees < 0) {
				degrees += 260;
			}
			return degrees;
		}

		Math.findAngle = function (p1, p2) {
			return(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI);
		}

		Math.grid = function(point, gridX, gridY) {			
			
			var gridX = gridX || 1;
			var gridY = gridY || 1;

			return {x: (Math.round(point.x/gridX) * gridX), y: (Math.round(point.y/gridY) * gridY) };
		}

		function shuffle(array) {

		    var counter = array.length;

		    // While there are elements in the array
		    while (counter > 0) {
		        // Pick a random index
		        var index = Math.floor(Math.random() * counter);

		        // Decrease counter by 1
		        counter--;

		        // And swap the last element with it
		        var temp = array[counter];
		        array[counter] = array[index];
		        array[index] = temp;
		    }

		    return array;
		}

		
		function createImageSequence() {

			var defaultDelay = 6000;
			var imagesInSequence = 5;
			var anglePerSequence = 360/imagesInSequence;
			var remainingAngle = 360;


			var totalAngle = Math.random() * 360;
			var exitAngle = 0;
			var randomAngle =0;

			var imagesArray = [];

			var len = imageManifest.length - 1;

			// Generate a random sequence of images
			for (i=0; i< imagesInSequence; i++) 
			{
				imagesArray.push( getRandomImageNoRepeat() );
			}

			var imageSequence = [];

			currentX = parseFloat( containerEl.getAttribute( 'data-x' ) || 0);
			currentY = parseFloat( containerEl.getAttribute( 'data-y' ) || 0);

			current = transformToAbsolute({x: currentX, y: currentY});
			center = transformToAbsolute({x: currentX, y: currentY});
			initialAngle = Math.random() * 360;

			for (i=0; i<imagesArray.length; i++) {

				image = imagesArray[i];

				randomAngle = (Math.random() * anglePerSequence);
				totalAngle += randomAngle;
				totalAngle = Math.normalize(totalAngle);
				exitAngle = totalAngle;

				// console.log('r: ' + randomAngle + ' t: ' + totalAngle + ' ex: ' +exitAngle);

				// exitAngle = (i == imagesArray.length ? remainingAngle : (remainingAngle + (Math.random() * anglePerSequence)) );

				// if (i== imagesArray.length-1) { console.log('end!'); };

				// exitAngle = anglePerSequence;
				// currentAngle += anglePerSequence;
				// remainingAngle = remainingAngle - anglePerSequence;


				// Calculate image dimensions read meta delay
				var dimensions = fitImageToScreen(image);
				max = Math.max(dimensions.width, dimensions.height);
				delay = image.delay || defaultDelay;

				// exitAngle = Math.random() * 360;

				// Use screenwidth and width of this image to get a decent distance from our origin point
				exitDistance = (screenWidth / 2) + (max/2) + 100 + (Math.random() * 500);		

				var angleToCentre = Math.atan2(current.y - center.y, current.x - center.x) * 180 / Math.PI;		

				exitAngle = Math.normalize( (angleToCentre + anglePerSequence) );

				if (i == 0) { exitAngle = Math.random() * 360; };

				exitAngle = (Math.round ( Math.random() * 360) / 10) * 10;

				// console.log(exitAngle);

				// Calculate relative x+y increment to add to existing position
				delta = Math.grid(
					{ 
						x: Math.cos( Math.radians(exitAngle) ) * exitDistance, 
						y: Math.sin( Math.radians(exitAngle) ) * exitDistance 
					},  
					Math.round(screenHeight/2), 
					Math.round(screenWidth/2) 
				);

				console.log(delta);

				// New position uses current position + calculated delta
				newPosition = {x: (current.x + delta.x), y: (current.y + delta.y) };

				// Update current so next image in sequence uses this as a starting point
				current = newPosition;

				// Convert this absolute position back to transform space for use with animtating
				newTransform = transformToAbsolute({x: newPosition.x, y: newPosition.y });

				// Calculate true center using image's width/height
				newCenter = {x: (newPosition.x) - (dimensions.width/2), y: (newPosition.y) - (dimensions.height/2) };



				// Need some sort of unique id...
				var id = 'photo-' + random( 0, 1000, true ) + '-' + Date.now();

				var photoEl = document.createElement( 'div' );

				photoEl.id = id;
				photoEl.style.width = dimensions.width + 'px';
				photoEl.style.height = dimensions.height + 'px';

				var imgEl = document.createElement('img');

				imgEl.src = encodeURIComponent(image.sourceUrl);

				photoEl.appendChild( imgEl );


				// photoEl.style.backgroundImage = 'url("' + image.url + '")';

				var randRotation = + ((Math.random() * 6) -3);
				photoEl.style.transform = 'rotateZ(' + randRotation + 'deg)';
				photoEl.setAttribute('data-rot', + randRotation  );

				// If we're colliding find 
				var collision = collisionCheck(newCenter.x, newCenter.y, dimensions.width, dimensions.height, 0, true);
				if (collision.result) {
					var elToRemove = collision.element;
					elToRemove.parentNode.removeChild(elToRemove);
				}

				photoEl.style.margin = 0;
				photoEl.style.position = 'absolute';
				photoEl.style.top = newCenter.y + 'px';
				photoEl.style.left = newCenter.x + 'px';
				photoEl.classList.add( 'photo' );
				containerEl.appendChild( photoEl );


				transitionDuration = (env === "DEV") ? 1000 : 10000;
				delayDuration = (env === "DEV") ? delay/10 : delay;


				imageSequence.push( 
					{ 
						e: $('#container'), 
						p: { 
							translateX: newTransform.x + 'px'
							, translateY: newTransform.y + 'px'
						}, 
						o: {
							duration: transitionDuration
							,   complete:function() {
								$('#container').attr({
									'data-x': newTransform.x
									, 'data-y': newTransform.y
								});
							}
						} 
					}
				);

	
				imageSequence.push( 
					{ 
						e: $(photoEl).find('img'), 
						p: { 			
							scale: 1.05
						}, 
						o: {
							duration: delayDuration
						} 
					}
				);

				// console.log(imageSequence);

			}

			// Always return to center
			imageSequence.push( 
				{ 
					e: $('#container'), 
					p: { 
						translateX: getTransformOrigin().x + 'px'
						, translateY: getTransformOrigin().y + 'px'
					}, 
					o: {
						duration: 1000
						,   complete:function() {
							$('#container').attr({
								'data-x': getTransformOrigin().x
								, 'data-y': getTransformOrigin().y
							});
						}
					} 
				}
			);

			

			// Run this sequence
			$.Velocity.RunSequence(imageSequence);

			

		}
	
		function getTransformOrigin() {

			return {
				x: ($('#container').width() / -2)
				, y: ($('#container').height() / -2)
			};
		}


		function fitImageToScreen(image) {
			
			var isPortrait = (image.height > image.width) ? true : false;
			var fillWidth = (isPortrait) ? fillSettings.portrait.width : fillSettings.landscape.width;
			var fillHeight = (isPortrait) ? fillSettings.portrait.height : fillSettings.landscape.height;

			var aspect = image.height / image.width;			

			var adjustedWidth = Math.min( screenWidth * (fillWidth/100), image.width); 
			var adjustedHeight =  adjustedWidth * aspect;

			var screenHeightCap = (screenHeight * (fillHeight/100));

			if (image.height > screenHeightCap )  {
				aspect = image.width / image.height;
				adjustedHeight = screenHeightCap;
				adjustedWidth = adjustedHeight * aspect;			
			}	

			return {width: adjustedWidth, height: adjustedHeight};	

		}

		function moveToLocation(x,y) {
			// e

			if ($('#container').hasClass('velocity-animating')) { return };

			$('#container').velocity({
				translateX: x + 'px',
				translateY: y + 'px'
			},1000).attr({
				'data-x': x
				, 'data-y': y
			});

		}

		function transformToAbsolute(transform) {

			return ({ x: (transform.x * -1), y: (transform.y * -1) });
		}


});

