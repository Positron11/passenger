/**
 * Construct a debounced wrapper for a function.
 * fn: target function
 */
export function debounce(fn, { wait = 50 } = {}) {
	let t, lastArgs, lastThis;

	// main debouncer
	function debounced(...args) {
		lastArgs = args;
		lastThis = this;

		clearTimeout(t);

		t = setTimeout(() => {
			t = null;

			fn.apply(lastThis, lastArgs);
		}, wait);
	}

	// cancel scheduled run
	debounced.cancel = () => {
		clearTimeout(t);
		t = null;
	};

	// run immediately if pending
	debounced.flush = () => {
		if (t) {
			clearTimeout(t);
			t = null;

			fn.apply(lastThis, lastArgs);
		}
	};

	return debounced;
}