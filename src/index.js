/* @flow */
import EventEmitter from './EventEmitter';
import type { UploadOptions, FileInfo, UploadInfo, UploadSettings } from './types';

class SocketIOFileClient {
	/* Property types */
	socket: IOSocket;
	eventEmitter: EventEmitter;
	evPrefix: string;
	uploadSettings: UploadSettings;

	constructor(socket: IOSocket) {
		this.socket = socket;
		this.eventEmitter = new EventEmitter();
		this.evPrefix = 'socket.io-file';

		this.socket.emit(`${this.evPrefix}::sync_upload_settings`);
		this.socket.once(`${this.evPrefix}::sync_upload_settings`, (uploadSettings) => {
			this.uploadSettings = uploadSettings;
			this.emit('ready');
		});
	}

	// TODO: Finish Implement Upload
	// TODO: Test Upload works
	async upload(file: HTMLInputElement, uploadOptions: UploadOptions) {
		if(typeof file === 'undefined') {
			throw new Error('File is empty.');
		}
		else if(typeof file.files === 'undefined') {
			throw new Error('Argument must be HTMLInputElement.');
		}
		else if(typeof uploadOptions === 'undefined') {
			throw new Error('Upload Options required.');
		}
		else if(!uploadOptions.to) {
			throw new Error('You must specify where to upload(uploadOptions.to).');
		}

		const targetFile = file.files[0];

		if(!targetFile) {
			throw new Error('No file(s) to upload.');
		}
		// TODO: Check "Accept" mime types
		// else if(targetFile.type !== )

		// TODO: Do Error Handling and release resources on caught error
		const uploadId = await this.getUploadIdFromServer();
		await this.requestServerToCreateFile(uploadId, targetFile);

		this.readFileAndUpload(uploadId, targetFile, uploadOptions);
	}

	/**
	 * Get uploadId from Server through Socket
	 */
	getUploadIdFromServer(): Promise<number> {
		return new Promise((resolve) => {
			this.socket.emit(`${this.evPrefix}::request_upload_id`);
			this.socket.once(`${this.evPrefix}::request_upload_id`, async (uploadId: number) => {
				resolve(uploadId);
			});
		});
	}

	/**
	 * Request Server to create file
	 * @param {number} uploadId 
	 * @param {File} file 
	 */
	requestServerToCreateFile(uploadId: number, file: File): Promise<void> {
		return new Promise((resolve) => {
			this.socket.emit(`${this.evPrefix}::${uploadId}::request_create_file`, {
				name: file.name,
				size: file.size
			});
			this.socket.once(`${this.evPrefix}::${uploadId}::request_create_file`, () => {
				resolve();
			});
		});
	}

	/**
	 * Read File data(ArrayBuffer) from FileReader and send to Socket
	 * @param {number} uploadId 
	 * @param {File} file 
	 * @param {UploadOptions} uploadOptions 
	 */
	// TODO: Refactoring this function with use Async & Await
	async readFileAndUpload(uploadId: number, file: File, uploadOptions: UploadOptions) {
		const fileInfo: FileInfo = {
			originalName: file.name,
			name: file.name,
			size: file.size,
			mimeType: file.type,
		};
		const uploadInfo: UploadInfo = {
			uploadId,
			sent: 0,
			completed: false,
			fileInfo,
			to: uploadOptions.to,
			data: uploadOptions.data || {}
		};
		const { chunkSize } = this.uploadSettings;

		this.emit('start');

		while(true) {
			// Check end of transmission
			if(uploadInfo.sent >= file.size) {
				break;
			}

			const buffer:  ArrayBuffer = await this.readBytes(file, uploadInfo.sent, chunkSize);
			await this.sendBytes(uploadId, buffer);	

			uploadInfo.sent += buffer.byteLength;

			this.emit('stream', {
				uploadId,
				fileInfo,
				sent: uploadInfo.sent
			});
		}

		this.socket.emit(`${this.evPrefix}::${uploadId}::complete`);
		this.emit('complete');
	}

	/**
	 * Sent bytes(ArrayBuffer) to socket
	 * @param {number} uploadId 
	 * @param {ArrayBuffer} buffer 
	 */
	sendBytes(uploadId: number, buffer: ArrayBuffer): Promise<void> {
		return new Promise((resolve) => {
			this.socket.once(`${this.evPrefix}::${uploadId}::stream`, () => {
				resolve();
			});
			this.socket.emit(`${this.evPrefix}::${uploadId}::stream`, buffer);
		});
	}

	/**
	 * Read Bytes from File with specified offset and length
	 * @param {File} file 
	 * @param {number} offset 
	 * @param {number} length 
	 * @return {Promise<ArrayBuffer>}
	 */
	readBytes(file: File, offset: number, length: number): Promise<ArrayBuffer> {
		return new Promise((resolve) => {
			const fileReader = new FileReader();
			const slice: Blob = file.slice(offset, offset + length);
			fileReader.readAsArrayBuffer(slice);

			fileReader.onloadend = () => {
				type FileReaderResult = ArrayBuffer | string;
				const result: FileReaderResult = fileReader.result;

				// fileReader.result could be string too, so need to check, otherwise Flow won't pass it.
				if(typeof result === 'string') {
					return;
				}

				const buffer: ArrayBuffer = result;
				resolve(buffer);
			};
		});
	}

	// TODO: Implement aborting upload
	abort(id: number) {

	}

	/**
	 * Add Event Listener
	 * @param {string} evName 
	 * @param {function} handler 
	 */
	on(evName: string, handler: function) {
		this.eventEmitter.on.apply(this.eventEmitter, arguments);
	}

	/**
	 * Remove Event Listener or all listeners
	 * @param {string} evName 
	 * @param {string} [handler] - Listener function. If it's undefined, remove all listeners of evName.
	 */
	off(evName: string, handler: function) {
		this.eventEmitter.off.apply(this.eventEmitter, arguments);
	}

	/**
	 * Emit the specified event
	 * @param {string} evName 
	 * @param {...args}
	 */
	emit(evName: string, ...args: any) {
		this.eventEmitter.emit.apply(this.eventEmitter, arguments)
	}
}

export default SocketIOFileClient;