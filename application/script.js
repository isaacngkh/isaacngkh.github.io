const PPI = 264;

const ROWS = 8;
const COLUMNS = 12;

const SCALE = 80;

const MARKER_UNIT_WIDTH = 0;
const MARKER_UNIT_HEIGHT = 0;

const SQUARE_UNIT_WIDTH = MARKER_UNIT_WIDTH + 2;
const SQUARE_UNIT_HEIGHT = MARKER_UNIT_HEIGHT + 2;

const MARKER_SIZE_PX = MARKER_UNIT_WIDTH * SCALE;
const MARKER_SIZE_IN = MARKER_SIZE_PX / PPI;

const SQUARE_SIZE_PX = SQUARE_UNIT_WIDTH * SCALE;
const SQUARE_SIZE_IN = SQUARE_SIZE_PX / PPI;

async function get_maker_dictionary() {
  const res = await fetch("dict.json");
	const marker_data = await res.json();

	return marker_data;
}

function get_marker_bits(marker_dictionary, marker_family, id) {
	const marker = marker_dictionary[marker_family];
	let bits = [];

	for (let byte of marker["data"][id]) {
		const start = (marker["width"] * marker["height"]) - bits.length;

		for (let i = Math.min(7, start - 1); i >= 0; i--) {
			bits.push((byte >> i) & 1);
		}
	}

	return bits;
}

function draw_marker(ctx, bits, x, y, size) {
	const pixel_width = size / MARKER_UNIT_WIDTH;
	const pixel_height = size / MARKER_UNIT_HEIGHT;

	for (let i = 0; i < MARKER_UNIT_HEIGHT; i++) {
		for (let j = 0; j < MARKER_UNIT_WIDTH; j++) {
			if (i == 0 || i == MARKER_UNIT_HEIGHT - 1 || j == 0 || j == MARKER_UNIT_WIDTH - 1) {
				ctx.fillRect(x + (pixel_width * j), y + (pixel_width * i), pixel_width, pixel_height);
			}
		}
	}

	for (let i = 0; i < MARKER_UNIT_HEIGHT - 2; i++) {
		for (let j = 0; j < MARKER_UNIT_WIDTH - 2; j++) {
			const white = bits[i * (MARKER_UNIT_HEIGHT - 2) + j];

			if (!white) {
				ctx.fillRect(x + (pixel_width * (j + 1)), y + (pixel_width * (i + 1)), pixel_width, pixel_height);
			}
		}
	}
}

function draw_board(ctx, marker_dictionary) {
	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col < COLUMNS; col++) {
			let count = col;

			if (row % 2 == 0) {
				count += 1;
			}

			if (count % 2 == 0) {
				ctx.fillRect(col * SQUARE_SIZE_PX, row * SQUARE_SIZE_PX, SQUARE_SIZE_PX, SQUARE_SIZE_PX);
			} else {
				const marker_id = Math.floor(((row * COLUMNS) + col) / 2);
				const bits = get_marker_bits(marker_dictionary, "aruco_5x5_1000", marker_id);

				const margin = (SQUARE_SIZE_PX - MARKER_SIZE_PX) / 2;

				draw_marker(ctx, bits, (col * SQUARE_SIZE_PX) + margin, (row * SQUARE_SIZE_PX) + margin, MARKER_SIZE_PX);
			}
		}
	}

	document.querySelector("#text").textContent = COLUMNS + " x " + ROWS + " | Square size: " + SQUARE_SIZE_IN + "\" | Marker size: " + MARKER_SIZE_IN + "\"" + " | PPI: " + PPI;
}

async function run() {
	const marker_dictionary = await get_maker_dictionary();

	const canvas = document.querySelector("canvas");
	const ctx = canvas.getContext("2d");

	canvas.style.width = ((SQUARE_SIZE_PX * COLUMNS) / window.devicePixelRatio) + "px";
	canvas.style.height = ((SQUARE_SIZE_PX * ROWS) / window.devicePixelRatio) + "px";
	canvas.width = ctx.canvas.clientWidth * window.devicePixelRatio;
	canvas.height = ctx.canvas.clientHeight * window.devicePixelRatio;

	visualViewport.addEventListener("resize", (event) => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (event.target.scale === 1) {
			ctx.fillStyle = "#000000";
		} else {
			ctx.fillStyle = "#FF0000";
		}

		draw_board(ctx, marker_dictionary);
	});

	if (visualViewport.scale == 1) {
		ctx.fillStyle = "#000000";
	} else {
		ctx.fillStyle = "#FF0000";
	}

	draw_board(ctx, marker_dictionary);
}

run();
