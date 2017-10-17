function setup() {
  	var canvas = createCanvas(500, 500);
  	canvas.parent(document.getElementById('sketch-canvas'))
	background(142,31,51);
}

function drawHex( x, y, len, shapeColor) {
	fill(shapeColor);
	beginShape();
	vertex(x - len, y - sqrt(3) * len);
	vertex(x + len, y - sqrt(3) * len);
	vertex(x + 2 * len, y);
	vertex(x + len, y + sqrt(3) * len);
	vertex(x - len, y + sqrt(3) * len);
	vertex(x - 2 * len, y);
	endShape(CLOSE);
}

function draw() {
	background(142,31,51);
	translate(width/2, height/2);

	for (var i = 0; i < 8; i++) {
		push();
		rotate(TWO_PI * i / 8);
		var tx = 200 * noise(0.01*frameCount);
		translate(tx, 0);
		for (var j = 0; j < 6; j++) {
			push();
			rotate(TWO_PI * j / 6);
			var rx = 60 * noise(0.01*frameCount + 10);
			randomColor = color(random(255), random(255), random(255));
			drawHex(rx, 0, random(10), randomColor);
			pop();
		}		
		translate();
		pop();
	}
}
