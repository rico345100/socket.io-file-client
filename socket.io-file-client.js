(function() {
	var self = this;
	var CHUNK_SIZE = 524288;
	var instanceCnt = 0;

	function SocketIOFileClient(socket) {
		var self = this;
		var id = instanceCnt++;	// private
		var uploadId = 0;		// private
		this.socket = socket;
		this.ev = [];
		this.sendingFiles = [];
		this.fileReaders = [];
		this.sync = false;

		this.getId = function() {
			return id;
		};
		this.getUploadId = function() {
			return 'U' + (uploadId++);
		};

		this.socket.once('socket.io-file::sync', function(data) {
			this.sync = true;
		});
		this.socket.emit('socket.io-file::sync', {
			id: id
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
		var uploadId = this.getUploadId();

		options = options || {};
		var types = options.types || [];
		var uploadTo = options.to || '';
		var uploadData = options.data || {};

		if(!file) {
			return self.emit('error', {
				message: "No file"
			});
		}

		this.sendingFiles[uploadId] = file;

		this.fileReaders[uploadId] = new FileReader();
		this.fileReaders[uploadId].onload = function(e) {
			var file = self.sendingFiles[uploadId];

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
					id: id,
					uploadId: uploadId, 
					name: file.name,
					data: e.target.result
				});
			}
		};

		this.socket.emit('socket.io-file::start', {
			id: id,
			uploadId: uploadId,
			name: file.name,
			size: this.sendingFiles[uploadId].size,
			uploadTo: uploadTo,
			data: uploadData
		});

		this.emit('start');

		this.socket.on('socket.io-file::' + id + '::' + uploadId + '::stream', function(data) {
			let id = data.id;
			let uploadId = data.uploadId;

			data.id = id;
			data.uploadId = uploadId;
			
			self.emit('stream', data);

			if(data.uploaded >= self.sendingFiles[uploadId].size) return;

			var stream = data.stream * CHUNK_SIZE;	// The Next block's starting position
			var newFile;		// The variable that will hold the new Block of data

			if(self.sendingFiles[uploadId].slice) {
				newFile = self.sendingFiles[uploadId].slice(stream, stream + Math.min(524288, (self.sendingFiles[uploadId].size - stream)));
			}
			else if(self.sendingFiles[uploadIdid].webkitSlice) {
				newFile = self.sendingFiles[uploadId].webkitSlice(stream, stream + Math.min(524288, (self.sendingFiles[uploadId].size - stream)));
			}
			else {
				newFile = self.sendingFiles[uploadId].mozSlice(stream, stream + Math.min(524288, (self.sendingFiles[uploadId].size - stream)));
			}

			self.fileReaders[uploadId].readAsBinaryString(newFile);
		});
		this.socket.on('socket.io-file::' + id + '::' + uploadId + '::complete', function(data) {
			let id = data.id;
			let uploadId = data.uploadId;

			self.emit('complete', data);
			delete self.fileReaders[uploadId];
			delete self.sendingFiles[uploadId];
		});

		return uploadId;
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
	SocketIOFileClient.prototype.abort = function(id) {
		// abort all
		if(!id) {
			for(var key in this.sendingFiles) {
				if(this.sendingFiles[key]) {
					this.socket.emit('socket.io-file::abort', {
						uploadId: key
					});
				}
			}
		}
		else {
			if(this.sendingFiles[id]) {
				this.socket.emit('socket.io-file::abort', {
					uploadId: id
				});
			}
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
		this.fileReaders = [];
		this.sendingFiles = [];
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