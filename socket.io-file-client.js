(function() {
	window.addEventListener('load', function() {
		if(!window.File || !window.FileReader) {
			throw new Error('Your browser does not support FileReader API.');
		}
	});

	var fileReader = new FileReader();
	var CHUNK_SIZE = 524288;

	window.SocketIOFileClient = function(socket) {
		var self = this;
		this.socket = socket;
		this.ev = [];
		this.sendingFile = undefined;
		
		this.socket.on('socket.io-file::stream', function(data) {
			self.emit('stream', data);

			if(data.uploaded >= self.sendingFile.size) return;

			var stream = data.stream * CHUNK_SIZE;	// The Next block's starting position
			var newFile;		// The variable that will hold the new Block of data

			if(self.sendingFile.slice) {
				newFile = self.sendingFile.slice(stream, stream + Math.min(524288, (self.sendingFile.size - stream)));
			}
			else if(self.sendingFile.webkitSlice) {
				newFile = self.sendingFile.webkitSlice(stream, stream + Math.min(524288, (self.sendingFile.size - stream)));
			}
			else {
				newFile = self.sendingFile.mozSlice(stream, stream + Math.min(524288, (self.sendingFile.size - stream)));
			}

			fileReader.readAsBinaryString(newFile);
		});
		this.socket.on('socket.io-file::complete', function(data) {
			self.emit('complete');
			self.sendingFile = undefined;
		});
	}
	SocketIOFileClient.prototype.upload = function(file) {
		this.sendingFile = file;

		if(!file) {
			console.warn('SocketIOFileClient: No file to send.');
			return false;
		}

		fileReader.onload = function(e) {
			socket.emit('socket.io-file::stream', {
				name: file.name,
				data: e.target.result
			});
		};

		this.socket.emit('socket.io-file::start', {
			name: file.name,
			size: this.sendingFile.size
		});

		this.emit('start');
	};
	SocketIOFileClient.prototype.on = function(evName, fn) {
		if(!this.ev[evName]) {
			this.ev[evName] = [];
		}

		this.ev[evName].push(fn);
		return this;
	};
	SocketIOFileClient.prototype.off = function(evName, fn) {
		var evList = this.ev[evName] || [];

		for(var i = 0; i < evList.length; i++) {
			if(evList[i] === fn) {
				evList = evList.splice(i, 1);
				break;
			}
		}

		return this;
	};
	SocketIOFileClient.prototype.emit = function(evName, args) {
		var evList = this.ev[evName] || [];

		for(var i = 0; i < evList.length; i++) {
			evList[i](args);
		}

		return this;
	};
})();