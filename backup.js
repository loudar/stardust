/*
This file contains code that was used in older versions of the program, but was not worth to be deleted entirely.
Use this for anything you want :D
 */

// evade mouse (2D)
if (circleEl.x > mouseX - catchRadius && circleEl.x < mouseX + catchRadius && circleEl.y > mouseY - catchRadius
    && circleEl.y < mouseY + catchRadius && !circleEl.lockV) {
    let distNow = sqrt(pow((mouseX - circleEl.x), 2) + pow((mouseY - circleEl.y), 2));
    let distThen = sqrt(pow((mouseX - (circleEl.x + circleEl.vx)), 2) + pow((mouseY - (circleEl.y + circleEl.vy)), 2));
    if (distThen < distNow) {
        circleEl.vx *= -5;
        circleEl.vy *= -5;
    } else {
        circleEl.vx *= -5;
        circleEl.vy *= 5;
    }
    circleEl.lockV = true;
} else if (!(circleEl.x > mouseX - catchRadius && circleEl.x < mouseX + catchRadius && circleEl.y > mouseY - catchRadius
    && circleEl.y < mouseY + catchRadius) && circleEl.lockV) {
    circleEl.vx *= .8;
    circleEl.vy *= .8;
    circleEl.lockV = false;
}

// sphere
translate(circleEl.x, circleEl.y, 0);
stroke(hue, saturation, brightness, opacity);
fill(0, 0);
sphere(circleEl.size / 2, 4, 4);
translate(-circleEl.x, -circleEl.y, 0);

// mouse
/*strokeWeight(0);
let plusSize = 6;
fill(255);
rect(mouseX - plusSize, mouseY - (plusSize / 6), plusSize * 2, plusSize / 3);
rect(mouseX - (plusSize / 6), mouseY - plusSize, plusSize / 3, plusSize * 2);
strokeWeight(.5);*/

// circle add mouse
// while (x > mouseX - catchRadius && x < mouseX + catchRadius
//         && y > mouseY - catchRadius && y < mouseY + catchRadius) {
//     x = random(0, width);
//     y = random(0, height);
// }