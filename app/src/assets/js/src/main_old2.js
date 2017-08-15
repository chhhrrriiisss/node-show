var socket = io.connect();



/*

	Persistent config

*/

// Get current user
var appConfig = store.get('app-config');
var currentVersion = 0.12;

// Doesn't exist? set defaults
var exists = (appConfig) ? true : false;

var oldVersion = false;
if (exists) {
	oldVersion = (appConfig.version < currentVersion) ? true : false;
	;
}

var defaultConfig = { 
	version: currentVersion,
	locked: true,
	posX: 0,
	posY: 0
};

var reset = (!exists || oldVersion) ? true : false;

if (reset) {
	console.log('Reset local storage config!')
	store.set('app-config', defaultConfig);
	appConfig = store.get('app-config');
} 


$(function(){

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
		var imageLayout = [];

		var containerEl = $('#container')[0];


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

					updateImageInScene(el, image);

					var dimensions = fitImageToScreen(image);
					var center = centerImageToScreen(dimensions);

					el.style.width = dimensions.width + 'px';
					el.style.height = dimensions.height + 'px';

					var center = centerImageToScreen(dimensions);
					
					el.style.top = center.y + 'px';
					el.style.left = center.x + 'px';		 


					
				}

			}

			
		};

		$(window).resize(updateWindowSize);
		updateWindowSize();


		var isLocked = appConfig.locked;
		function toggleDraggable(state) {

			interact('.drag-rotate')
  			.draggable(state);

	  		var $lockElement = $('#lock-icon');
	  		if (state) {
	  			$lockElement.addClass('active');  			
	  		} else {
	  			$lockElement.removeClass('active');
	  		}	

		}
		toggleDraggable(isLocked);
		

		




		socket.on('connect', function () {
			console.log('Connected to ws server.');

			socket.emit('request manifest');

		});

		var updated = false;
		socket.on('manifest', function(data) {
			console.log('Got manifest update!');
		
			imageManifest = data;
			updateLayout();

		});

		socket.on('update item', function(data) {

			var el = document.getElementById(data.id);

			if (el === null) {		
				addImageToScene(data);
			} else {
				updateImageInScene(el, data);
			}
		});


		socket.on('disconnect', function () {
			console.log('Disconnected from ws server.');
		});

		socket.on('reconnect', function () {
			console.log('Reconnected with ws server.');
		});

		socket.on('reconnect_error', function () {
			console.log('Attempting to reconnect with ws server.');
		});	

		socket.on('message', function (data) {
			console.log(data);
		});


		
		function getScreenCenter() {
			currentX = parseFloat( containerEl.getAttribute( 'data-x' ) || 0);
			currentY = parseFloat( containerEl.getAttribute( 'data-y' ) || 0);
			return (transformToAbsolute(currentX, currentY));
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
					updateImageInScene(el, image);
				}
			}

		}				

	

		function updateImageInScene(target, image) {



			var transform = viewportRelativeToTransform({x: image.x, y: image.y});

			console.log(image.x + ' ' + image.y + ' ' + transform);

			// var center = getScreenCenter();
			// var transformCenter = transformToAbsolute( center.x, center.y );

			// transform.x += transformCenter.x
			// transform.y += transformCenter.y


			target.setAttribute('data-rotation', image.rotation  );
			target.setAttribute('data-x', transform.x);
			target.setAttribute('data-y', transform.y);
			target.style.transform = 'translateX(' + transform.x + 'px) translateY(' + transform.y + 'px) rotateZ(' + image.rotation + 'deg)';			

		}

		function centerImageToScreen(dimensions) {

			var center = getScreenCenter();

			// Calculate true center using image's width/height
			return {x: (center.x) - (dimensions.width/2), y: (center.y) - (dimensions.height/2) };

		}

		function addImageToScene(image) {

			// Need some sort of unique id...
			var id = image.id;

			var photoEl = document.createElement( 'div' );

			var dimensions = fitImageToScreen(image);
			var center = centerImageToScreen(dimensions);

			photoEl.id = id;
			photoEl.style.width = dimensions.width + 'px';
			photoEl.style.height = dimensions.height + 'px';

			var imgEl = document.createElement('img');

			imgEl.src = (useOptimizedImages) ? image.min : image.sourceUrl;

			photoEl.appendChild( imgEl );

			photoEl.style.transform = 'rotateZ(' + image.rotation + 'deg)';	

			photoEl.style.margin = 0;
			photoEl.style.position = 'absolute';

			photoEl.style.top = center.y + 'px';
			photoEl.style.left = center.x + 'px';		 

			photoEl.classList.add( 'photo' );
			photoEl.classList.add( 'drag-rotate' );
			containerEl.appendChild( photoEl );

			photoEl.setAttribute('data-update', 'true');

			updateImageInScene(photoEl, image);



		}


		function isRetinaDisplay() {
			if (window.matchMedia) {
			    var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
			    return (mq && mq.matches || (window.devicePixelRatio > 1)); 
			}
		}

		

		

		var isRetina = isRetinaDisplay();

		// e
		$('#container').velocity({
			translateX: ($('#container').width() / -2) + 'px',
			translateY: ($('#container').height() / -2) + 'px'
		},100).attr({
			'data-x': ($('#container').width() / -2)
			, 'data-y': ($('#container').height() / -2)
		});

		// $('#container .photo-static').each(function() {

		// 	var image = $(this).find('img');


		var grabOffsetX = 0;
		var grabOffsetY = 0;
		var dragging = false;

		// target elements with the "draggable" class
		interact('.drag-rotate')
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
			autoScroll: true,
			onstart: function(event) {
				dragging = true;
			},
			// call this function on every dragmove event
			onmove: dragMoveListener,
			// call this function on every dragend event
			onend: onDragEnd
		})		
		.gesturable({
			onstart: function(event) {
				dragging = true;
			},
			onmove: dragRotateListener,
			onend: function(event) {
				dragging = false;
			}
		});

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


			socket.emit('update', {

				id: id,
				x: viewport.x,
				y: viewport.y,
				rotation: newRotation

			});

			// for (var i = 0; i<imageManifest.length; i++) {

			// 	if (title == imageManifest[i].title) {



			// 	}
			// }

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

		function onDragEnd(event) {

			// e
			var target = event.target,

			dragging = false;

			if (!target.getAttribute('data-master')) {
				return;
			}		

			setContainerTransformVelocityFix(target);	

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
	
		function dragMoveListener (event) {
			var target = event.target,
			// keep the dragged position in the data-x/data-y attributes
			x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
			y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
			rotation = (parseFloat(target.getAttribute('data-rotation')) || 0);

			// translate the element
			target.style.webkitTransform =
			target.style.transform =
			'translateX(' + x + 'px) translateY( ' + y + 'px) rotate(' + rotation + 'deg)';

			// update the posiion attributes
			target.setAttribute('data-x', x);
			target.setAttribute('data-y', y);

			sendImageLocation(event.target);

			// $('body').css{(
			// 	backgroundPosition: x + 'px ' + y + ' px'
			// )};
		}

		$('#container').on('mousewheel', '.drag-rotate', function(event) {
			event.da = event.deltaY * 1.5;
			var $target = $(event.target).closest('.drag-rotate');
			event.target = $target[0];
			dragRotateListener(event);
		});




		// })

		// $('body').hammer().on('doubletap', function(e) {
		// 	e.preventDefault();
		// });


		var $controlsMenu = $('#controls-menu');

		$('#controls-menu div.hitbox').hammer().on('tap', function(e) {

			e.preventDefault();

			if ($controlsMenu.hasClass('hide')) {
				$controlsMenu.removeClass('hide');
			}
		});

		$('ul.controls li a:not(.null)').hammer().on('tap', function(e) {

			var el = $(this);
			var action =  el[0].getAttribute( 'data-action' )

			switch (action) {

				case "locktoggle":
				{	
					isLocked = !isLocked;	
					toggleDraggable(isLocked);		
					break;

				}
				case "add":
				{
					e.preventDefault();
					addRandomImageToLayout();
					break;
				}
				case "close":
				{
					e.preventDefault();
					$controlsMenu.removeClass('hide').addClass('hide');
					break;
				}
				case "fullscreen":
				{
					
					if (!screenfull.isFullscreen) {
						screenfull.request();
						el.removeClass('active').addClass('active');
					} else {
						// Ignore or do something else
						screenfull.exit();
						el.removeClass('active');
					}

    				break;

				}
				case "home":
				{	

					// $('#container').removeClass('drag-rotate');

					$('#container')[0].style.transform= '';

					console.log(getTransformOrigin().x);

					$('#container').velocity({
						translateX: getTransformOrigin().x + 'px',
						translateY:  getTransformOrigin().y  + 'px'
					},1000).attr({
						'data-x':  getTransformOrigin().x
						, 'data-y':  getTransformOrigin().y
					});


					// e.preventDefault();

					// $('#container').removeClass('drag-rotate');
					// $('#container')[0].style.transform  = '';

					// $('#container').velocity({
					// 	translateX: getTransformOrigin().x + 'px'
					// 	, translateY:  getTransformOrigin().y + 'px'
					// }, 1000);


					// {

					// 	duration: 1000,

					// 	begin: function() {
					// 		$('#container').removeClass('drag-rotate');
					// 	},
					// 	complete:function() {
					
					// 		$('#container').attr({
					// 			'data-x': getTransformOrigin().x
					// 			, 'data-y': getTransformOrigin().y
					// 		});

					// 		$('#container').addClass('drag-rotate');

					// 	}
					// }, 1000);

					break;
				}

			}

		});

		$('body').hammer().on('tap', function(e) {
			
			if (true) { return };

			createImageSequence();

		});



		var imageManifestShuffled = [];

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

		function getRandomImageNoRepeat() {
			if (imageManifestShuffled.length == 0) {
				imageManifestShuffled = shuffle(imageManifest);
			}
			return (imageManifestShuffled.shift());
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

			current = transformToAbsolute(currentX, currentY);
			center = transformToAbsolute(currentX, currentY);
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

				console.log(exitAngle);

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
				newTransform = transformToAbsolute(newPosition.x, newPosition.y);

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

			// defaultOrigin = $('#container').css('transform-rigin')

			

			// console.log(imageSequence);
			// Run this sequenc e
			$.Velocity.RunSequence(imageSequence);

			

		}

		function checkIntersect(r1, r2) {
			return !(r2.left > r1.right || 
					r2.right < r1.left	|| 
					r2.top > r1.bottom ||
					r2.bottom < r1.top);
		}

		function collisionCheck(x,y, width, height, buffer, elReturn) {

			var buffer = buffer || 0;
			var collisionElement = null;

			// console.log('running collision check!');
			var collision = false;

			var sourceBounds = {
				top: y-(height/2) 
				, bottom: y+ (height/2)
				, left: x - (width/2)
				, right: x +(width/2)
			};

			$('#container .photo').each(function() {

				var el = $(this)[0];

				var dimensions = {width: el.offsetWidth, height: el.offsetHeight};

				var targetBounds = {
					top: el.offsetTop - (dimensions.height/2) - buffer
					, bottom: el.offsetTop+ (dimensions.height/2) + buffer
					, left: el.offsetLeft - (dimensions.width/2) - buffer
					, right: el.offsetLeft +(dimensions.width/2) + buffer
				};

				if (checkIntersect(sourceBounds, targetBounds)) {
					collision = true;
					collisionElement = el;
				}
				

			});

			if (elReturn) {
				return ({result: collision, element: collisionElement})
			}

			return collision;

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




		// $('#container').on('mousemove', function(e) {

		// 	var parentOffset = $(this).parent().offset(); 
		//    //or $(this).offset(); if you really just want the current element's offset
		//    var relX = e.pageX - parentOffset.left;
		//    var relY = e.pageY - parentOffset.top;

		
		// 	// console.log(transformToCoordinate());

		// });

		function transformToAbsolute(x, y) {

			return ({ x: (x * -1), y: (y * -1) });
		}

		// function coordinateToTransform()

		// function transformToAbsolute(x,y) {

		// 	x += 5000;
		// 	y += 5000;

		// 	return {x: x, y: y};

		// }

		// function transformToAbsolute(x, y) {
		// 	return {x: x*-1, y: y*-1 };	
		// }

		function moveToTarget(target) {

			var targetEl = target[0];

			var currentX = parseFloat( containerEl.getAttribute( 'data-x' ) || 0);
			var currentY = parseFloat( containerEl.getAttribute( 'data-y' ) || 0);

			var targetX = parseFloat( target.getAttribute( 'data-x') || 0);
			var targetY =  parseFloat( target.getAttribute( 'data-y') || 0);

			var dist = Math.sqrt( currentX * targetX + currentY*targetY );

			var duration = 300 * (dist / 1000);

			$('#container').velocity({
				translateX: (-targetX) + (target.offsetWidth/-2) + 'px'
				, translateY: (-targetY) + (target.offsetHeight/-2) + 'px'				
			}, duration);

			$('.active').removeClass('active');
			target.classList.add('active');

			containerEl.setAttribute( 'data-x', (targetX) + (target.offsetWidth/-2) );
			containerEl.setAttribute( 'data-y', (targetY) + (target.offsetHeight/-2) );

		}

		function addRandomCircle () {	
			packer.addCircle( createCircle() );
			packer.update();
		}


	

		// create circle dom object, return circle data
		function createCircle (selectedImage) {
		
			var len = imageManifest.length - 1;
			var rand = Math.round (Math.random() * len);
			var image = selectedImage || imageManifest[rand];

			var dimensions = fitImageToScreen(image);
			var margin = 50; 

			radius = (Math.max(dimensions.width, dimensions.height)) /2;

			x = random( radius, bounds.width - radius );
			y = random( radius, bounds.height - radius );	
			var diameter = radius * 2;
			var circleEl = document.createElement( 'div' );
			
			// need some sort of unique id...
			var id = 'circle-' + random( 0, 1000, true ) + '-' + Date.now();

			var circle =  {
				id: id,
				radius: radius,
				position: {
					x: random( radius, bounds.width - radius ),
					y: random( radius, bounds.height - radius )
				}
			};

			// create circle el
			
			circleEl.id = id;
			circleEl.style.width = dimensions.width + 'px';
			circleEl.style.height = dimensions.height + 'px';
			circleEl.style.maxWidth = fillWidth + 'vw';
			circleEl.style.maxHeight = fillHeight + 'vh';
			circleEl.style.backgroundImage = 'url("' + image.sourceUrl + '")';
			circleEl.style.transform = 'rotateZ(' + ((Math.random()*20) -10) + 'deg)';
			// circleEl.style.borderRadius = diameter + 'px';
			circleEl.classList.add( 'circle' );

			// store position for dragging
			circleEl.setAttribute( 'data-x', x );
			circleEl.setAttribute( 'data-y', y );
			circleEl.setAttribute( 'data-radius', radius );

			// start dragging
			circleEl.addEventListener( 'mousedown', function ( event ) {
				circlePressed( circleEl, circle, event );
			} );
			
			containerEl.appendChild( circleEl );

			circleEls[id] = circleEl;

			return circle;
		}

		function removeRandomCircle () {
			var ids = Object.keys( circleEls );
			var idToDelete = ids[random( 0, ids.length, true )];

			removeCircle( idToDelete );
		}

		function setRandomBounds () {
			bounds = {
				width: random( 200, 500, true ),
				height: random( 200, 500, true )
			};

			containerEl.style.width = bounds.width + 'px';
			containerEl.style.height = bounds.height + 'px';

			packer.setBounds( bounds );
		}

		function removeCircle ( id ) {
			packer.removeCircle( id );
			
			requestAnimationFrame( function () {
				containerEl.removeChild( circleEls[id] );
				delete circleEls[id];
			} );
		}

		function render ( circles ) {
			requestAnimationFrame( function () {
				for ( var id in circles ) {
					var circleEl = circleEls[id];

					if ( circleEl ) {
						var circle = circles[id];
						var x = circle.position.x - circle.radius;
						var y = circle.position.y - circle.radius;

						// store position for dragging
						circleEl.setAttribute( 'data-x', x );
						circleEl.setAttribute( 'data-y', y );

						// actually move the circles around
						circleEl.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px)';
						circleEl.classList.add( 'is-visible' );
					}
				}
			} );
		}

		// start and stop dragging
		function circlePressed ( circleEl, circle, event ) {
			var circleStartPos = {
				x: parseFloat( circleEl.getAttribute( 'data-x' ) ) + circle.radius,
				y: parseFloat( circleEl.getAttribute( 'data-y' ) ) + circle.radius
			};

			var eventStartPos = { x: event.clientX, y: event.clientY };
			
			function dragStart () {
				document.addEventListener( 'mousemove', dragged );
				document.addEventListener( 'mouseup', dragEnd );
			}

			function dragged ( event ) {
				var currentPos = { x: event.clientX, y: event.clientY };

				var delta = {
					x: currentPos.x - eventStartPos.x,
					y: currentPos.y - eventStartPos.y
				};

				// start dragging if mouse moved DRAG_THRESOLD px
				if ( ! isDragging &&
					( Math.abs( delta.x ) > DRAG_THRESOLD || Math.abs( delta.y ) > DRAG_THRESOLD )
				) {
					isDragging = true;
					packer.dragStart( circle.id );
				}

				var newPos = { x: circleStartPos.x + delta.x, y: circleStartPos.y + delta.y };

				if ( isDragging ) {
					// end dragging if circle is outside the bounds
					if (
						newPos.x < circle.radius || newPos.x > bounds.width - circle.radius ||
						newPos.y < circle.radius || newPos.y > bounds.height - circle.radius
					) {
						dragEnd();
					} else {
						packer.drag( circle.id, newPos );
					}
				}
			}

			function dragEnd () {
				isDragging = false;
				document.removeEventListener( 'mousemove', dragged );
				packer.dragEnd( circle.id );
			}

			if ( ! isDragging ) {
				dragStart();
			}
		}

		function random ( min, max, intResult ) {
			if ( typeof min !== 'number' && typeof max !== 'number' ) {
				min = 0;
				max = 1;
			}

			if ( typeof max !== 'number' ) {
				max = min;
				min = 0;
			}

			var result = min + Math.random() * ( max - min );

			if ( intResult ) {
				result = parseInt( result, 10 );
			}

			return result;
		}




































		function goToDestination() {

			var dest = getRandomDestination(screenWidth, 300);

			var len = imageManifest.length - 1;
				var rand = Math.round (Math.random() * len);
				var randomImage = imageManifest[rand];

			var loc = spawnContainerAtLocation(dest.x, dest.y, randomImage);

			$('#slideshow-container').velocity({
				translateX: loc.x
				, translateY: loc.y
			}, 1000);

			$('#slideshow-container').attr('data-x', loc.x).attr('data-y', loc.y);

		}

		function getDeltaPoint(angle, distance) {
		    var result = {};

		    result.x = Math.round(Math.cos(angle * Math.PI / 180) * distance);
		    result.y = Math.round(Math.sin(angle * Math.PI / 180) * distance);

		    return result;
		}

		function getRandomDestination(minDist, collisionRadius) {

			var randAngle = Math.random() * 360;
			var randDistance = (Math.random() * 1000) + minDist;

			var newPoint = getDeltaPoint(randAngle, randDistance);

			var curX = parseFloat($('#slideshow-container').attr('data-x')) || 0;
			var curY = parseFloat($('#slideshow-container').attr('data-y')) || 0;

			return { x: curX + newPoint.x, y: curY + newPoint.y };			
		}

		function spawnContainerAtLocation(x, y, selectedImage) {	

			var $imageContainer = $('<div class="photo"></div>');			

			// Set container dimensions to match it's contained image
			var dimensions = fitImageToScreen(selectedImage);

			var max = Math.max((dimensions[0]/2), (dimensions[1]/2));		

			var id = selectedImage.title + '-' + (Math.random() * 1000) + '-' + Date.now();

			$imageContainer.attr("id",id);	

			var fillGap = (screenHeight * ((100 - fillHeight)/100));

			$imageContainer.css({
				"background-image": 'url(' + selectedImage.sourceUrl + ')'
				, width: dimensions.width + 'px'
				, height: dimensions.height + 'px'
				, left: ((x) + (dimensions.width / -2)) + 'px'
				, top:  ((y)  + (dimensions.height / -2)) + 'px'
				// , transform: 'rotateZ(' + ((Math.random() * 6) - 3) + 'deg)'
			});

			$imageContainer.appendTo('#slideshow-container');

			var $this = $imageContainer;
			var offset = $this.offset();
			var width = $this.width();
			var height = $this.height();

			var centerX = offset.left + width / 2;
			var centerY = offset.top + height / 2;

			return {x: centerX, y: centerY };
		}

		// function fitImageToScreen(image) {
	
		// 	var aspect = image.height / image.width;	

		// 	var adjustedWidth = Math.min( screenWidth * (fillWidth/100), image.width); 
		// 	var adjustedHeight =  adjustedWidth * aspect;

		// 	if (image.height > image.width) {
		// 		aspect = image.width / image.height;
		// 		adjustedHeight = Math.min( screenHeight * (fillHeight/100), image.height);
		// 		adjustedWidth = adjustedHeight * aspect;
		// 	}	

		// 	return {width: adjustedWidth, height: adjustedHeight};

		// }

	
		function spawnContainer(image, x, y) {		

			for (var key in data) {
				if (data.hasOwnProperty(key)) {	

					var image = data[key];					

					var $imageContainer = $('<div></div>');

					// Set container dimensions to match it's contained image
					var dimensions = updateContainerDimensions(image, $imageContainer);

					var max = Math.max((dimensions[0]/2), (dimensions[1]/2));		

					var id = (Math.random() * 1000) + '-' + Date.now();

					$imageContainer.attr("id",id);	

					$imageContainer.css({
						"max-width": 100
						, "max-height": 100
					});

					$imageContainer.appendTo('#slideshow-container');

					packer.addCircle({ id: id, radius: 50, position: { x: Math.random() * 100, y: Math.random() * 100 } } );
					packer.update();

					// var randY = (Math.random () * 10000) -5000;
					// var randX = (Math.random() * 10000) -5000;

					
					
					

					// console.log(data[key].id);
				}
			}


		}

	




});

