var express = require('express'),
serveIndex = require('serve-index'),
server_port = process.env.NODE_PORT || 3000,
server_ip_address = process.env.NODE_HOST || '0.0.0.0',
cmd=require('node-cmd'),
log = require('single-line-log').stdout,
opn = require('opn'),
fs = require('fs'),
writeJsonFile = require('write-json-file'),
thumb = require('node-thumbnail').thumb,
sizeOf = require('image-size'),
ms = require('millisecond'),
jsonfile = require('jsonfile'),
sharp = require('sharp'),
replaceExt = require('replace-ext');

var API = new Object();


API = { 

    // Config
    env: "DEV",
    isInitialized: false,
    imageManifest: [],
    manifestLocation: __dirname +  '/app/src/manifest.json',
    imagesFolder: __dirname + '/app/src/photos/',
    processedImagesFolder: __dirname + '/app/src/photos/min/',
    enableOptimization: true,
    maxWidth: 2500,
    maxHeight: 2500,

	itemUpdatesBuffer: [],

	UTILS: {

	},

	TOOLS: {

		updateConfig: function() {


		},

		updateIndex: function(id, index) {


			var found = false;

			// Load the layout json initially
			// API.TOOLS.loadManifest();

			// Try and find this image in the manifest
			for(var i = 0; i < API.imageManifest.length; i++) {

				var image = API.imageManifest[i];


				if (image.id == id) {
					found = true;

					image.index = x;
					image.y = y;
					image.rotation = rotation;
					image.loaded = true;

					break;

				}
			}

			// Only save if we found it
			if (found) {
				API.TOOLS.saveManifest();
				return true;
			} else {
				return false;
			}	

		},

		updateItem: function(id, data) {

			var found = false;

			console.log('Updating item: ' + id);
			// Load the layout json initially
			// API.TOOLS.loadManifest();

			// Try and find this image in the manifest
			for(var i = 0; i < API.imageManifest.length; i++) {

				var image = API.imageManifest[i];

				if (image.id == id) {

					found = true;

					for (var key in data) {
						image[key] = data[key];					      
					}

					break;

				}
			}

			// Only save if we found it
			if (found) {
				API.TOOLS.saveManifest();
				return true;
			} else {
				return false;
			}			

		},

		decodeBase64Image: function(dataString) {
			var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
			response = {};

			if (matches.length !== 3) {
			return new Error('Invalid input string');
			}

			response.type = matches[1];
			response.data = new Buffer(matches[2], 'base64');

			return response;
		},

		
		removeImageFromFolder: function(data) {

			sharp.cache(false);

			var id = data.id;
			console.log('Looking for image with name [' + id + '] in manifest!');

			var found = false;

			for (var i = 0; i<API.imageManifest.length; i++) {

				var image = API.imageManifest[i];

				if (image.id == id) {

					found = true;

					console.log('Found image to remove...attempting unlink!');

					if (fs.existsSync(API.imagesFolder + image.filename)) {

						fs.unlinkSync(API.imagesFolder + image.filename, function(err){
					        if(err) return console.log(err);
					        console.log('File removed successfully!');				        
					    }); 

					}		

					if (fs.existsSync(API.processedImagesFolder + image.filename)) {

					    fs.unlinkSync(API.processedImagesFolder + image.filename, function(err){
					        if(err) return console.log(err);
					        console.log('Minified file removed successfully!');				        
					    }); 						

					};

					API.TOOLS.generateManifest(true);

					break;
				}
			}

			if (!found) {
				return false;
			}

			return true;			 

		},

		getImageIDFromFilename: function (url) {

			// Remove entries in existing manifest that don't exist in this directory now
		 	var foundID = '';

		 	for (var i=0; i<API.imageManifest.length; i++) { 	

		 		image = API.imageManifest[i];	 

		 		if (image.filename == url) {
		 			foundID = image.id;
		 			console.log('found match!');
		 			break;
		 		}

		 	}

		 	return foundID;
		},


		addToImagesFolder: function(data) {

			var filename = data.filename;
			var posX = data.x;
			var posY = data.y;
	
			if (!filename.match(/\.(jpe?g|png|gif|JPG|jpg)$/) ) {
				return false;
			}


			var base64 = data.base64;
			var data = base64.replace(/^data:image\/\w+;base64,/, '');

			var spawn = data.spawnLocation;

  			fs.writeFileSync(API.imagesFolder + filename, data, {encoding: 'base64'}, function (err) {
                if (err) {
                	console.log(err);
                	return
                }
                // API.TOOLS.generateManifest();
            });

  			console.log('Pushed: ' +filename + ' to buffer.');

  			API.itemUpdatesBuffer.push({
            	filename: filename
            	, props: {
            		x: posX
            		, y: posY
            	}
            });

            API.TOOLS.generateManifest(true);          

			return true;


		},

		loadManifest: function() {

			try {
				API.imageManifest = jsonfile.readFileSync(API.manifestLocation);
				console.log('\n Existing manifest found... loaded it!');
			} catch (e) {
				console.log('\n No manifest found, starting a new one!');
				API.imageManifest = [{}];
				API.TOOLS.saveManifest();
			}
		},

		saveManifest: function() {

			if (API.env == "PRODUCTION") { return };

			try {
				jsonfile.writeFileSync(API.manifestLocation, API.imageManifest);
				// console.log('\n Manifest saved successfully.');
			} catch (e) {
				console.log('\n Error saving manifest! [' + e + ']');
			}	
		},

		broadcastManifest: function() {
			console.log('\n Pushing updated manifest to all clients!');
			io.sockets.emit('manifest', API.imageManifest);  
		},

		generateManifest: function(broadcastOnComplete) {

			var additions = 0;
			var removals = 0;
			var updates = 0;

			console.log('Begining manifest checks...');

			fs.readdir(API.imagesFolder, function(err, items) {

				if (err) {

					console.log(err);

				} else {

					var manifest = [];

				 	console.log('Manifest generation started.');

				 	API.TOOLS.loadManifest();

				 	// Remove entries in existing manifest that don't exist in this directory now
				 	for (var i=0; i<API.imageManifest.length; i++) { 	

				 		image = API.imageManifest[i];

				 		var found = false;

				 		for (var y=0; y<items.length; y++) { 
				 			if (image.filename == items[y]) {
				 				found = true;
				 			}
				 		}

				 		if (!found) {
				 			API.imageManifest.splice(i, 1);
				 			removals += 1;
				 		}
				 	}

				 	API.TOOLS.saveManifest();

				    for (var i=0; i<items.length; i++) { 		

				        log('Generating manifest [' + Math.round(((i/items.length)*100)) + '%]');

				        image = items[i];

				        if ( image.match(/\.(jpe?g|png|gif|JPG|jpg)$/) ) {

				        	var found = false;

			        		var relURL = __dirname +  '/app/src/photos/' + image;
				        	var dimensions = sizeOf(relURL);

				        	var uniqueID = 'photo-' + Math.random( 0, 10000, true ) + '-' + Date.now();
				        	var minURL = replaceExt('/photos/min/' + image, '.jpg');   				        
		
				        	// Check whether this item exists in the manifest already
						 	for (var y=0; y<API.imageManifest.length; y++) { 	

						 		manifestImage = API.imageManifest[y];

						 		if (manifestImage.filename == image) {				 			

						 			found = true;

						 			// Update dimensions but don't touch anything else
						 			manifest.id = (manifest.id) ? manifest.id : uniqueID;					 			
						 			manifest.min = minURL;
						 			manifestImage.width = dimensions.width;
						 			manifestImage.height = dimensions.height;
						 		}

						 	}

						 	var targetURL = replaceExt(__dirname + '/app/src/photos/min/' + image, '.jpg');						 	
						 	var optimizedVersionExists = fs.existsSync(targetURL);

						 	if (!optimizedVersionExists && API.enableOptimization) {

				        		// Preserve existing aspect ratio when re-scaling
				        		var targetWidth = Math.min(dimensions.width, API.maxWidth);
				        		var targetHeight = targetWidth * (dimensions.height / dimensions.width);

				        		if (dimensions.height > dimensions.width) {
				        			targetHeight = Math.min(dimensions.height, API.maxHeight);
				        			targetWidth = targetHeight * (dimensions.width / dimensions.height);
				        		}

				        		

								sharp(__dirname + '/app/src/photos/' + image)
									.resize(Math.round(targetWidth), Math.round(targetHeight))
									.jpeg({
										quality:70
									})
									.toFile(targetURL, function(err, obj) {

										if (err) {
											console.log('\n Error processing image [' + err + ']');
										} else {
											console.log('\n Optimized image [' + obj.size + ']');
										}
									});

				        	} 

						 	if (!found) {	
						 		
								var item = {
									id: uniqueID	
									, title: replaceExt(image, '')
									, filename: image
									, sourceUrl: '/photos/'+ image
									, min: minURL
									, width: dimensions.width
									, height: dimensions.height
									, comment: ''
									, x: 0
									, y: 0
									, rotation: 0
									, index: 0
									, loaded: false
								};

								// Check item buffer for amendments
								for (var i = 0; i<API.itemUpdatesBuffer.length; i++) 
						 		{
						 			var update = API.itemUpdatesBuffer[i];

						 			if (image == update.filename) {

						 				console.log('\n Found an image buffer update! ' + update.filename);

						 				var data = update.props;
					 					for (var key in data) {
											item[key] = data[key];					      
										}

										API.itemUpdatesBuffer.splice(i,1);

										break;
						 			}
						 		};        


								additions += 1;
								
								API.imageManifest.push(item);

							}
							

					    }

					}

					log('\n Additions: ' + additions + ' Removals: ' + removals + '\n');

					API.TOOLS.saveManifest();	

					if (broadcastOnComplete) {
						API.TOOLS.broadcastManifest();    
					}

				}

			});

		}
	}

};

