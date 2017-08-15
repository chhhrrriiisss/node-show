// JavaScript Document

// var imageManifest = [];

// $(function() {

// 		// Retrieve images manifest from server
// 		$.ajax({
// 		    url : 'photos/manifest.json',
// 		    success: function(data) {

// 		    	console.log(data);

// 				imageManifest = data;

// 				// spawnContainers(imageManifest);
// 				// buildPhotoContainers(imageManifest);
// 				// initializeSlideshow(imageManifest);

// 		    }

// 		});

// });


$(function(){
    // var zoom = new ZoomView('#zoom','#zoom :first');
	// var zoom2 = new ZoomView('#zoom2','#zoom2 :first');
	// var zoom3 = new ZoomView('#zoom3','#zoom3 :first');
	//	
		
		function isRetinaDisplay() {
			if (window.matchMedia) {
			    var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
			    return (mq && mq.matches || (window.devicePixelRatio > 1)); 
			}
		}

		var screenWidth = 1920;
		var screenHeight = 1080;
		var fillWidth = 80;
		var fillHeight = 80;

		function updateWindowSize() {

			screenWidth = $(window).width();
			screenHeight = $(window).height();
		};

		$(window).resize(updateWindowSize);
		updateWindowSize();

		var isRetina = isRetinaDisplay();

		$imageHolders = $('#gallery-container div.holder');

		$('body').hammer().on('tap', function() {
			goToDestination();
		});

		// $('#slideshow-container').velocity({
		// 	translateX: screenWidth / 2
		// 	, translateY: screenHeight / 2
		// }, 1000);

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
			var dimensions = fitImageToScreen(selectedImage, $imageContainer);

			var max = Math.max((dimensions[0]/2), (dimensions[1]/2));		

			var id = selectedImage.title + '-' + (Math.random() * 1000) + '-' + Date.now();

			$imageContainer.attr("id",id);	

			var fillGap = (screenHeight * ((100 - fillHeight)/100));

			$imageContainer.css({
				"background-image": 'url(' + selectedImage.url + ')'
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

		function fitImageToScreen(image) {
	
			var aspect = image.height / image.width;	

			var adjustedWidth = Math.min( screenWidth * (fillWidth/100), image.width); 
			var adjustedHeight =  adjustedWidth * aspect;

			if (image.height > image.width) {
				aspect = image.width / image.height;
				adjustedHeight = Math.min( screenHeight * (fillHeight/100), image.height);
				adjustedWidth = adjustedHeight * aspect;
			}	

			return {width: adjustedWidth, height: adjustedHeight};

		}

	
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

	// $('#slideshow-container').hammer().on('panup', function(e) {

		// 	$('#slideshow-container').removeClass('active');
		// 	$("#gallery-container").addClass('active');
			
		// });

		// $('#gallery-container').hammer().on('pandown', function(e) {

		// 	$('#slideshow-container').addClass('active');
		// 	$("#gallery-container").removeClass('active');
			
		// });



		// $('#slideshow-container').on('click', function() {
		// 	var len = imageManifest.length - 1;
		// 	var rand = Math.round (Math.random() * len);
		// 	var randomPhoto = imageManifest[rand];
		// 	showImage(randomPhoto);
		// });

		// $('#slideshow-container').hammer().on('tap', function(e) {
		// 	var len = imageManifest.length - 1;
		// 	var rand = Math.round (Math.random() * len);
		// 	var randomPhoto = imageManifest[rand];
		// 	spawnAnimatedImage(randomPhoto);
		// });

		var imageHistory = [];
		var $slideOne = $('#slide-1');
		var $slideTwo = $('#slide-2');
		var $slideThree = $('#slide-3');
		var $slideOverlay = $('#slide-overlay');
		var $nextSlide = $slideTwo;
		var $currentSlide = $slideOne;


		var sequenceAnimating = false;
		var randScale = 0.9;
		var isFirstSlide = true;
	

		// $('#slideshow-container img.title').velocity({
		// 	rotateZ: 5 + 'deg'
		// }, 'easeInOutSine', 4000);

		// $('#slideshow-container').velocity({
		// 	translateX: screenWidth/2 + 'px'
		// 	, translateY: screenHeight/2 + 'px'
		// 	, rotateZ: 0
		// }, 'easeInOutSine', 4000);

		function updateActiveContainers() {

			$('.slide').each(function() {
				var imageData = $(this).data('data-image');

				if (imageData) {
					console.log('Updated ' + imageData.title);
					updateContainerDimensions(imageData, $(this));
				} else {
					console.log('Attempted to update container size but no image data present. [' + $(this) + ']');
				}
			});
		}

		



		// function spawnAnimatedImage(image) {

		// 	if (isFirstSlide) {
		// 		image = imageManifest[0];
		// 	}

		// 	var $imageContainer = $('<div class="slide"></div>');

		// 	// Set target slide to requested image
		// 	$imageContainer.css({
		// 		"background-image": "url('" + image.url + "')"
		// 		, transform: 'translateX(100%)'
		// 	});

		// 	// Store image JSON 
		// 	$imageContainer.data('data-image', image);

		// 	// Resize container to fit screen
		// 	var dimensions = updateContainerDimensions(image, $imageContainer);

		// 	var fillGap = ((100-fillWidth)/200);
		// 	var startPoint = (image.width  * -1) + 'px';
		// 	var midPoint = ((screenWidth/2) - (dimensions[0]/2) - (screenWidth*fillGap))  + 'px';
		// 	var endPoint = screenWidth + 'px';

		// 	if (isFirstSlide) {
		// 		startPoint = midPoint;
		// 	}

		// 	$imageContainer.velocity({
		// 		translateX: startPoint
		// 		, scale: 1.3
		// 		, rotateZ: 0
		// 	}, 'ease', 0)
			

		// 	$imageContainer.appendTo('#slideshow-container');

		// 	var randAngle = (Math.random() * 30) - 15;
		// 	var randScale = 0.85;

		// 	var duration = 20000;

		// 	if (isFirstSlide) {
		// 		duration = 30000;
		// 		randAngle = 6;
		// 	}

		// 	$imageContainer.velocity({
		// 		translateX: endPoint
		// 		, rotateZ: randAngle
		// 		, scale: randScale
		// 	},  {
		// 		duration: duration,
		// 		easing: [ 0.410, 0.995, 0.680, 0.005],
		// 		complete: function() {

		// 			// Remove image from active array

		// 		}
		// 	});








		// 	if (isFirstSlide) {
		// 		isFirstSlide = false;
		// 	}

			


		// 	// var animSequence = [

		// 	// 	/* Setup One */
		// 	// 	{ e: $imageTemplate, p: { rotateZ: randAngle/2, scale: 1.1, translateX: '0%' }, o: { ease: 'easeInCirc', duration: 6000 } },
		// 	// 	{ e: $imageTemplate, p: { rotateZ: randAngle, translateX: '-100%' }, o: { ease: 'easeOutCirc', duration: 6000 } }

		// 	// ];

		// 	// $.Velocity.RunSequence(animSequence);	



		// }

		// function runAnimationSequence() {

		// 	var animSequence = [

		// 		/* Setup One */
		// 		{ e: $nextSlide, p: { opacity: 0, scale: 1, rotateZ: 0 }, o: { duration: 0 } },

		// 		/* Finish current + fade new */				
		// 		{ e: $currentSlide, p: { opacity: 0 }, o: { duration: 1500 } },	
		// 		{ e: $nextSlide, p: { opacity: 1 }, o: { duration: 1500, sequenceQueue: false } },
		// 		{ e: $nextSlide, p: { scale: 1.1, rotateZ: randAngle }, o: { duration: 8000, sequenceQueue: false } }					

		// 	];

		// 	$.Velocity.RunSequence(fadeSequence);	

		// }





		// function showImage(image) {			

		// 	if (sequenceAnimating) { return };
		// 	sequenceAnimating = true;

		// 	if ($currentSlide.is($slideOne)) {
		// 		$nextSlide = $slideTwo;
		// 	} else {
		// 		$nextSlide = $slideOne;
		// 	}
			
		// 	// Adjust height+scale to screen dimensions

		// 	// Set target slide to requested image
		// 	$nextSlide.css({
		// 		"background-image": "url('" + image.url + "')"
		// 		, width: image.width
		// 		, height: image.height
		// 	});


		// 	var randDuration = (Math.random() * 4000) + 4000;
		// 	var randAngle = (Math.random() * 30) - 15;



		// 	var fadeSequence = [

		// 		/* Setup One */
		// 		{ e: $nextSlide, p: { opacity: 0, scale: 1, rotateZ: 0 }, o: { duration: 0 } },

		// 		/* Finish current + fade new */				
		// 		{ e: $currentSlide, p: { opacity: 0 }, o: { duration: 1500 } },	
		// 		{ e: $nextSlide, p: { opacity: 1 }, o: { duration: 1500, sequenceQueue: false } },
		// 		{ e: $nextSlide, p: { scale: 1.1, rotateZ: randAngle }, o: { duration: 8000, sequenceQueue: false } }					

		// 	];

		// 	$.Velocity.RunSequence(fadeSequence);		

		// 	$prevSlide = $currentSlide;
		// 	$currentSlide = $targetSlide;

		// 	sequenceAnimating = false;

		// }

		/*

				Build polaroids on load

		*/

		var imagesFolder = "photos/";
		var $galleryContainer = $('#gallery-container');


		// Retrieve images manifest from server
		$.ajax({
		    url : 'photos/manifest.json',
		    success: function(data) {

		    	//console.log(data);

				imageManifest = data;

				// spawnContainers(imageManifest);
				// buildPhotoContainers(imageManifest);
				// initializeSlideshow(imageManifest);

		    }

		});

		// function buildPhotoContainers(data) {

		// 	$imageHolders.each(function() {

		// 		var rand = Math.round(Math.random () * (data.length-1));
		// 	 	var randPhoto = data[rand];

		// 		var angle = (Math.random() * 30) - 15;
		// 		var positionX = (Math.random () * 100);
		// 		var positionY = (Math.random () * 100);

		// 		$(this).css({
		// 			'transform': 'rotate(' + angle + 'deg)',
		// 			'top': positionX + '%',
		// 			'left': positionY + '%'
		// 		}).attr('data-angle', angle);

		// 		var photoURL = randPhoto.previewURL + randPhoto.title;
		// 		if (isRetina) {
		// 			photoURL = randPhoto.previewURL + '@2x/' + randPhoto.title;
		// 		}

		// 		$(this).find('.image').css({
		// 			'background-image': "url('" + photoURL + "')"
		// 		});

		// 		$(this).find('.comment').html(randPhoto.comment);

		// 	});

		// }


		// /* 

		// 		Gallery scripts 

		// */

		// $('div.holder').hammer().on('tap press pan', function(e) {
		// 	$('.zactive').removeClass('zactive');
		// 	$(this).addClass('zactive');
		// });

		// var grabOffsetX = 0;
		// var grabOffsetY = 0;
		// var dragging = false;

		// // target elements with the "draggable" class
		// interact('.drag-rotate')
		// 	.draggable({
		// 		// enable inertial throwing
		// 		inertia: true,
		// 		// keep the element within the area of it's parent
		// 		restrict: {
		// 			restriction: "parent",
		// 			endOnly: true,
		// 			elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
		// 		},
		// 		// enable autoScroll
		// 		autoScroll: true,
		// 		onstart: function(event) {
		// 			dragging = true;
		// 		},
		// 		// call this function on every dragmove event
		// 		onmove: dragMoveListener,
		// 		// call this function on every dragend event
		// 		onend: function (event) {
		// 			var textEl = event.target.querySelector('p');

		// 			dragging = false;

		// 			textEl && (textEl.textContent =
		// 			'moved a distance of '
		// 			+ (Math.sqrt(event.dx * event.dx +
		// 			     event.dy * event.dy)|0) + 'px');
		// 		}
		// 	})
		// 	.gesturable({
		// 		onmove: function (event) {

		// 			var target = event.target,

		// 			x = parseFloat(target.getAttribute('data-x'));
		// 			y = parseFloat(target.getAttribute('data-y'));
		// 			angle = parseFloat(target.getAttribute('data-angle'));
		// 			angle += event.da;

		// 			// translate the element
		// 			target.style.webkitTransform =
		// 			target.style.transform =
		// 			'translate(' + x + 'px, ' + y + 'px) rotate(' + angle + 'deg)';
					
		// 			target.setAttribute('data-angle', angle);
		// 		}
		// 	});

	
		// function dragMoveListener (event) {
		// 	var target = event.target,
		// 	// keep the dragged position in the data-x/data-y attributes
		// 	x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
		// 	y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
		// 	angle = (parseFloat(target.getAttribute('data-angle')) || 0);

		// 	// translate the element
		// 	target.style.webkitTransform =
		// 	target.style.transform =
		// 	'translate(' + x + 'px, ' + y + 'px) rotate(' + angle + 'deg)';

		// 	// update the posiion attributes
		// 	target.setAttribute('data-x', x);
		// 	target.setAttribute('data-y', y);
		// }

		// // this is used later in the resizing and gesture demos
		// window.dragMoveListener = dragMoveListener;

		// var lastVelocityX = 0;

		// 	$('#gallery-container').hammer().on("pan", function(ev) {

		// 	if (dragging) { 
		// 		ev.preventDefault();
		// 		return 
		// 	};

		// 	// console.log(ev.gesture);

		// 	var delta = ev.gesture.deltaX;



		// 	$imageHolders.each(function() {

		// 		var target = $(this)[0];

		// 		x = (parseFloat(target.getAttribute('data-x')) || 0);
		// 		y = (parseFloat(target.getAttribute('data-y')) || 0);
		// 		angle = (parseFloat(target.getAttribute('data-angle')) || 0);

		// 		x += (ev.gesture.velocityX * 15);

				

		// 		// 	// translate the element
		// 		target.style.webkitTransform =
		// 		target.style.transform =
		// 		'translate(' + x + 'px, ' + y + 'px) rotate(' + angle + 'deg)';

		// 		// update the posiion attributes
		// 		target.setAttribute('data-x', x);


		// 	});

		// });

});
//
//
// /**
// * Inspired by Jesse Guardiani - May 1st, 2012
// */
//
// var zIndexBackup = 10;
//
// function DragView(target) {
//   this.target = target[0];
//   this.drag = [];
//   this.lastDrag = {};
//
//
//   this.WatchDrag = function()
//   {
//     if(!this.drag.length) {
//       return;
//     }
//
//     for(var d = 0; d<this.drag.length; d++) {
//       var left = $(this.drag[d].el).offset().left;
//       var top = $(this.drag[d].el).offset().top;
//
//       var x_offset = -(this.lastDrag.pos.x - this.drag[d].pos.x);
//       var y_offset = -(this.lastDrag.pos.y - this.drag[d].pos.y);
//
//       left = left + x_offset;
//       top = top + y_offset;
//
//       this.lastDrag = this.drag[d];
//
//       this.drag[d].el.style.left = left +'px';
//       this.drag[d].el.style.top = top +'px';
//     }
//   }
//
//   this.OnDragStart = function(event) {
//     var touches = event.originalEvent.touches || [event.originalEvent];
//     for(var t=0; t<touches.length; t++) {
//       var el = touches[t].target.parentNode;
//
// 	  if(el.className.search('polaroid') > -1){
//
// 			 el = touches[t].target.parentNode.parentNode;
// 	  }
// 		el.style.zIndex = zIndexBackup + 1;
// 		zIndexBackup = zIndexBackup +1;
//
//       if(el && el == this.target) {
// 		$(el).children().toggleClass('upSky');
//         this.lastDrag = {
//           el: el,
//           pos: event.touches[t]
//         };
//         return;
//       }
//
//     }
//   }
//
//   this.OnDrag = function(event) {
//     this.drag = [];
//     var touches = event.originalEvent.touches || [event.originalEvent];
//     for(var t=0; t<touches.length; t++) {
//       var el = touches[t].target.parentNode;
//
// 	if(el.className.search('polaroid') > -1){
// 			 el = touches[t].target.parentNode.parentNode;
// 	  }
//
//       if(el && el == this.target) {
//         this.drag.push({
//           el: el,
//           pos: event.touches[t]
//         });
//       }
//     }
//   }
//
//   this.OnDragEnd = function(event) {
// 	  	this.drag = [];
//     	var touches = event.originalEvent.touches || [event.originalEvent];
// 	 	for(var t=0; t<touches.length; t++) {
//       			var el = touches[t].target.parentNode;
//
// 	  			if(el.className.search('polaroid') > -1){
// 			 			el = touches[t].target.parentNode.parentNode;
// 	  			}
// 				$(el).children().toggleClass('upSky');
//
// 	  }
//   }
// }
//
//
// function ZoomView(container, element) {
//
//     container = $(container).hammer({
//         prevent_default: true,
//         scale_treshold: 0,
//         drag_min_distance: 0
//     });
//
//     element = $(element);
//
//
//     var displayWidth = container.width();
//     var displayHeight = container.height();
//
//     //These two constants specify the minimum and maximum zoom
//     var MIN_ZOOM = 1;
//     var MAX_ZOOM = 30;
//
//     var scaleFactor = 1;
//     var previousScaleFactor = 1;
//
//     //These two variables keep track of the X and Y coordinate of the finger when it first
//     //touches the screen
//     var startX = 0;
//     var startY = 0;
//
//     //These two variables keep track of the amount we need to translate the canvas along the X
//     //and the Y coordinate
//     var translateX = 0;
//     var translateY = 0;
//
//     //These two variables keep track of the amount we translated the X and Y coordinates, the last time we
//     //panned.
//     var previousTranslateX = 0;
//     var previousTranslateY = 0;
//
//     //Translate Origin variables
//
//     var tch1 = 0,
//         tch2 = 0,
//         tcX = 0,
//         tcY = 0,
//         toX = 0,
//         toY = 0,
//         cssOrigin = "";
//
//     container.bind("transformstart", function(event){
//
//         //We save the initial midpoint of the first two touches to say where our transform origin is.
//         e = event
//
//         tch1 = [e.touches[0].x, e.touches[0].y],
//         tch2 = [e.touches[1].x, e.touches[1].y]
//
//         tcX = (tch1[0]+tch2[0])/2,
//         tcY = (tch1[1]+tch2[1])/2
//
//         toX = tcX
//         toY = tcY
//
//         var left = $(element).offset().left;
//         var top = $(element).offset().top;
//
//         cssOrigin = (-(left) + toX)/scaleFactor +"px "+ (-(top) + toY)/scaleFactor +"px";
//     })
//
//     container.bind("transform", function(event) {
//         scaleFactor = previousScaleFactor * event.scale;
//
//         scaleFactor = Math.max(MIN_ZOOM, Math.min(scaleFactor, MAX_ZOOM));
//         transform(event);
//     });
//
//     container.bind("transformend", function(event) {
//         previousScaleFactor = scaleFactor;
//     });
//
//
//     /**
//     * on drag
//     */
//     var dragview = new DragView($(container));
//     container.bind("dragstart", $.proxy(dragview.OnDragStart, dragview));
//     container.bind("drag", $.proxy(dragview.OnDrag, dragview));
//     container.bind("dragend", $.proxy(dragview.OnDragEnd, dragview));
//
//     setInterval($.proxy(dragview.WatchDrag, dragview), 10);
//
//
//
//     function transform(e) {
//         //We're going to scale the X and Y coordinates by the same amount
//         var cssScale = "scaleX("+ scaleFactor +") scaleY("+ scaleFactor +") rotateZ("+ e.rotation +"deg)";
//
//         element.css({
//             webkitTransform: cssScale,
//             webkitTransformOrigin: cssOrigin,
//
//             transform: cssScale,
//             transformOrigin: cssOrigin,
//         });
//
//
//     }
//
// }
