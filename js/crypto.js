const subtle = crypto.subtle;
const enc = new TextEncoder();

/**
 * String to 256-bit hash byte-stream.
 * text: string
 */
export function sha256Bytes(text) {
	return subtle.digest("SHA-256", enc.encode(text));
}

/**
 * Derive a per-app key with PBKDF2-HMAC-SHA-256 (calibrated).
 * passKey: string (master passphrase)
 * appString: string (verbatim); salt = SHA-256("salt|" + appstring)
 * opts: { targetMs=400, minIters=150_000, maxIters=3_000_000, dkLen=32 }
 */
export async function deriveSiteKey(
	passKey,
	appString,
	{ iters = 3000000, dkLen = 32 } = {}
) {
	// public, deterministic, per-app salt
	const salt = await sha256Bytes("salt|" + appString);

	// import master passkey for PBKDF2
	const baseKey = await subtle.importKey(
		"raw",
		enc.encode(passKey),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	// final derivation at calibrated iterations
	const bits = await subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: iters },
		baseKey,
		dkLen * 8
	);

	return bits;
}

/**
 * Expand HKDF-SHA-256 to `length` bytes for a given purpose label (`info`).
 * ikmBytes: ArrayBuffer/TypedArray (the 32B site key from deriveSiteKey)
 * saltBytes: ArrayBuffer (use hkdfSaltFor(appString))
 * info: short ASCII label, e.g., "password", "compliance"
 */
export async function hkdfExpand(
	ikmBytes,
	appString,
	info,
	{ kLen = 12 } = {}
) {
	const salt = await subtle.digest("SHA-256", enc.encode("hkdf|" + appString));

	// import derived key for HKDF
	const ikmKey = await subtle.importKey(
		"raw",
		ikmBytes,
		"HKDF",
		false,
		["deriveBits"]
	);

	// derive final key
	const bits = await subtle.deriveBits(
		{ name: "HKDF", hash: "SHA-256", salt: salt, info: enc.encode(info), },
		ikmKey,
		kLen * 8
	);

	return bits;
}

/**
 * Deterministic integer sampler from a byte buffer.
 * bytes: ArrayBuffer/TypedArray
 * Returns: function sample(n) -> number uniformly in [0, n)
 * Method: uses 32-bit rejection sampling to avoid modulo bias; cycles through
 *         the byte buffer deterministically, so same inputs yield same outputs.
 */
function makeSampler(bytes) {
	const v = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let i = 0;

	const nextU32 = () => {
		const a = v[i++ % v.length];
		const b = v[i++ % v.length];
		const c = v[i++ % v.length];
		const d = v[i++ % v.length];

		return (((a * 0x1000000) + (b << 16) + (c << 8) + d) >>> 0);
	};

	return (n) => {
		const RANGE = 0x100000000;
		const LIMIT = Math.floor(RANGE / n) * n;

		while (true) {
			const x = nextU32();
			if (x < LIMIT) return x % n;
		}
	};
}

/**
 * Append a deterministic numeric tail to a passphrase.
 * basePass: string
 * cmpBytes: ArrayBuffer/TypedArray
 * opts: { digits=4, sep="-" }
 * Returns: string (eg. "Luau-Nail-Item-...-4823")
 */
export function appendDigitTail(
	basePass,
	cmpBytes,
	{ digits = 4, sep = "-" } = {}
) {
	const sample = makeSampler(cmpBytes);
	let tail = "";

	for (let i = 0; i < digits; i++) {
		tail += String(sample(10));
	}

	return `${basePass}${sep}${tail}`;
}
