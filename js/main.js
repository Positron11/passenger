import { deriveSiteKey, hkdfExpand, appendDigitTail } from "./crypto.js";
import { encodeBytewords } from "./words.js";
import { debounce } from "./utils.js";

const passkeyInput = document.getElementById("Passkey");
const usageInput = document.getElementById("Application");
const passphraseSpan = document.getElementById("Canvas");
const autoCopyToggle = document.getElementById("AutoCopy");

const debouncedUpdate = debounce(updatePassphraseSpan, { wait: 500 });

// initial render
updatePassphraseSpan();

usageInput.addEventListener("input", (e) => {
	// sanitize: lowercase, no whitespace
	e.target.value = e.target.value.replace(/\s+/g, "").toLowerCase();
});

usageInput.addEventListener("input", debouncedUpdate);
passkeyInput.addEventListener("input", debouncedUpdate);

async function updatePassphraseSpan() {
	const hasApp = usageInput.value.trim().length > 0;
	const hasPass = passkeyInput.value.length > 0;

	if (hasApp && hasPass) {
		// derive byte streams
		const baseKey = await deriveSiteKey(passkeyInput.value, usageInput.value);

		const pwdBytes = await hkdfExpand(baseKey, usageInput.value, "password", { kLen: 9 });
		const cmpBytes = await hkdfExpand(baseKey, usageInput.value, "compliance");

		// construct passkey
		const passphrase = appendDigitTail(encodeBytewords(pwdBytes), cmpBytes);

		// update passphrase display
		passphraseSpan.textContent = passphrase;
		passphraseSpan.classList.remove("sEmpty");

		// copy to clipboard
		if (autoCopyToggle.checked) {
			await navigator.clipboard.writeText(passphrase);
		}
	}

	else {
		debouncedUpdate.cancel?.();

		// set empty state
		passphraseSpan.textContent = "Enter passkey and usage...";
		passphraseSpan.classList.add("sEmpty");
	}
}
