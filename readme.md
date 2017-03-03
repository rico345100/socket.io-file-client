# Socket.io-file-client
Socket.io-file-client is module for uploading file via Socket.io.


## Major Changes from 1.x to 2.x
Socket.io-file 1.x used Binary String to send files. Binary String is little bit slower than direct Binary writes, and also server used fs.write, not writable stream.
Recently, FileReader.readAsBinaryString() was deprecated, so I updated Socket.io-file to use ArrayBuffer(Object for manipulate Binary Data directly from JavaScript) instead of Binary String.

Also, newer version has much more functionalities, like Server-side MIME type checking, File size limitations.
Even you can configure the size of each transmission(chunk) any value you want, higher value gives you faster upload.


## Features
- Simple is the best.
- File uploads
- Highly improved performance
- Using File Streams to write faster, efficient.
- Checking mime, limit file size
- Multiple file uploads


## Examples
You can found full source code here: [Example Page](https://github.com/rico345100/socket.io-file-example)
Or [Browserify Example](https://github.com/rico345100/socket.io-file-example-browserify)

### Client side

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>Socket.io-file 2.x File Upload Example</title>
</head>
<body>
	<h1>Socket.io-file 2.x File Upload Example</h1>
	<p>Select file and click upload button to upload.</p>
	<p>Multiple upload also supports.</p>

	<form id="form">
		<input type="file" id="file" multiple />
		<input type="submit" value="Upload" />
	</form>

	<script src="socket.io.js"></script>
	<script src="socket.io-file-client.js"></script>
	<script src="app.js"></script>
</body>
</html>
```

```javascript
var socket = io('http://localhost:3000');
var uploader = new SocketIOFileClient(socket);
var form = document.getElementById('form');

uploader.on('start', function(fileInfo) {
	console.log('Start uploading', fileInfo);
});
uploader.on('stream', function(fileInfo) {
	console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
});
uploader.on('complete', function(fileInfo) {
	console.log('Upload Complete', fileInfo);
});
uploader.on('error', function(err) {
	console.log('Error!', err);
});
uploader.on('abort', function(fileInfo) {
	console.log('Aborted: ', fileInfo);
});

form.onsubmit = function(ev) {
	ev.preventDefault();
	
	var fileEl = document.getElementById('file');
	var uploadIds = uploader.upload(fileEl);
};
```

Also Socket.io-file-client supports UMD, you can load from CommonJS require() or ES6 import:

```javascript
import SocketIO from 'socket.io-client';
import SocketIOFileClient from 'socket.io-file-client';

var socket = SocketIO('http://localhost:3000');
var uploader = new SocketIOFileClient(socket);
var form = document.getElementById('form');

uploader.on('start', (fileInfo) => {
	console.log('Start uploading', fileInfo);
});
uploader.on('stream', (fileInfo) => {
	console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
});
uploader.on('complete', (fileInfo) => {
	console.log('Upload Complete', fileInfo);
});
uploader.on('error', (err) => {
	console.log('Error!', err);
});
uploader.on('abort', (fileInfo) => {
	console.log('Aborted: ', fileInfo);
});

form.onsubmit = function(ev) {
	ev.preventDefault();
	
	var fileEl = document.getElementById('file');
	var uploadIds = uploader.upload(fileEl);
};
```


## API
### constructor SocketIOFileClient(io socket, Object options)
Create new SocketIOFileClient object.

### Array SocketIOFileClient.upload(HTMLElement fileEl, Object options)
### Array SocketIOFileClient.upload(FileList files, Object options) (New from 2.0.1)
Upload file(s). First argument must be <input type="file" /> or FileList object, other wise refuse uploads. If it has multiple files(with multiple attribute), it uploads all at once.
Returns array that contains upload ids as values.
Available options are:
- String to: If server has multiple upload directories, client must be set the directory where to upload.

### SocketIOFileClient SocketIOFileClient.on(String evName, function fn)
Attach event handler to SocketIOFileClient. Possible events are described later part.

### SocketIOFileClient SocketIOFileClient.off(String evName[, function fn])
Detach event handler from SocketIOFileClient. If function is undefined, removes all event handlers attached on that event.

### SocketIOFileClient SocketIOFileClient.emit(String evName, Object args)
Trigger the event.

### void SocketIOFileClient.abort(String id)
Abort upload of specified id.

### void SocketIOFileClient.destroy(void)
Destroy all resources about SocketIOFileClient. Use this method for saving more resources from client side. After use this, you can't upload file anymore.

### void SocketIOFileClient.getUploadInfo(void) 
Get array of currently uploading files. Keys are upload id, values are object that contains information of uploading files.


### Events
SocketIOFile provides these events. Some of property is slight different than servers, like wrote -> sent.

#### ready (ADDED ON 2.0.12)
Fired on ready to upload files. Everytime you create new SocketIOFileClient object, it receives some upload information from server like chunkSize, mimeType like other things.
So if you send the file before sync those meta data, your upload won't work properly. Personally, I recommend create single SocketIOFileClient object first, and make upload after ready events fired.

#### start
Fired on starting file upload. This means server grant your uploading request and create empty file to begin writes. Argument has:
- String name: Name of the file
- Number size: Size of the file(bytes)
- String uploadTo: Directory that where to writing.

#### stream
Fired on getting chunks from client. Argument has:
- String name
- String uploadTo
- Number size
- Number sent: Bytes of sent

#### complete
Fired on upload complete. Argument has:
- String name
- String mime: MIME type that server recognized.
- Number size
- Number wrote
- Number estimated: Estimated uploading time as ms.

#### abort
Fired on abort uploading.
- String name
- String uploadTo
- Number size
- Number sent

#### error
Fired on got an error. Passes Error object. 


## Browser Supports
This module uses FileReader API with ArrayBuffer, so make sure your browser support it.