/* @flow */

/**
 * Lightweight EventEmitter implementation support for multiple javascript platforms
 */
class EventEmitter {
	/* Property types */
	listeners: { [string]: function };

	constructor() {
		this.listeners = {};
	}

	on(evName: string, handler: function) {
		this.listeners[evName] = handler;
	}

	off(evName: string, handler: function) {
		delete this.listeners[evName];
	}

	emit(evName: string, args: any) {
		const listener = this.listeners[evName];

		if (listener) {
			listener(args);
		}
	}
}

export default EventEmitter;