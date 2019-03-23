/* @flow */
import EventEmitter from './EventEmitter';
import type { IOSocket } from './types';


class SocketIOFileClient {
	/* Property types */
	socket: IOSocket;
	eventEmitter: EventEmitter;

	constructor(socket: IOSocket) {
		this.socket = socket;
		this.eventEmitter = new EventEmitter();
	}

	// TODO: Implement Upload
	upload() {

	}

	// TODO: Implement aborting upload
	abort(id: string) {

	}

	on(evName: string, handler: function) {
		this.eventEmitter.on(evName, handler);
	}

	off(evName: string, handler: function) {
		this.eventEmitter.off(evName, handler);
	}

	emit(evName: string, args: any) {
		this.eventEmitter.emit(evName, args);
	}
}

export default SocketIOFileClient;