(function() {
	var CHUNK_SIZE = 524288;
	var instanceCnt = 0;

	function SocketIOFileClient(socket) {
		var self = this;
		var id = instanceCnt++;	// private
		this.socket = socket;
		this.ev = [];
		this.sendingFile = undefined;
		this.fileReader = new FileReader();
		this.sync = false;

		this.getId = function() {
			return id;
		};

		this.socket.once('socket.io-file::sync', function(data) {
			this.sync = true;
		});
		this.socket.emit('socket.io-file::sync', {
			id: id
		});
		
		this.socket.on('socket.io-file::' + id + '::stream', function(data) {
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

			self.fileReader.readAsBinaryString(newFile);
		});
		this.socket.on('socket.io-file::' + id + '::complete', function(data) {
			self.emit('complete', data);
			self.sendingFile = undefined;
		});
		this.socket.on('socket.io-file::' + id + '::abort', function(data) {
			self.emit('abort', data);
		});
		this.socket.on('socket.io-file::' + id + '::error', function(data) {
			self.emit('error', data);
		});
	}
	SocketIOFileClient.prototype.upload = function(file, options) {
		var self = this;
		var id = this.getId();
		options = options || {};
		var types = options.types || [];
		var uploadTo = options.to || '';
		var uploadData = options.data || {};

		if(!file) {
			return self.emit('error', {
				message: "No file"
			});
		}

		this.sendingFile = file;

		this.fileReader.onload = function(e) {
			// check file type
			var found = false;
			for(var i = 0; i < types.length; i++) {
				if(file.type === types[i]) {
					found = true;
					break;
				}
			}

			if(types.length > 0 && !found) {
				self.emit('error', {
					message: "Type must be one of these: " + types.toString()
				});
				
				self.socket.emit('socket.io-file::abort', {
					id: self.getId(),
					name: file.name
				});
			}
			else {
				self.socket.emit('socket.io-file::stream', {
					id: self.getId(),
					name: file.name,
					data: e.target.result
				});
			}
		};

		this.socket.emit('socket.io-file::start', {
			id: self.getId(),
			name: file.name,
			size: this.sendingFile.size,
			uploadTo: uploadTo,
			data: uploadData
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
		if(typeof evName === 'undefined') {
			this.ev = [];
		}
		else if(typeof fn === 'undefined') {
			if(this.ev[evName]) {
				delete this.ev[evName]; 
			}
		}
		else {
			var evList = this.ev[evName] || [];

			for(var i = 0; i < evList.length; i++) {
				if(evList[i] === fn) {
					evList = evList.splice(i, 1);
					break;
				}
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
	SocketIOFileClient.prototype.abort = function() {
		if(this.sendingFile) {
			this.socket.emit('socket.io-file::abort', {
				name: this.sendingFile.name
			});
		}
	};
	SocketIOFileClient.prototype.destroy = function() {
		this.abort();
		
		this.off();	// remove all listeners
		this.socket.off('socket.io-file::start');
		this.socket.off('socket.io-file::stream');
		this.socket.off('socket.io-file::abort');
		this.socket.off('socket.io-file::complete');
		this.socket.off('socket.io-file::error');
		this.fileReader = null;
	};

	// CommonJS
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = SocketIOFileClient;
	}
	// RequireJS
	else if (typeof define === "function" && define.amd) {
		define(['SocketIOFileClient'], SocketIOFileClient);
	}
	// <script>
	else {
		var g;

		if (typeof window !== "undefined") {
			g = window;
		}
		else if (typeof global !== "undefined") {
			g = global;
		}
		else if (typeof self !== "undefined") {
			g = self;
		}
		else {
			// works providing we're not in "use strict";
			// needed for Java 8 Nashorn
			// see https://github.com/facebook/react/issues/3037
			g = this;
		}

		g.SocketIOFileClient = SocketIOFileClient;
	}
})();