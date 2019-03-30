/* @flow */

/**
 * Lightweight EventEmitter implementation support for multiple javascript platforms
 */
class EventEmitter {
	/* Property types */
	listeners: { [string]: function[] };

	constructor() {
		this.listeners = {};
	}

	/**
	 * Add Event Listener
	 * @param {string} evName 
	 * @param {function} handler 
	 */
	on(evName: string, handler: function) {
		if(typeof this.listeners[evName] === 'undefined') {
			this.listeners[evName] = [];
		}

		this.listeners[evName].push(evName);;
	}

	/**
	 * Remove Event Listener or all listeners
	 * @param {string} evName 
	 * @param {string} [handler] - Listener function. If it's undefined, remove all listeners of evName.
	 */
	off(evName: string, handler?: function) {
		// If handler parameter is empty, remove all listeners
		if(typeof handler === 'undefined') {
			delete this.listeners[evName];
		}
		else {
			const evList = this.listeners[evName] || [];

			for(let i = 0; i < evList.length; i++) {
				if(evList[i] === handler) {
					evList.splice(i, 1);
					break;
				}
			}
		}
	}

	/**
	 * Emit the specified event
	 * @param {string} evName 
	 * @param {...args}
	 */
	emit(evName: string) {
		const evList = this.listeners[evName];
		const args = Array.from(arguments);
		args.splice(0, 1);	// Remove first paramter
		
		for(let i = 0; i < evList.length; i++ ){
			evList[i].apply(null, args);
		}
	}
}

export default EventEmitter;