module.exports = API.TOOLS.resizeImage;

var app = express();


app.get('/generate', function(req,res) {

	API.TOOLS.generateManifest(true);

	backURL=req.header('Referer') || '/';
	// do your thang
	return res.redirect(backURL);
});

app.use(express.static(__dirname + '/app/src'));





// app.use('/thumbnails', qt.static(__dirname + '/app/src/photos/'));
app.use('/photos', serveIndex(__dirname + '/app/src/photos/', {'icons': true}));

var server = app.listen(server_port, server_ip_address, function() {

    console.log('Server listening on ' +server_ip_address+ ' port ' + server_port + '!');
    API.TOOLS.generateManifest();


    opn('http://localhost:' + server_port, {app: 'chrome'});

});

io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

  var socketID = socket.id;
  console.log('Client connected! [' + socketID+ ']');


  	socket.on('addImage', function(data) {

  		console.log('Received new file from [' + socket.id + ']');

  		socket.emit('log', 'Server received file!');

  		var result = API.TOOLS.addToImagesFolder(data);

  		if (result) {
  			socket.emit('log', 'Sucessfully added to manifest!');
  		} else {
  			socket.emit('log', 'Error adding to manifest!');
  		}  		

  	});

  	socket.on('removeImage', function(data) {

  		console.log('Received remove request from [' + socket.id + ']');

  		socket.emit('log', 'Server got request!');

  		var result = API.TOOLS.removeImageFromFolder(data);

  		if (result) {
  			socket.emit('log', 'Sucessfully removed from manifest!');
  		} else {
  			socket.emit('log', 'Error removing from manifest!');
  		} 

  	});



   	socket.on('updateItem', function (data) {

   	// console.log('Received layout update from [' + socket.id + ']');

    var result = API.TOOLS.updateItem(
   		data.id,
   		data.props
   	);

   	if (result) {
   		io.sockets.emit('updateItemClient', data);
   		socket.emit('log', 'Update successful.');
   	} else {
   		socket.emit('log', 'Update failed.');
   	};

   }); 

   // socket.on('updateIndex', function(data) {

   // 		console.log('Received index update from [' + socket.id + ']');

   // 		var result = API.TOOLS.updateItem(
   // 		data.id,
   // 		data.props
   // 	);

   // });

   socket.on('requestManifest', function (data) {

   	console.log('Received manifest request from [' + socket.id + ']');   

   	if ( API.imageManifest.length == 0 ) {
   		console.log('Badly formed manifest... cannot send update');
   		return
   	}

   	socket.emit('manifest', API.imageManifest);
   	// API.TOOLS.broadcastManifest();

   }); 

   // when the client emits 'new message', this listens and executes
  socket.on('test', function (data) {
     console.log('got it! [' + socketID+ ']');
     io.sockets.emit('test2', 'testing!!!');
  }); 

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // if (addedUser) {
    //   --numUsers;

    //   // echo globally that this client has left
    //   socket.broadcast.emit('user left', {
    //     username: socket.username,
    //     numUsers: numUsers
    //   });
    // }
  });
});